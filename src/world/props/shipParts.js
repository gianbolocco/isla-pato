import * as THREE from 'three';

// Mini-modelos de los MATERIALES que Belu junta por la Cala del Naufragio (isla 5) para
// reparar el barco: 🪵 madera, 🧵 tela (para la vela), 🪢 soga y 🛢️ brea. Cada
// `makeMaterial(kind)` devuelve un THREE.Group chico y reconocible, con un brillo dorado para
// verlo de lejos. La animación (flotar/girar) y el pickup los maneja game/ShipPartsField.js.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...opts });
}

const WOOD = 0x8a5a30, WOOD_L = 0x9c6a3a, CANVAS = 0xf3ead2, ROPE = 0xb99863, TAR = 0x1c1a18;

export function makeMaterial(kind) {
  const g = new THREE.Group();

  if (kind === 'madera') {
    // Fajo de tablas atado.
    const wood = mat(WOOD), woodL = mat(WOOD_L);
    for (let i = 0; i < 3; i++) {
      const pl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.4), i % 2 ? woodL : wood);
      pl.position.set(0, 0.15 + i * 0.16, (i - 1) * 0.1); pl.rotation.y = (i - 1) * 0.1; g.add(pl);
    }
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 6, 14), mat(ROPE));
    tie.rotation.y = Math.PI / 2; tie.position.set(0.4, 0.3, 0); g.add(tie);
  } else if (kind === 'tela') {
    // Rollo de tela crema con una punta caída.
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.1, 12), mat(CANVAS, { roughness: 1 }));
    roll.rotation.z = Math.PI / 2; roll.position.y = 0.35; g.add(roll);
    const flap = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), mat(CANVAS, { roughness: 1, side: THREE.DoubleSide }));
    flap.rotation.x = -0.5; flap.position.set(0, 0.2, 0.4); g.add(flap);
  } else if (kind === 'soga') {
    // Rollo de soga (torus apilados).
    const rm = mat(ROPE);
    for (let i = 0; i < 3; i++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.3 - i * 0.02, 0.08, 8, 18), rm);
      coil.rotation.x = Math.PI / 2; coil.position.y = 0.12 + i * 0.14; g.add(coil);
    }
  } else if (kind === 'brea') {
    // Balde con brea negra.
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 12), mat(0x5a4a3a));
    bucket.position.y = 0.25; g.add(bucket);
    const tar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12), mat(TAR, { roughness: 0.4 }));
    tar.position.y = 0.48; g.add(tar);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 6, 14, Math.PI), mat(0x3a3a40, { metalness: 0.4 }));
    handle.position.y = 0.5; g.add(handle);
  }

  // Brillo dorado para verlo de lejos en la isla grande.
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10),
    mat(0xffffff, { emissive: 0xffd469, emissiveIntensity: 2.4, flatShading: false }));
  glow.position.y = 0.05; g.add(glow);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 6, 20),
    mat(0xffe9a8, { emissive: 0xffcf55, emissiveIntensity: 1.6 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; g.add(ring);

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
