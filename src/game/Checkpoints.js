import * as THREE from 'three';

// Checkpoints reutilizables: banderines a lo largo del recorrido. Al pasar cerca, se
// activa y actualiza el punto de respawn del jugador (player.checkpoint). Si Belu se
// cae al agua, `Player.respawn()` la manda al último checkpoint (no al principio).

function makeFlag() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b5636, roughness: 1 }));
  pole.position.y = 0.8; g.add(pole);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xd23b34, roughness: 0.9, emissive: 0x3a0e0c, emissiveIntensity: 0.3 }));
  flag.position.set(0.28, 1.4, 0); g.add(flag);
  g.userData.flag = flag;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export class Checkpoints {
  constructor(scene, player, positions, radius = 3) {
    this.player = player;
    this.radius = radius;
    this.list = positions.map((p) => {
      const mesh = makeFlag();
      mesh.position.set(p.x, (p.y ?? 0) - 1.0, p.z);   // el poste nace bajo la superficie
      scene.add(mesh);
      return { x: p.x, y: p.y ?? 0, z: p.z, reached: false, mesh };
    });
  }

  update() {
    const pp = this.player.position;
    for (const c of this.list) {
      if (c.reached) continue;
      if (Math.hypot(pp.x - c.x, pp.z - c.z) < this.radius && Math.abs(pp.y - c.y) < 4) {
        c.reached = true;
        this.player.checkpoint = new THREE.Vector3(c.x, c.y, c.z);
        c.mesh.userData.flag.material.color.set(0x4fbf5a);          // se pone verde
        c.mesh.userData.flag.material.emissive.set(0x0e3a12);
      }
    }
  }
}
