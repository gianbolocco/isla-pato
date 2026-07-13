import * as THREE from 'three';

// Mini-modelos de las PIEZAS del barco que Belu junta por la Cala del Naufragio (isla 5).
// Cada `makePart(kind)` devuelve un THREE.Group chico y reconocible, con un brillo para que
// se vea de lejos en la isla grande. La animación (flotar/girar) y el pickup los maneja
// game/ShipPartsField.js. Los `kind` coinciden con las piezas de reparación del barco
// (world/props/shipwreck.js): bowPlanks, sternPlanks, deck, rudder, mast, yard, sail, wheel.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...opts });
}
function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

const WOOD = 0x8a5a30, WOOD_D = 0x513521, WOOD_L = 0x9c6a3a, CANVAS = 0xe9e2cf, METAL = 0x3a3a40;

export function makePart(kind) {
  const g = new THREE.Group();
  const wood = mat(WOOD), woodD = mat(WOOD_D), woodL = mat(WOOD_L);

  if (kind === 'bowPlanks' || kind === 'sternPlanks' || kind === 'deck') {
    // Montoncito de tablones.
    for (let i = 0; i < 3; i++) {
      const pl = box(1.4, 0.14, 0.4, i % 2 ? woodL : wood);
      pl.position.set(0, 0.1 + i * 0.16, (i - 1) * 0.12);
      pl.rotation.y = (i - 1) * 0.12;
      g.add(pl);
    }
  } else if (kind === 'rudder') {
    const blade = box(0.18, 1.1, 0.6, woodD); blade.position.y = 0.55; g.add(blade);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), mat(METAL));
    arm.rotation.z = Math.PI / 2; arm.position.set(0.3, 1.0, 0); g.add(arm);
  } else if (kind === 'mast') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 8), woodL);
    pole.position.y = 0.8; g.add(pole);
  } else if (kind === 'yard') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 8), woodL);
    pole.rotation.z = Math.PI / 2; pole.position.y = 0.5; g.add(pole);
  } else if (kind === 'sail') {
    const s = box(1.2, 1.0, 0.05, mat(CANVAS, { side: THREE.DoubleSide }));
    s.position.y = 0.6; g.add(s);
    const stripe = box(1.2, 0.22, 0.06, mat(0xb23a34)); stripe.position.set(0, 0.75, 0.01); g.add(stripe);
  } else if (kind === 'wheel') {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.07, 8, 18), woodL);
    rim.position.y = 0.6; g.add(rim);
    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), woodL);
      sp.position.y = 0.6; sp.rotation.z = (i / 6) * Math.PI; g.add(sp);
    }
  }

  // Brillo dorado para que la pieza se vea de lejos (base + resplandor).
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10),
    mat(0xffffff, { emissive: 0xffd469, emissiveIntensity: 2.4, flatShading: false }));
  glow.position.y = 0.05; g.add(glow);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 6, 20),
    mat(0xffe9a8, { emissive: 0xffcf55, emissiveIntensity: 1.6 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; g.add(ring);

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
