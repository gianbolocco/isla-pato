import { makePart } from '../world/props/shipParts.js';
import { NAUFRAGIO } from '../config.js';

// Las PIEZAS del barco desperdigadas por la Cala del Naufragio (isla 5). La historia decide
// cuándo aparecen (spawn), tras hablar con Nemo. Se juntan por cercanía (como los tablones),
// apoyadas a la altura real del terreno (la isla tiene lomas). Expone `collected`, `total`
// y `allCollected` para la Story/HUD y el puzzle de armado.
export class ShipPartsField {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.total = NAUFRAGIO.parts.length;
    this.collected = 0;
    this.allCollected = false;
    this.parts = null;   // null = todavía no aparecieron
    this._t = 0;
  }

  // parts: [{ kind, name, order, x, z }] con posiciones absolutas ya resueltas.
  spawn(parts) {
    if (this.parts) return;
    this.parts = parts.map((p) => {
      const mesh = makePart(p.kind);
      const gy = this.world.groundHeightAt(p.x, p.z) ?? 0;
      const baseY = gy + 1.1;
      mesh.position.set(p.x, baseY, p.z);
      this.scene.add(mesh);
      return { ...p, mesh, baseY, taken: false, phase: Math.random() * Math.PI * 2 };
    });
  }

  update(dt, playerPos) {
    if (!this.parts) return;
    this._t += dt;
    const r2 = NAUFRAGIO.pickupRadius * NAUFRAGIO.pickupRadius;
    for (const p of this.parts) {
      if (p.taken) continue;
      p.mesh.rotation.y += dt * 1.1;
      p.mesh.position.y = p.baseY + Math.sin(this._t * 2 + p.phase) * 0.14;
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
