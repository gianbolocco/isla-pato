import * as THREE from 'three';

// Piezas de parkour sobre el agua. Cada builder devuelve { group, colliders } con la
// superficie caminable a la altura `y` indicada (para saltar entre piezas). Las
// plataformas de madera/roca se reutilizan de structures.js (buildWoodPlatform/RockPlatform).

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...opts });
}

// Barril de madera como plataforma. `y` = altura de la tapa (superficie caminable).
export function buildBarrel(x, y, z) {
  const g = new THREE.Group();
  const wood = mat(0xac7d43), dark = mat(0x82531f), band = mat(0x4a4a4e, { metalness: 0.3, roughness: 0.5 });
  const r = 0.55, h = 1.0, cy = y - h / 2;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.88, h, 16), wood);
  body.position.set(x, cy, z); g.add(body);
  for (const f of [-0.32, 0, 0.32]) {
    const bnd = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.035, 6, 18), band);
    bnd.rotation.x = Math.PI / 2; bnd.position.set(x, cy + f * h, z); g.add(bnd);
  }
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.08, 16), dark);
  lid.position.set(x, y, z); g.add(lid);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const collider = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(x, y - 0.12, z), new THREE.Vector3(r * 1.7, 0.3, r * 1.7));
  return { group: g, colliders: [collider] };
}

// Resto de naufragio (pieza central): casco medio hundido con una cubierta caminable a
// la altura `y`, bordes rotos y un mástil caído. Eje del casco a lo largo de X.
export function buildWreck(x, y, z) {
  const g = new THREE.Group();
  const wood = mat(0x6e4a2a, { flatShading: true }), woodD = mat(0x513521, { flatShading: true });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.4, 3.2), wood);
  hull.position.set(x, y - 1.2, z); hull.rotation.z = 0.1; g.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.3, 2.8), woodD);
  deck.position.set(x, y, z); g.add(deck);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.5, 0.16), woodD);
    rail.position.set(x, y + 0.25, z + s * 1.3); g.add(rail);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 4.2, 8), wood);
  mast.position.set(x + 1.6, y + 0.9, z); mast.rotation.z = 0.95; mast.castShadow = true; g.add(mast);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const collider = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(x, y - 0.1, z), new THREE.Vector3(5.8, 0.4, 2.8));
  return { group: g, colliders: [collider] };
}
