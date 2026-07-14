import * as THREE from 'three';
import { LuluModel } from '../entities/LuluModel.js';
import { GianluccaModel } from '../entities/GianluccaModel.js';
import { buildCage } from '../world/props/cage.js';
import { makeCannon } from '../world/props/cannon.js';
import { playLines } from './conversation.js';
import { TEXTOS } from '../textos.js';
import { audio } from '../core/audio.js';

// Final de la historia (abordaje del Pato Mareado). Máquina de estados: Belu camina por la
// cubierta → dispara el cañón a Lulu (E) → Lulu sale volando y suelta la llave → agarrar la
// llave → abrir la jaula (E) → sale Gian → reencuentro + carta dedicada + "Fin". Disparado por
// game.finale.start() desde el abordaje. Toma la UI de game.story; usa game.cutsceneActive para
// la escena del reencuentro (cámara propia).
export class Finale {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.cinematic = false;
    this.state = 'idle';
    this._t = 0; this._reuT = 0;
    this._msgShown = false;
    this._card = this._buildCard();
  }

  start() {
    if (this.active) return;
    const g = this.game, story = g.story;
    this.scene = g.scene; this.world = g.world; this.player = g.player; this.camera = g.camera;
    this.interaction = story.interaction; this.dialogue = story.dialogue;
    this.messageBox = story.messageBox; this.hud = story.hud; this.ui = g._ui;
    this.rosa = story.shipwreck.rosa;

    // Cerrar la cinemática de zarpe: reparentar a Belu y Rosa a la escena.
    g.cutsceneActive = false;
    this.scene.add(this.player.mesh);
    this.scene.add(this.rosa.object3d);

    // Barco pirata como escenario caminable + teleportar a Belu a la cubierta.
    const spawn = this.world.enterFinaleStage();
    this.deckY = spawn.y;
    this.player.position.set(spawn.x, spawn.y + this.player.half.y + 0.1, spawn.z);
    this.player.velocity.set(0, 0, 0);
    this.player.facing = -Math.PI / 2;
    this.player.checkpoint = this.player.position.clone();
    this.player._syncMesh();

    this.rosa.object3d.position.set(spawn.x - 1.3, spawn.y, spawn.z + 0.6);
    this.rosa.object3d.rotation.set(0, -Math.PI / 2, 0);
    this.rosa._baseY = spawn.y;

    g.uiActive = false;
    this.active = true; this.cinematic = false;
    g.input.requestLock();

    // ---- Actores en los anchors del barco ----
    this.luluPos = this.world.pirateAnchorWorld('lulu');
    this.lulu = new LuluModel();
    this.lulu.object3d.position.copy(this.luluPos);
    this.lulu.object3d.rotation.y = Math.PI / 2;      // mira a +X (hacia Belu)
    this.scene.add(this.lulu.object3d);

    this.cagePos = this.world.pirateAnchorWorld('cage');
    this.cage = buildCage();
    this.cage.group.position.copy(this.cagePos);
    this.cage.group.rotation.y = -Math.PI / 2;         // puerta hacia −X (hacia Belu)
    this.scene.add(this.cage.group);

    this.gian = new GianluccaModel();
    this.gian.object3d.position.set(this.cagePos.x, this.deckY, this.cagePos.z);
    this.gian.object3d.rotation.y = -Math.PI / 2;
    this.scene.add(this.gian.object3d);

    this.cannonPos = this.world.pirateAnchorWorld('cannon');
    this.cannon = makeCannon();
    this.cannon.position.copy(this.cannonPos);
    this.scene.add(this.cannon);

    this.hasKey = false;
    this.key = this._makeKey();
    this.key.visible = false;
    this.scene.add(this.key);
    this._puffs = [];

    // ---- Interacciones (E) ----
    this.interaction.add({
      pos: () => this.cannonPos, radius: 3.2,
      prompt: () => 'Apretá <b>E</b> para dispararle el cañón a Lulu 💥',
      enabled: () => this.state === 'cannon',
      onInteract: () => this._fire(),
    });
    this.interaction.add({
      pos: () => this.cagePos, radius: 3.6,
      prompt: () => 'Apretá <b>E</b> para abrir la jaula y liberar a Gian 🗝️',
      enabled: () => this.state === 'cage' && this.hasKey,
      onInteract: () => this._openCage(),
    });

    // Bravuconada de Lulu → arranca lo del cañón.
    this.state = 'intro';
    playLines(this.dialogue, this.ui, TEXTOS.lulu.nombre, [TEXTOS.lulu.amenaza], () => {
      this.state = 'cannon';
      this.hud.set('¡Andá al cañón y dispárale a Lulu! (E) 💥');
    });
  }

  update(dt) {
    if (!this.active) return;
    this._t += dt;
    this.lulu.update(dt);
    this.gian.update(dt, this._gianMoving ? 0.5 : 0);
    this.cage.update(dt);   // (Rosa la actualiza ShipwreckIsland vía story.update)
    this._updatePuffs(dt);
    if (this.key.visible) {
      this.key.rotation.y += dt * 2;
      this.key.position.y = this._keyBaseY + Math.sin(this._t * 3) * 0.12;
    }

    if (this.state === 'firing') this._updateBall(dt);
    else if (this.state === 'key') this._checkKeyPickup();
    else if (this.state === 'opening') this._updateGianOut(dt);
    else if (this.state === 'reunion' || this.state === 'end') this._updateReunion(dt);
  }

  // ---- Cañón ----
  _fire() {
    this.state = 'firing';
    this.hud.set('');
    this._ballStart = this.cannonPos.clone().add(new THREE.Vector3(-1.3, 0.64, 0));
    this._ballTarget = this.luluPos.clone(); this._ballTarget.y += 0.95;
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.4, metalness: 0.3 }));
    this.ball.position.copy(this._ballStart);
    this.scene.add(this.ball);
    this._puff(this._ballStart, 0xffcf7a, 1.2);   // fogonazo
    audio.cannon();
  }

  _updateBall(dt) {
    const to = this._ballTarget, p = this.ball.position;
    this._tmpDir = (this._tmpDir || new THREE.Vector3());
    this._tmpDir.copy(to).sub(p);
    const dist = this._tmpDir.length();
    const step = 22 * dt;
    if (dist <= step + 0.4) {
      this.scene.remove(this.ball); this.ball = null;
      this._puff(to, 0xdddddd, 2.0);
      this.lulu.knockOut();
      audio.luluFly();
      // La llave cae donde estaba Lulu (sobre la cubierta).
      this.key.position.set(this.luluPos.x, this.deckY + 0.55, this.luluPos.z);
      this._keyBaseY = this.deckY + 0.55;
      this.key.visible = true;
      this.state = 'key';
      this.hud.set('¡PUMBA! 💥 Lulu soltó la llave — ¡agarrala! 🗝️');
    } else {
      this._tmpDir.multiplyScalar(step / dist);
      p.add(this._tmpDir);
    }
  }

  // ---- Llave ----
  _checkKeyPickup() {
    const pp = this.player.position, k = this.key.position;
    if (Math.hypot(pp.x - k.x, pp.z - k.z) < 2.0) {
      this.hasKey = true;
      this.key.visible = false;
      this.state = 'cage';
      this.hud.set('Llevá la llave a la jaula y liberá a Gian 🗝️');
    }
  }

  // ---- Jaula ----
  _openCage() {
    this.cage.open();
    audio.cageOpen();
    this.state = 'opening';
    this.hud.set('');
    this._gianMoving = true;
    this._gianTarget = new THREE.Vector3(this.cagePos.x - 4.5, this.deckY, this.cagePos.z);   // hacia el hueco entre palos
  }

  _updateGianOut(dt) {
    const g = this.gian.object3d.position, to = this._gianTarget;
    const dx = to.x - g.x, dz = to.z - g.z, d = Math.hypot(dx, dz);
    if (d < 0.15) {
      this._gianMoving = false;
      this._startReunion();
    } else {
      const step = Math.min(d, 1.6 * dt);
      g.x += (dx / d) * step; g.z += (dz / d) * step;
    }
  }

  // ---- Reencuentro ----
  _startReunion() {
    this.state = 'reunion';
    this.cinematic = true;
    this.game.uiActive = true;
    if (document.pointerLockElement) document.exitPointerLock();
    this._reuT = 0;

    const gx = this.gian.object3d.position.x, gz = this.gian.object3d.position.z;
    this._meet = new THREE.Vector3(gx, this.deckY, gz);
    // Belu frente a Gian.
    this.player.position.set(gx - 1.5, this.deckY + this.player.half.y + 0.1, gz + 0.2);
    this.player.facing = Math.PI / 2;
    this.player._syncMesh();
    this.gian.object3d.rotation.y = -Math.PI / 2;    // Gian mira a Belu (−X)
    // Rosa a los pies.
    this.rosa.object3d.position.set(gx - 0.7, this.deckY, gz - 1.2);
    this.rosa.object3d.rotation.set(0, Math.PI / 2, 0);
    this.rosa._baseY = this.deckY;
  }

  _updateReunion(dt) {
    this._reuT += dt;
    const m = this._meet, cam = this.camera, t = this._t;
    // Cámara alta desde estribor (+Z), cerca y por encima de la baranda, mirando a la pareja.
    // Los mástiles (línea central z=285) quedan DETRÁS de la pareja → nunca la tapan.
    cam.position.set(m.x - 0.4 + Math.sin(t * 0.3) * 0.7, this.deckY + 4.0, m.z + 4.5 + Math.sin(t * 0.2) * 0.5);
    cam.lookAt(m.x, this.deckY + 1.0, m.z);

    // El/los mensaje(s) de Gian salen en el diálogo (con botón). El card final NO aparece
    // solo: recién sale al apretar "Continuar" en el último mensaje.
    if (this._reuT > 1.2 && !this._msgShown) {
      this._msgShown = true;
      this._showGianLines();
    }
  }

  // Muestra el/los mensaje(s) de Gian con "Continuar"; al terminar, el card final.
  _showGianLines() {
    const raw = TEXTOS.gianRescate;
    const lines = Array.isArray(raw) ? raw : [raw];   // acepta un string o una lista de líneas
    let i = 0;
    const step = () => {
      if (i >= lines.length) { this._toCard(); return; }
      this.dialogue.show('Gian 🦆', lines[i++], [{ label: 'Continuar ▸', onClick: step }]);
    };
    step();
  }

  _toCard() {
    if (this.state === 'end') return;
    this.state = 'end';
    this.dialogue.hide();
    this._showCard();
  }

  // ---- Llave (mesh) ----
  _makeKey() {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: 0xf6d267, emissive: 0xcaa23c, emissiveIntensity: 1.5, metalness: 0.5, roughness: 0.4 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 8, 16), m); g.add(ring);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), m);
    shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.32; g.add(shaft);
    for (const dx of [0.5, 0.56]) { const th = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, 0.04), m); th.position.set(dx, -0.07, 0); g.add(th); }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  // ---- Humo/fogonazo ----
  _puff(pos, color, scale) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }));
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this._puffs.push({ mesh, t: 0, scale });
  }
  _updatePuffs(dt) {
    for (let i = this._puffs.length - 1; i >= 0; i--) {
      const p = this._puffs[i]; p.t += dt * 2.2;
      const s = 1 + p.t * p.scale;
      p.mesh.scale.setScalar(s);
      p.mesh.material.opacity = Math.max(0, 0.85 * (1 - p.t));
      if (p.t >= 1) { this.scene.remove(p.mesh); this._puffs.splice(i, 1); }
    }
  }

  // ---- Carta final ----
  _buildCard() {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed', inset: '0', zIndex: '60', display: 'none',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 40%, rgba(30,22,40,0.55), rgba(8,6,12,0.9))',
      backdropFilter: 'blur(2px)',
    });
    const card = document.createElement('div');
    Object.assign(card.style, {
      maxWidth: 'min(560px, 90vw)', padding: '30px 34px', borderRadius: '18px',
      background: 'rgba(28,20,14,0.94)', color: '#f7eccf', border: '2px solid #caa76a',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)', textAlign: 'center',
      font: '17px/1.6 "Segoe UI", system-ui, sans-serif',
    });
    this._cardTitle = document.createElement('div');
    Object.assign(this._cardTitle.style, { fontSize: '24px', fontWeight: '800', marginBottom: '14px' });
    this._cardMsg = document.createElement('div');
    this._cardEnd = document.createElement('div');
    Object.assign(this._cardEnd.style, { marginTop: '22px', fontSize: '30px', fontWeight: '800', letterSpacing: '.04em' });
    this._cardEnd.textContent = 'Fin ❤️';
    card.append(this._cardTitle, this._cardMsg, this._cardEnd);
    el.appendChild(card);
    document.body.appendChild(el);
    return el;
  }

  _showCard() {
    this._cardTitle.innerHTML = TEXTOS.finalCarta.titulo;
    this._cardMsg.innerHTML = TEXTOS.finalCarta.mensaje;
    this._card.style.display = 'flex';
  }
}
