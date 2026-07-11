import * as THREE from 'three';

// Roca reutilizable CON colisión (no se atraviesa). Devuelve { group, colliders } para
// que el World la agregue con _place(). El collider es una caja aproximada a la roca.
export function buildRock(x, y, z, r, material, scaleY = 0.72) {
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(r), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  mesh.scale.y = scaleY;
  mesh.castShadow = true; mesh.receiveShadow = true;

  const hx = r * 0.82, hy = r * scaleY * 0.9;
  const collider = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(x, y, z), new THREE.Vector3(hx * 2, hy * 2, hx * 2));

  return { group: mesh, colliders: [collider] };
}
