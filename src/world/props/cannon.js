import * as THREE from 'three';

// Cañón sobre cureña (barco pirata). El cañón apunta a −X (donde está Lulu). Devuelve un
// THREE.Group; el disparo (bola + fogonazo + humo + retroceso) lo anima game/Finale.js.
// El anchor local de la boca del cañón es (−1.3, 0.62, 0) para spawnear la bola.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts });
}

export function makeCannon() {
  const g = new THREE.Group();
  const iron = mat(0x2a2a30, { metalness: 0.4 });
  const wood = mat(0x5b3f26, { roughness: 1 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.32, 0.95), wood);
  base.position.y = 0.32; g.add(base);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12), iron);
    wheel.rotation.x = Math.PI / 2; wheel.position.set(sx * 0.48, 0.22, sz * 0.42); g.add(wheel);
  }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.31, 1.7, 14), iron);
  barrel.rotation.z = Math.PI / 2; barrel.position.set(-0.4, 0.64, 0); g.add(barrel);
  const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 8, 16), iron);
  muzzle.rotation.y = Math.PI / 2; muzzle.position.set(-1.28, 0.64, 0); g.add(muzzle);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), iron);
  knob.position.set(0.5, 0.64, 0); g.add(knob);

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
