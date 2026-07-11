import * as THREE from 'three';

// Botella de vidrio con un pergamino adentro y un brillito (glint) que llama la
// atención (resalta con el bloom). Devuelve un THREE.Group con el origen en la base.
// El mecido/rotación lo maneja quien la use (ver game/Story.js).
export function makeBottle() {
  const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({
    color: 0x9fd6e0, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.55,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.34, 14), glass);
  body.position.y = 0.17;
  g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.14, 12), glass);
  neck.position.y = 0.4;
  g.add(neck);
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10),
    new THREE.MeshStandardMaterial({ color: 0x9c6b3b, roughness: 1 }));
  cork.position.y = 0.5;
  g.add(cork);
  // Pergamino enrollado adentro.
  const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 10),
    new THREE.MeshStandardMaterial({ color: 0xf3e7c6, roughness: 0.9, emissive: 0x6b5a2a, emissiveIntensity: 0.4 }));
  scroll.rotation.z = Math.PI / 2.2;
  scroll.position.y = 0.17;
  g.add(scroll);
  // Glint que brilla (para el bloom).
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c0, emissiveIntensity: 2.2 }));
  glint.position.set(0.06, 0.34, 0.08);
  g.add(glint);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
