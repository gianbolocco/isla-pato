import * as THREE from 'three';

// Cinemática de zarpe (Cala del Naufragio → El Pato Mareado): al reparar y embarcar (E),
// Belu y Rosa suben a la cubierta del barco reparado y navegan por el mar hasta quedar AL
// LADO del barco pirata. La ruta es una CURVA (Bézier) que rodea la isla por el norte para no
// pasar por encima de la arena. El barco cabecea/rola como navegando y la cámara se mueve.
// Al llegar, aparece el prompt "E para abordar" (dispara `onBoard`, el final de la historia).

function bez(a, b, c, t) { const u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; }
function bezD(a, b, c, t) { const u = 1 - t; return 2 * u * (b - a) + 2 * t * (c - b); }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

export class SailCutscene {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.done = false;
    this.boarded = false;
    this.t = 0;
    this.dur = 11;         // duración del viaje (s)
    this._time = 0;
    this._ePrev = false;
    this._pos = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._perp = new THREE.Vector3();

    // Prompt propio (independiente del InteractionManager, que está congelado en la cinemática).
    this.prompt = document.createElement('div');
    Object.assign(this.prompt.style, {
      position: 'fixed', left: '50%', bottom: '80px', transform: 'translateX(-50%)',
      padding: '11px 20px', borderRadius: '12px', background: 'rgba(20,16,10,0.85)',
      color: '#ffe9b0', border: '1px solid #caa76a', font: '17px system-ui, sans-serif',
      boxShadow: '0 8px 22px rgba(0,0,0,0.45)', zIndex: '44', display: 'none', pointerEvents: 'none',
    });
    document.body.appendChild(this.prompt);
  }

  // { rosa, onArrive, onBoard } — rosa se sube a la cubierta; onBoard = abordar (final).
  start({ rosa, onArrive, onBoard }) {
    const g = this.game;
    this.ship = g.world.shipwreckShip;
    if (!this.ship || this.active) return;
    this.active = true; this.done = false; this.boarded = false; this.t = 0; this._time = 0;
    this.onArrive = onArrive; this.onBoard = onBoard;

    g.cutsceneActive = true;
    g.uiActive = true;
    if (document.pointerLockElement) document.exitPointerLock();

    this.ship.setCinematic(true);
    const sg = this.ship.group3d;
    this.sg = sg;

    // Belu y Rosa a la cubierta (hijas del barco → viajan con él).
    const belu = g.player.mesh;
    sg.add(belu);
    belu.position.set(-1.0, 0.8, 0.35);
    belu.rotation.set(0, Math.PI / 2, 0);        // mira a la proa (+X del barco)

    sg.add(rosa.object3d);
    rosa.object3d.position.set(-1.9, 0.78, -0.4);
    rosa.object3d.rotation.set(0, Math.PI / 2, 0);
    rosa._baseY = 0.78;
    this.rosa = rosa;

    // Ruta curva: P0 (donde flota) → control al NE (rodea la isla por el norte) → P2 (al lado
    // del Pato Mareado). Así el barco no cruza por encima de la arena de la isla.
    this.p0 = { x: sg.position.x, z: sg.position.z };
    const ps = g.world.pirateShip.position;
    this.p2 = { x: ps.x + 24, z: ps.z - 12 };
    this.p1 = { x: this.p0.x + 14, z: this.p0.z + 160 };   // empuja la curva al norte/este (mar abierto)
    this.sailY = sg.position.y;
  }

  update(dt) {
    if (!this.active) return;
    this._time += dt;
    const g = this.game, sg = this.sg, time = this._time;

    if (g.player && g.player.belu) g.player.belu.update(dt, 0);   // Belu respira (idle)

    if (!this.done) {
      this.t = Math.min(1, this.t + dt / this.dur);
      const e = easeInOut(this.t);
      // Posición sobre la curva + cabeceo/rolido de navegación.
      const x = bez(this.p0.x, this.p1.x, this.p2.x, e);
      const z = bez(this.p0.z, this.p1.z, this.p2.z, e);
      sg.position.set(x, this.sailY + Math.sin(time * 0.9) * 0.18, z);
      // Rumbo según la tangente de la curva (el barco va girando).
      const dx = bezD(this.p0.x, this.p1.x, this.p2.x, e);
      const dz = bezD(this.p0.z, this.p1.z, this.p2.z, e);
      this._dir.set(dx, 0, dz).normalize();
      sg.rotation.y = Math.atan2(-this._dir.z, this._dir.x);
      sg.rotation.z = Math.sin(time * 0.6) * 0.05;       // rolido
      sg.rotation.x = Math.sin(time * 1.1) * 0.03;       // cabeceo
      if (this.t >= 1) {
        this.done = true;
        if (this.onArrive) this.onArrive();
      }
    } else {
      sg.position.y = this.sailY + Math.sin(time * 0.9) * 0.16;
      sg.rotation.z = Math.sin(time * 0.6) * 0.04;
      sg.rotation.x = Math.sin(time * 1.1) * 0.02;
      this._handleBoard();
    }

    this._updateCamera();
  }

  _handleBoard() {
    this.prompt.innerHTML = 'Apretá <b>E</b> para abordar <b>El Pato Mareado</b> 🏴‍☠️';
    this.prompt.style.display = 'block';
    const e = this.game.input.isDown('KeyE');
    if (e && !this._ePrev && !this.boarded) {
      this.boarded = true;
      this.prompt.style.display = 'none';
      if (this.onBoard) this.onBoard();
    }
    this._ePrev = e;
  }

  _updateCamera() {
    const g = this.game, sg = this.sg, d = this._dir, time = this._time;
    const cam = g.camera;
    this._perp.set(-d.z, 0, d.x);

    if (!this.done) {
      // Persecución con movimiento: la cámara se balancea de lado y sube/baja mientras navega.
      const sway = Math.sin(time * 0.25) * 6;
      const rise = Math.sin(time * 0.4) * 1.6;
      cam.position.set(
        sg.position.x - d.x * 13 + this._perp.x * (2 + sway),
        sg.position.y + 6 + rise,
        sg.position.z - d.z * 13 + this._perp.z * (2 + sway),
      );
      cam.lookAt(sg.position.x + d.x * 8, sg.position.y + 1.6, sg.position.z + d.z * 8);
    } else {
      // Toma final: los dos barcos juntos, con leve deriva de cámara.
      const ps = g.world.pirateShip.position;
      const sway = Math.sin(time * 0.3) * 3;
      cam.position.set(
        sg.position.x - d.x * 4 + this._perp.x * (16 + sway),
        sg.position.y + 8,
        sg.position.z - d.z * 4 + this._perp.z * (16 + sway),
      );
      cam.lookAt((sg.position.x + ps.x) / 2, sg.position.y + 2.5, (sg.position.z + ps.z) / 2);
    }
  }
}
