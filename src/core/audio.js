import { SOUND } from '../config.js';

// 🔊 Motor de sonido del juego — TODO sintetizado con la Web Audio API (sin archivos de
// audio: coherente con el resto del proyecto, que genera texturas/modelos por código, y así
// el juego "abre y anda" desde un link sin bajar assets).
//
// Grafo:  fuentes → sfxBus / ambientBus → master → destino
//
// Es un SINGLETON (se exporta `audio`) para no tener que pasar la referencia por media docena
// de constructores; cualquier módulo hace `import { audio }` y llama audio.pickup(), etc.
//
// Autoplay: los navegadores no dejan sonar hasta un gesto del usuario. `init()` engancha el
// primer pointerdown/keydown (el click de "Empezar" ya sirve) para crear/resumir el contexto
// y arrancar el ambiente. Antes de eso, todos los métodos son no-ops silenciosos.
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;               // contexto creado y corriendo
    this.enabled = SOUND.enabled;     // toggle (tecla M)
    this._noise = null;               // buffer de ruido blanco cacheado
    this._gullTimer = 0;              // cuenta regresiva para la próxima gaviota
    this._fires = [];                 // hogueras: [{x, z}] para el crepitar por cercanía
    this._crackleTimer = 0;           // agenda los chasquidos de la hoguera
  }

  // Registra una hoguera (posición mundo). El crepitar suena según la cercanía del jugador.
  addFire(x, z) { this._fires.push({ x, z }); }

  // Engancha el primer gesto del usuario para desbloquear el audio + tecla M para mutear.
  init() {
    if (this._inited) return;
    this._inited = true;
    const unlock = () => this._unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') this.toggle();
    });
  }

  _unlock() {
    if (this.ready) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this._buildGraph();
      this._startAmbient();
      this.ready = true;
      // Aplica el estado de mute actual por si se toggleó antes de desbloquear.
      this.master.gain.value = this.enabled ? SOUND.master : 0;
    } catch (e) {
      // Sin Web Audio (o bloqueado): el juego sigue sin sonido.
      this.ready = false;
    }
  }

  _buildGraph() {
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = SOUND.master;
    this.master.connect(ctx.destination);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = SOUND.sfx;
    this.sfxBus.connect(this.master);

    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = SOUND.ambient;
    this.ambientBus.connect(this.master);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.ready) this.master.gain.value = this.enabled ? SOUND.master : 0;
    return this.enabled;
  }

  // Buffer de ruido blanco reutilizable (base de oleaje, pisadas, viento del salto).
  _noiseBuffer() {
    if (this._noise) return this._noise;
    const ctx = this.ctx;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this._noise = buf;
    return buf;
  }

  // ---- Ambiente: oleaje continuo + gaviotas ocasionales ----

  _startAmbient() {
    const ctx = this.ctx;
    const buf = this._noiseBuffer();

    // Dos capas de ruido filtrado = mar: un rumor grave + el siseo de la espuma, cada
    // uno "respirando" con un LFO lento (el vaivén de las olas).
    const makeLayer = (filterType, freq, Q, base, lfoRate, lfoDepth) => {
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const flt = ctx.createBiquadFilter();
      flt.type = filterType; flt.frequency.value = freq; flt.Q.value = Q;
      const g = ctx.createGain();
      g.gain.value = base * SOUND.waves;
      src.connect(flt).connect(g).connect(this.ambientBus);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine'; lfo.frequency.value = lfoRate;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = lfoDepth * SOUND.waves;
      lfo.connect(lfoGain).connect(g.gain);
      src.start(); lfo.start();
    };

    makeLayer('lowpass', 380, 0.7, 0.16, 0.09, 0.10);   // rumor grave del mar
    makeLayer('bandpass', 900, 0.6, 0.10, 0.13, 0.09);  // siseo de la espuma

    this._gullTimer = rand(SOUND.gullMin, SOUND.gullMax) * 0.4; // la primera, prontito

    // Hoguera: un siseo/rugido continuo (ruido filtrado) con gain 0; se sube según la
    // cercanía a la hoguera más próxima (los chasquidos se agendan en update()).
    const fsrc = ctx.createBufferSource();
    fsrc.buffer = buf; fsrc.loop = true;
    const flp = ctx.createBiquadFilter();
    flp.type = 'lowpass'; flp.frequency.value = 620; flp.Q.value = 0.4;
    this.fireGain = ctx.createGain();
    this.fireGain.gain.value = 0;
    fsrc.connect(flp).connect(this.fireGain).connect(this.ambientBus);
    fsrc.start();
  }

  // Graznido de gaviota: varios "caws" con glissando descendente y vibrato, paneados al azar.
  _seagull() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.25;
    let node = out;
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.random() * 1.6 - 0.8;
      out.connect(pan); node = pan;
    }
    node.connect(this.ambientBus);

    const caws = 2 + Math.floor(Math.random() * 3);
    const f0 = 900 + Math.random() * 400;
    let t = ctx.currentTime + 0.02;
    for (let i = 0; i < caws; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 5;
      const g = ctx.createGain();
      osc.connect(bp).connect(g).connect(out);

      osc.frequency.setValueAtTime(f0 * 1.5, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.75, t + 0.16);
      // vibrato del graznido
      const vib = ctx.createOscillator();
      vib.type = 'sine'; vib.frequency.value = 22;
      const vibG = ctx.createGain(); vibG.gain.value = 40;
      vib.connect(vibG).connect(osc.frequency);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.start(t); vib.start(t); osc.stop(t + 0.24); vib.stop(t + 0.24);
      t += 0.16 + Math.random() * 0.12;
    }
  }

  // Se llama cada frame desde el loop: agenda las gaviotas y el crepitar de la hoguera.
  // playerPos: {x,z} para el crepitar por cercanía (opcional).
  update(dt, playerPos) {
    if (!this.ready || !this.enabled) return;
    this._gullTimer -= dt;
    if (this._gullTimer <= 0) {
      this._seagull();
      this._gullTimer = rand(SOUND.gullMin, SOUND.gullMax);
    }
    this._updateFire(dt, playerPos);
  }

  _updateFire(dt, playerPos) {
    if (!this.fireGain || !playerPos || !this._fires.length) return;
    const R = 12;   // radio audible de la hoguera
    let near = Infinity;
    for (const f of this._fires) {
      const d = Math.hypot(playerPos.x - f.x, playerPos.z - f.z);
      if (d < near) near = d;
    }
    const prox = Math.max(0, 1 - near / R);   // 0 lejos → 1 encima
    // Sube/baja suave el rugido de fondo.
    const target = prox * 0.16;
    const g = this.fireGain.gain;
    g.value += (target - g.value) * Math.min(1, dt * 4);
    // Chasquidos: sólo cuando estás cerca, a intervalos cortos irregulares.
    if (prox > 0.05) {
      this._crackleTimer -= dt;
      if (this._crackleTimer <= 0) {
        this._crackleTimer = 0.05 + Math.random() * 0.28;
        this._noiseHit({ type: 'highpass', freq: 2200 + Math.random() * 1500, dur: 0.02 + Math.random() * 0.03, vol: prox * (0.1 + Math.random() * 0.14) });
      }
    }
  }

  // ---- Efectos ----

  // Golpe de ruido filtrado (base de pisadas, aterrizaje, viento). `at` opcional para agendar.
  _noiseHit({ type, freq, Q = 1, dur, vol, sweepTo, at }) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer();
    const flt = ctx.createBiquadFilter();
    flt.type = type; flt.frequency.value = freq; flt.Q.value = Q;
    const g = ctx.createGain();
    const t = at || ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (sweepTo) flt.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    src.connect(flt).connect(g).connect(this.sfxBus);
    src.start(t); src.stop(t + dur + 0.02);
  }

  // Tono corto (blips de agarrar/interactuar).
  _tone({ type = 'triangle', from, to, dur, vol, delay = 0 }) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = type;
    const g = ctx.createGain();
    const t = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(from, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // Pisada: cada superficie se arma con DOS capas (contacto del pie + material) para que
  // suene orgánica y no un "blip". El tono varía un poco en cada paso (que no suenen clonadas).
  footstep(surface) {
    if (!this.ready || !this.enabled) return;
    const p = 0.82 + Math.random() * 0.36;   // variación de tono por paso
    const v = SOUND.footstep;
    if (surface === 'sand') {
      // Arena: "shhf" suave y apagado, sin golpe seco.
      this._noiseHit({ type: 'lowpass', freq: 780 * p, Q: 0.5, dur: 0.15, vol: v * 0.7 });
      this._noiseHit({ type: 'highpass', freq: 3200 * p, dur: 0.05, vol: v * 0.18 }); // granitos
    } else if (surface === 'rock') {
      // Roca: contacto seco y agudo + un toque de cuerpo grave.
      this._noiseHit({ type: 'highpass', freq: 2300 * p, Q: 0.9, dur: 0.045, vol: v * 0.5 });
      this._noiseHit({ type: 'lowpass', freq: 520 * p, dur: 0.04, vol: v * 0.35 });
    } else { // 'grass' (por defecto): golpe blando del pie + roce de las briznas
      this._noiseHit({ type: 'lowpass', freq: 360 * p, Q: 0.6, dur: 0.05, vol: v * 0.5 });   // pisada
      this._noiseHit({ type: 'bandpass', freq: 2700 * p, Q: 1.1, dur: 0.07, vol: v * 0.5 }); // roce del pasto
    }
  }

  jump() {
    if (!this.ready || !this.enabled) return;
    // Impulso de piernas (golpe grave corto) + "esfuerzo" de aire que sube (whoosh filtrado,
    // SIN tono puro para que no suene a videojuego viejo).
    this._noiseHit({ type: 'lowpass', freq: 340, dur: 0.05, vol: 0.18 });
    this._noiseHit({ type: 'bandpass', freq: 850, Q: 0.9, dur: 0.14, vol: 0.16, sweepTo: 2200 });
  }

  land(surface) {
    if (!this.ready || !this.enabled) return;
    // Impacto grave (cuerpo) + dispersión del material (roce de pasto/tierra al caer).
    this._noiseHit({ type: 'lowpass', freq: 620, dur: 0.13, vol: 0.32, sweepTo: 130 });
    const scatter = surface === 'sand' ? 2400 : surface === 'rock' ? 3200 : 2000;
    this._noiseHit({ type: 'bandpass', freq: scatter, Q: 1.0, dur: 0.07, vol: 0.16 });
    this._tone({ type: 'sine', from: 150, to: 70, dur: 0.11, vol: 0.16 });   // sub grave sutil (peso)
  }

  pickup() {
    if (!this.ready || !this.enabled) return;
    // Arpegio alegre ascendente.
    this._tone({ type: 'triangle', from: 880, to: 880, dur: 0.1, vol: 0.3 });
    this._tone({ type: 'triangle', from: 1320, to: 1320, dur: 0.12, vol: 0.28, delay: 0.09 });
  }

  interact() {
    if (!this.ready || !this.enabled) return;
    this._tone({ type: 'sine', from: 660, to: 720, dur: 0.11, vol: 0.24 });
  }

  // Blip de diálogo: un pip corto cuyo tono depende del personaje (voz reconocible por NPC).
  blip(speaker) {
    if (!this.ready || !this.enabled) return;
    let h = 0;
    const s = speaker || '';
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
    const base = 300 + (h % 360);   // ~300–660 Hz según el nombre
    this._tone({ type: 'square', from: base, to: base * 1.12, dur: 0.06, vol: 0.06 });
  }

  // ---- Teclado de la reja ----
  keypadPress() {
    if (!this.ready || !this.enabled) return;
    this._tone({ type: 'square', from: 620, to: 620, dur: 0.05, vol: 0.09 });
  }
  keypadOk() {
    if (!this.ready || !this.enabled) return;
    this._tone({ type: 'triangle', from: 700, to: 700, dur: 0.1, vol: 0.24 });
    this._tone({ type: 'triangle', from: 1050, to: 1050, dur: 0.14, vol: 0.22, delay: 0.1 });
  }
  keypadFail() {
    if (!this.ready || !this.enabled) return;
    this._tone({ type: 'sawtooth', from: 200, to: 130, dur: 0.22, vol: 0.16 });
  }

  // Mecanismo pesado (reja que sube / puente levadizo que baja): chirrido + traqueteo de cadena.
  mechanism() {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx, t0 = ctx.currentTime, dur = 1.7;
    // Chirrido: diente de sierra grave con vibrato (roce de metal) y filtro pasa-banda.
    const osc = ctx.createOscillator(); osc.type = 'sawtooth';
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = 7;
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(95, t0);
    osc.frequency.linearRampToValueAtTime(72, t0 + dur);
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 6.5;
    const lfoG = ctx.createGain(); lfoG.gain.value = 22;
    lfo.connect(lfoG).connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.25);
    g.gain.setValueAtTime(0.14, t0 + dur - 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(bp).connect(g).connect(this.sfxBus);
    osc.start(t0); lfo.start(t0); osc.stop(t0 + dur); lfo.stop(t0 + dur);
    // Cadena: chasquidos metálicos agudos repartidos en el tiempo.
    for (let i = 0; i < 9; i++) {
      const at = t0 + 0.15 + Math.random() * (dur - 0.3);
      this._noiseHit({ type: 'highpass', freq: 2600 + Math.random() * 1200, Q: 1.2, dur: 0.03, vol: 0.06 + Math.random() * 0.05, at });
    }
  }

  // Chapuzón al caer al agua.
  splash() {
    if (!this.ready || !this.enabled) return;
    this._noiseHit({ type: 'bandpass', freq: 1200, Q: 0.6, dur: 0.35, vol: 0.4, sweepTo: 300 });  // el "plosh"
    this._noiseHit({ type: 'highpass', freq: 3500, dur: 0.25, vol: 0.16 });                        // salpicadura
    this._tone({ type: 'sine', from: 420, to: 120, dur: 0.18, vol: 0.14 });                        // burbujeo grave
  }

  // Maullido de Rosa (dos tonos con glissando, timbre felino).
  meow() {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx, t0 = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = 'sawtooth';
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 4;
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(650, t0);
    osc.frequency.linearRampToValueAtTime(950, t0 + 0.12);   // "miii"
    osc.frequency.linearRampToValueAtTime(500, t0 + 0.4);    // "aau"
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    osc.connect(bp).connect(g).connect(this.sfxBus);
    osc.start(t0); osc.stop(t0 + 0.47);
  }

  // Graznido del loro Juancho (áspero, dos "squawks").
  squawk() {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    for (let i = 0; i < 2; i++) {
      const t0 = ctx.currentTime + i * 0.16;
      const osc = ctx.createOscillator(); osc.type = 'square';
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 3;
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(1100, t0);
      osc.frequency.exponentialRampToValueAtTime(700, t0 + 0.12);
      const vib = ctx.createOscillator(); vib.type = 'square'; vib.frequency.value = 35;
      const vibG = ctx.createGain(); vibG.gain.value = 90;
      vib.connect(vibG).connect(osc.frequency);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      osc.connect(bp).connect(g).connect(this.sfxBus);
      osc.start(t0); vib.start(t0); osc.stop(t0 + 0.16); vib.stop(t0 + 0.16);
    }
  }

  // ---- Final ----
  // Cañonazo: fogonazo + boom grave + silbido de la bola.
  cannon() {
    if (!this.ready || !this.enabled) return;
    this._noiseHit({ type: 'lowpass', freq: 220, dur: 0.5, vol: 0.6, sweepTo: 60 });   // boom
    this._noiseHit({ type: 'highpass', freq: 2000, dur: 0.12, vol: 0.3 });             // fogonazo
    this._tone({ type: 'sine', from: 90, to: 45, dur: 0.45, vol: 0.28 });              // cuerpo grave
    this._tone({ type: 'sine', from: 2200, to: 700, dur: 0.5, vol: 0.06, delay: 0.05 }); // silbido de la bola
  }

  // Lulu sale volando: whoosh ascendente cómico + gritito.
  luluFly() {
    if (!this.ready || !this.enabled) return;
    this._noiseHit({ type: 'bandpass', freq: 500, Q: 1.2, dur: 0.6, vol: 0.22, sweepTo: 3000 }); // whoosh que sube
    const ctx = this.ctx, t0 = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = 'triangle';
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(300, t0);
    osc.frequency.exponentialRampToValueAtTime(1400, t0 + 0.55);   // "¡wiiii!"
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t0); osc.stop(t0 + 0.62);
  }

  // Jaula abriéndose: cerrojo + chirrido de reja metálica.
  cageOpen() {
    if (!this.ready || !this.enabled) return;
    this._noiseHit({ type: 'highpass', freq: 2400, dur: 0.05, vol: 0.18 });   // cerrojo (clack)
    const ctx = this.ctx, t0 = ctx.currentTime + 0.08, dur = 0.7;
    const osc = ctx.createOscillator(); osc.type = 'sawtooth';
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 6;
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(160, t0);
    osc.frequency.linearRampToValueAtTime(120, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(bp).connect(g).connect(this.sfxBus);
    osc.start(t0); osc.stop(t0 + dur);
  }
}

function rand(a, b) { return a + Math.random() * (b - a); }

export const audio = new AudioEngine();
