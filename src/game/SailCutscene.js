import * as THREE from 'three';
import { NAUFRAGIO } from '../config.js';

// Cinemática de zarpe (Cala del Naufragio → El Pato Mareado): al reparar y embarcar (E),
// Belu y Rosa suben a la cubierta del barco reparado y navegan por el mar hasta quedar AL
// LADO del barco pirata. Toma control de la cámara y del barco (game.cutsceneActive); Belu y
// Rosa viajan como hijas del barco (se mueven con él). Al llegar, muestra el mensaje de cierre.
export class SailCutscene {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.done = false;
    this.t = 0;
    this.dur = 9;          // duración del viaje (s)
    this._time = 0;
    this._start = new THREE.Vector3();
    this._target = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._perp = new THREE.Vector3();
  }

  // { rosa: RosaModel, onArrive: fn } — rosa es la gata de la isla (se sube a la cubierta).
  start({ rosa, onArrive }) {
    const g = this.game;
    this.ship = g.world.shipwreckShip;
    if (!this.ship || this.active) return;
    this.active = true; this.done = false; this.t = 0; this._time = 0;
    this.onArrive = onArrive;

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
    belu.rotation.set(0, Math.PI / 2, 0);     // mira a la proa (+X del barco)

    sg.add(rosa.object3d);
    rosa.object3d.position.set(-1.9, 0.78, -0.4);
    rosa.object3d.rotation.set(0, Math.PI / 2, 0);
    rosa._baseY = 0.78;                        // reancla el bob de respiración a la cubierta
    this.rosa = rosa;

    // Ruta: desde donde flota el barco hasta un punto al lado del Pato Mareado.
    this._start.copy(sg.position);
    const ps = g.world.pirateShip.position;
    this._target.set(ps.x + 22, sg.position.y, ps.z - 12);
    this._dir.copy(this._target).sub(this._start); this._dir.y = 0; this._dir.normalize();
    this.headingY = Math.atan2(-this._dir.z, this._dir.x);   // proa (+X) a lo largo del rumbo
    this.sailY = this._start.y;
  }

  update(dt) {
    if (!this.active) return;
    this._time += dt;
    const g = this.game, sg = this.sg;

    // Belu respira (idle) y Rosa se anima sola desde su manager.
    if (g.player && g.player.belu) g.player.belu.update(dt, 0);

    if (!this.done) {
      this.t = Math.min(1, this.t + dt / this.dur);
      const e = this.t < 0.5 ? 2 * this.t * this.t : 1 - Math.pow(-2 * this.t + 2, 2) / 2;   // easeInOut
      sg.position.lerpVectors(this._start, this._target, e);
      sg.position.y = this.sailY + Math.sin(this._time * 0.7) * 0.14;
      sg.rotation.y = this.headingY;
      sg.rotation.z = Math.sin(this._time * 0.6) * 0.02;
      sg.rotation.x = Math.sin(this._time * 0.5) * 0.012;
      if (this.t >= 1) {
        this.done = true;
        if (this.onArrive) this.onArrive();
        if (g.story && g.story.messageBox) g.story.messageBox.show(NAUFRAGIO.boardTitle, NAUFRAGIO.boardMessage);
      }
    } else {
      sg.position.y = this.sailY + Math.sin(this._time * 0.7) * 0.14;   // mecerse al lado del pirata
      sg.rotation.z = Math.sin(this._time * 0.6) * 0.02;
    }

    this._updateCamera();
  }

  _updateCamera() {
    const g = this.game, sg = this.sg, d = this._dir;
    const cam = g.camera;
    this._perp.set(-d.z, 0, d.x);

    if (!this.done) {
      // Persecución mirando hacia adelante: el Pato Mareado crece de frente.
      cam.position.set(
        sg.position.x - d.x * 13 + this._perp.x * 4,
        sg.position.y + 6,
        sg.position.z - d.z * 13 + this._perp.z * 4,
      );
      cam.lookAt(sg.position.x + d.x * 7, sg.position.y + 1.5, sg.position.z + d.z * 7);
    } else {
      // Toma final: los dos barcos juntos.
      const ps = g.world.pirateShip.position;
      cam.position.set(
        sg.position.x - d.x * 5 + this._perp.x * 16,
        sg.position.y + 8,
        sg.position.z - d.z * 5 + this._perp.z * 16,
      );
      cam.lookAt((sg.position.x + ps.x) / 2, sg.position.y + 2, (sg.position.z + ps.z) / 2);
    }
  }
}
