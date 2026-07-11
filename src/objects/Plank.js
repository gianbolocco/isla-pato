import * as THREE from 'three';

// Tablón coleccionable (para reparar el puente). Un tablón de madera con vetas y un
// brillito para poder encontrarlo. El bob/rotación lo maneja PlankField.
export function makePlank() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0xac7d43, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x82531f, roughness: 1 });
  const plank = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.42), wood);
  plank.castShadow = true;
  g.add(plank);
  for (const zz of [-0.14, 0.14]) {
    const groove = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.15, 0.03), dark);
    groove.position.z = zz;
    g.add(groove);
  }
  // Brillito suave (resalta con el bloom) para encontrarlo entre la vegetación.
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe08a, emissiveIntensity: 1.8 }));
  glow.position.y = 0.32;
  g.add(glow);
  return g;
}
