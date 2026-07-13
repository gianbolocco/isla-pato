// 🛠️ PANEL DE DESARROLLO (TEMPORAL). Teletransporta por las islas para testear sin jugar
// todo el recorrido. Se prende con `DEBUG` en config.js. Para sacarlo antes de publicar:
// poné DEBUG=false (o borrá este archivo + su uso en main.js).
//
// Atajos de teclado (funcionan incluso con el mouse capturado):
//   1..5  → saltar a cada isla        ·   0 → volver al inicio (cabaña)
//   \`    → mostrar/ocultar el panel   ·   botones clickeables (soltá el mouse con Esc)

const ISLANDS = [
  { key: 'pato',      digit: '1', label: '🌴 Isla Pato' },
  { key: 'caboRoca',  digit: '2', label: '🪨 Cabo Roca' },
  { key: 'cala',      digit: '3', label: '🎣 Cala Pescador' },
  { key: 'bunker',    digit: '4', label: '🔌 El Búnker' },
  { key: 'naufragio', digit: '5', label: '🐾 Cala Naufragio' },
];

export class DevPanel {
  constructor(game) {
    this.game = game;
    this._build();
    this._buildToggle();
    this._bindKeys();
    this._tick();
  }

  _warp(key) { this.game.story.devWarp(key); }

  // Botón ESCONDIDO: una zona discreta casi invisible en la esquina superior izquierda que
  // despliega/oculta el panel (para no mostrarlo al compartir el juego). También la tecla `.
  _buildToggle() {
    const t = document.createElement('div');
    t.title = 'dev';
    Object.assign(t.style, {
      position: 'fixed', top: '0', left: '0', width: '28px', height: '28px',
      zIndex: '10000', cursor: 'pointer', borderRadius: '0 0 8px 0',
      background: 'rgba(255,255,255,0.04)',
    });
    t.onmouseenter = () => (t.style.background = 'rgba(120,160,220,0.35)');
    t.onmouseleave = () => (t.style.background = 'rgba(255,255,255,0.04)');
    t.onclick = () => { this.el.style.display = this.el.style.display === 'none' ? 'block' : 'none'; };
    document.body.appendChild(t);
  }

  _build() {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; top:12px; right:12px; z-index:9999;
      font-family:system-ui,Segoe UI,sans-serif; color:#eaf2ff;
      background:rgba(18,24,38,0.86); border:1px solid rgba(120,160,220,0.35);
      border-radius:10px; padding:10px 11px; width:190px; user-select:none;
      box-shadow:0 6px 20px rgba(0,0,0,0.4); backdrop-filter:blur(4px);
    `;

    const title = document.createElement('div');
    title.textContent = '🛠️ DEV — islas';
    title.style.cssText = 'font-weight:700; font-size:13px; margin-bottom:8px; letter-spacing:.02em;';
    el.appendChild(title);

    for (const isl of ISLANDS) {
      const b = document.createElement('button');
      b.innerHTML = `<span style="opacity:.6">${isl.digit}</span>&nbsp; ${isl.label}`;
      b.style.cssText = this._btnCss();
      b.onmouseenter = () => (b.style.background = 'rgba(90,140,220,0.35)');
      b.onmouseleave = () => (b.style.background = 'rgba(255,255,255,0.06)');
      b.onclick = () => this._warp(isl.key);
      el.appendChild(b);
    }

    // Acción extra: destrabar todos los pasos (puente, reja, levadizo) sin teleportar.
    const unlock = document.createElement('button');
    unlock.textContent = '🔓 Destrabar todo';
    unlock.style.cssText = this._btnCss() + 'margin-top:6px;';
    unlock.onmouseenter = () => (unlock.style.background = 'rgba(90,140,220,0.35)');
    unlock.onmouseleave = () => (unlock.style.background = 'rgba(255,255,255,0.06)');
    unlock.onclick = () => {
      this.game.world.repairBridge();
      this.game.world.openGate();
      this.game.world.lowerDrawbridge();
    };
    el.appendChild(unlock);

    // Saltar al FINAL (abordaje del barco pirata: cañonazo → llave → liberar a Gian).
    const finale = document.createElement('button');
    finale.innerHTML = '<span style="opacity:.6">9</span>&nbsp; 🏴‍☠️ Final (barco pirata)';
    finale.style.cssText = this._btnCss() + 'margin-top:6px;';
    finale.onmouseenter = () => (finale.style.background = 'rgba(90,140,220,0.35)');
    finale.onmouseleave = () => (finale.style.background = 'rgba(255,255,255,0.06)');
    finale.onclick = () => { if (this.game.finale) this.game.finale.start(); };
    el.appendChild(finale);

    // Info en vivo: coordenadas + objetivo actual.
    this.info = document.createElement('div');
    this.info.style.cssText = 'font-size:11px; line-height:1.5; margin-top:8px; opacity:.8; word-break:break-word;';
    el.appendChild(this.info);

    const hint = document.createElement('div');
    hint.textContent = 'Teclas 1–5 islas · 9 final · 0 inicio · ` oculta';
    hint.style.cssText = 'font-size:10px; margin-top:7px; opacity:.5;';
    el.appendChild(hint);

    el.style.display = 'none';   // arranca OCULTO; se abre con el botón escondido o la tecla `
    document.body.appendChild(el);
    this.el = el;
  }

  _btnCss() {
    return `
      display:block; width:100%; text-align:left; margin:3px 0; padding:6px 9px;
      font-size:12px; color:#eaf2ff; cursor:pointer;
      background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);
      border-radius:7px;
    `;
  }

  _bindKeys() {
    window.addEventListener('keydown', (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;   // no interferir con campos de texto
      if (e.code === 'Backquote') { this.el.style.display = this.el.style.display === 'none' ? 'block' : 'none'; return; }
      if (e.code === 'Digit9' || e.code === 'Numpad9') { this.game.finale && this.game.finale.start(); return; }  // saltar al FINAL
      if (this.game.uiActive) return;   // no warpear con un diálogo/teclado abierto (evita choques)
      if (e.code === 'Digit0' || e.code === 'Numpad0') { this._warp('pato'); return; }
      for (const isl of ISLANDS) {
        if (e.code === 'Digit' + isl.digit || e.code === 'Numpad' + isl.digit) { this._warp(isl.key); return; }
      }
    });
  }

  _tick() {
    const p = this.game.player.position;
    this.info.innerHTML =
      `x ${p.x.toFixed(0)}  y ${p.y.toFixed(1)}  z ${p.z.toFixed(0)}<br>` +
      `<span style="opacity:.7">🎯 ${this.game.story.objectiveText}</span>`;
    requestAnimationFrame(() => this._tick());
  }
}
