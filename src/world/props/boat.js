import * as THREE from 'three';

// El BOTE de remos de la Cala del Naufragio (isla 5): un botecito de madera varado en la
// arena que apunta al mar. Decorativo (sin colisión) — al interactuar arranca el rumbo al
// barco pirata. Maker simple: devuelve un THREE.Group con la proa hacia +Z.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...opts });
}

export function makeBoat() {
  const g = new THREE.Group();
  const hullMat = mat(0x8a5a30);       // madera clara del casco
  const hullDark = mat(0x5f3c1f);      // madera oscura (interior/regala)
  const trimMat = mat(0xb5824a);       // borde superior (regala)

  const LEN = 3.2, W = 1.3;

  // Casco: media caña (medio cilindro abierto) tumbada a lo largo de Z → forma de artesa.
  const hull = new THREE.Mesh(
    new THREE.CylinderGeometry(W / 2, W / 2, LEN, 18, 1, true, 0, Math.PI), hullMat);
  hull.rotation.x = Math.PI / 2;       // eje del cilindro pasa a ser Z (a lo largo del bote)
  hull.rotation.z = Math.PI;           // la parte abierta queda hacia arriba
  hull.position.y = 0.42;
  hull.material.side = THREE.DoubleSide;
  g.add(hull);

  // Piso interior (para que no se vea el agujero del cilindro por abajo).
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 0.08, LEN * 0.92), hullDark);
  floor.position.set(0, 0.2, 0);
  g.add(floor);

  // Proa y popa: dos cuñas que cierran las puntas del casco.
  for (const [z, sign] of [[LEN / 2, 1], [-LEN / 2, -1]]) {
    const cap = new THREE.Mesh(new THREE.ConeGeometry(W / 2, sign > 0 ? 0.9 : 0.5, 12, 1, false, 0, Math.PI), hullMat);
    cap.rotation.x = Math.PI / 2;
    cap.rotation.z = Math.PI;
    cap.position.set(0, 0.42, z + sign * (sign > 0 ? 0.35 : 0.2));
    cap.scale.z = sign > 0 ? 1.4 : 0.9;   // la proa (+Z) más afinada
    cap.material = hullMat;
    g.add(cap);
  }

  // Regala (borde superior) a ambos lados, siguiendo el largo del bote.
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, LEN * 0.98), trimMat);
    rail.position.set(s * (W / 2 - 0.04), 0.66, 0);
    g.add(rail);
  }

  // Dos bancadas (asientos) que cruzan de lado a lado.
  for (const z of [-0.7, 0.6]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.1, 0.34), trimMat);
    bench.position.set(0, 0.6, z);
    g.add(bench);
  }

  // Dos remos apoyados en las regalas, cruzados hacia afuera.
  const oarMat = mat(0x9c6a3a);
  for (const s of [-1, 1]) {
    const oar = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 2.0, 8), oarMat);
    shaft.position.y = 0.0;
    oar.add(shaft);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.6), oarMat);
    blade.position.y = -1.05;
    oar.add(blade);
    oar.rotation.z = s * 1.15;           // apoyado sobre la regala, saliendo hacia el costado
    oar.rotation.x = 0.25;
    oar.position.set(s * (W / 2 - 0.1), 0.7, -0.2);
    g.add(oar);
  }

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
