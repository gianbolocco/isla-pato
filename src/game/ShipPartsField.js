import { makeMaterial } from '../world/props/shipParts.js';
import { NAUFRAGIO } from '../config.js';
import { audio } from '../core/audio.js';

// Los MATERIALES del barco desperdigados por la Cala del Naufragio (isla 5). La historia
// decide cuándo aparecen (spawn), tras hablar con Rosa. Se juntan por cercanía (como los
// tablones), apoyados a la altura real del terreno (la isla tiene lomas). Lleva el conteo
// TOTAL y POR TIPO (madera/tela/soga/brea) para el HUD, las estaciones de reparación y la Story.
export class ShipPartsField {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.total = 0;
    this.collected = 0;
    this.allCollected = false;
    this.counts = {};       // kind -> juntados
    this.items = null;      // null = todavía no aparecieron
    this._t = 0;
  }

  // items: [{ kind, x, z }] con posiciones absolutas ya resueltas por el World.
  spawn(items) {
    if (this.items) return;
    this.total = items.length;
    for (const it of items) this.counts[it.kind] = this.counts[it.kind] || 0;
    this.items = items.map((p) => {
      const mesh = makeMaterial(p.kind);
      const gy = this.world.groundHeightAt(p.x, p.z) ?? 0;
      const baseY = gy + 1.1;
      mesh.position.set(p.x, baseY, p.z);
      this.scene.add(mesh);
      return { ...p, mesh, baseY, taken: false, phase: Math.random() * Math.PI * 2 };
    });
  }

  countOf(kind) { return this.counts[kind] || 0; }
  have(kind, n) { return this.countOf(kind) >= n; }

  update(dt, playerPos) {
    if (!this.items) return;
    this._t += dt;
    const r2 = NAUFRAGIO.pickupRadius * NAUFRAGIO.pickupRadius;
    for (const p of this.items) {
      if (p.taken) continue;
      p.mesh.rotation.y += dt * 1.1;
      p.mesh.position.y = p.baseY + Math.sin(this._t * 2 + p.phase) * 0.14;
      const dx = playerPos.x - p.x, dz = playerPos.z - p.z;
      if (dx * dx + dz * dz < r2) {
        p.taken = true;
        this.scene.remove(p.mesh);
        this.collected++;
        this.counts[p.kind] = (this.counts[p.kind] || 0) + 1;
        audio.pickup();
        if (this.collected >= this.total) this.allCollected = true;
      }
    }
  }
}
