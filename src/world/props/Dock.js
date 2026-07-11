import * as THREE from 'three';
import { woodMats } from './materials.js';

// Muelle de madera que sale hacia el mar (+Z). Tablones A RAS DEL PISO (como los
// puentes) para poder caminar sobre él sin trabarse en un escalón. Devuelve
// { group, colliders, platforms } (platforms = marcadores para el minimapa).
export function buildDock(x = 0, z1 = 22, z2 = 44, width = 3.2) {
  const group = new THREE.Group();
  const colliders = [];
  const len = z2 - z1, cz = (z1 + z2) / 2;
  const { light, dark, rope: ropeMat } = woodMats();

  // Tablones del deck (superficie en ~y=0).
  const step = 0.55, n = Math.floor(len / step);
  for (let i = 0; i <= n; i++) {
    const pz = z1 + i * step;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, 0.5), i % 2 ? light : dark);
    plank.position.set(x, -0.05, pz);
    plank.castShadow = true; plank.receiveShadow = true;
    group.add(plank);
  }
  // Postes + baranda de soga a los costados.
  const posts = Math.round(len / 3);
  for (let i = 0; i <= posts; i++) {
    const pz = z1 + (len / posts) * i;
    for (const s of [-1, 1]) {
      const off = s * (width / 2 - 0.12);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.1, 8), dark);
      post.position.set(x + off, 0.45, pz);
      post.castShadow = true;
      group.add(post);
    }
  }
  for (const s of [-1, 1]) {
    const off = s * (width / 2 - 0.12);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 6), ropeMat);
    rope.rotation.x = Math.PI / 2;
    rope.position.set(x + off, 0.9, cz);
    group.add(rope);
  }
  // Pilotes al agua.
  for (let i = 0; i <= 6; i++) {
    const pz = z1 + (len / 6) * i;
    for (const s of [-1, 1]) {
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 3.2, 8), dark);
      pile.position.set(x + s * (width / 2 - 0.2), -1.6, pz);
      pile.castShadow = true;
      group.add(pile);
    }
  }

  // Collider del deck a ras (top ~y=0), para caminar sobre el agua sin escalón.
  colliders.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(x, -0.15, cz), new THREE.Vector3(width, 0.3, len)));

  return { group, colliders, platforms: [{ x, z: cz }] };
}
