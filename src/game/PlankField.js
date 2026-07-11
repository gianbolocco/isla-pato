import { makePlank } from '../objects/Plank.js';
import { PLANKS, PLANK_PICKUP_RADIUS } from '../config.js';

// Los tablones escondidos de Isla Pato. La historia decide CUÁNDO aparecen (spawn),
// para no activarlos antes de tiempo. Expone `collected`, `total` y `allCollected`.
export class PlankField {
  constructor(scene) {
    this.scene = scene;
    this.total = PLANKS.length;
    this.collected = 0;
    this.allCollected = false;
    this.planks = null;   // null = todavía no aparecieron
    this._t = 0;
  }

  spawn() {
    if (this.planks) return;
    this.planks = PLANKS.map((p) => {
      const mesh = makePlank();
      mesh.position.set(p.x, 0.6, p.z);
      mesh.rotation.y = Math.random() * Math.PI;
      this.scene.add(mesh);
      return { mesh, x: p.x, z: p.z, taken: false, phase: Math.random() * Math.PI * 2 };
    });
  }

  update(dt, playerPos) {
    if (!this.planks) return;
    this._t += dt;
    const r2 = PLANK_PICKUP_RADIUS * PLANK_PICKUP_RADIUS;
    for (const p of this.planks) {
      if (p.taken) continue;
      p.mesh.rotation.y += dt * 1.2;
      p.mesh.position.y = 0.6 + Math.sin(this._t * 2 + p.phase) * 0.12;
      const dx = playerPos.x - p.x, dz = playerPos.z - p.z;
      if (dx * dx + dz * dz < r2) {
        p.taken = true;
        this.scene.remove(p.mesh);
        this.collected++;
        if (this.collected >= this.total) this.allCollected = true;
      }
    }
  }
}
