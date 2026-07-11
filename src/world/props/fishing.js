import * as THREE from 'three';

// Props del campamento de pesca de Alejandro. Cada maker devuelve un THREE.Group ya
// ubicado en (x,z) sobre el suelo. Reutilizables para cualquier rincón de pesca.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...opts });
}

// Silla plegable de camping (tela + marco).
export function makeChair(x, z, color = 0x2f6b8f) {
  const g = new THREE.Group();
  const fabric = mat(color), frame = mat(0x3a3a40, { metalness: 0.3, roughness: 0.5 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), fabric);
  seat.position.y = 0.42; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.08), fabric);
  back.position.set(0, 0.72, -0.28); g.add(back);
  for (const sx of [-1, 1]) {
    const legF = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), frame);
    legF.position.set(sx * 0.26, 0.2, 0.24); legF.rotation.x = 0.2; g.add(legF);
    const legB = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), frame);
    legB.position.set(sx * 0.26, 0.35, -0.24); legB.rotation.x = -0.2; g.add(legB);
  }
  g.position.set(x, 0, z);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Balde con un pescadito asomando.
export function makeBucket(x, z) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.19, 0.4, 14), mat(0xcf4b3a));
  b.position.y = 0.2; g.add(b);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 6, 16), mat(0xb03a2c));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.4; g.add(rim);
  const fish = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0x9fb3c0, { metalness: 0.2 }));
  fish.scale.set(1.6, 0.9, 0.5); fish.position.set(0.05, 0.44, 0); fish.rotation.z = 0.5; g.add(fish);
  g.position.set(x, 0, z);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Caja de aparejos (tackle box).
export function makeTackleBox(x, z) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.3), mat(0x2f7f4f));
  body.position.y = 0.13; g.add(body);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.32), mat(0x276a42));
  lid.position.y = 0.3; g.add(lid);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI), mat(0x1e1e22));
  handle.position.set(0, 0.36, 0); g.add(handle);
  g.position.set(x, 0, z);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Botella (de bebida).
export function makeBottle(x, z, color = 0x3a7d4a) {
  const g = new THREE.Group();
  const glass = mat(color, { roughness: 0.25, transparent: true, opacity: 0.75 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.28, 12), glass);
  body.position.y = 0.14; g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.12, 10), glass);
  neck.position.y = 0.33; g.add(neck);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.05, 10), mat(0xcaa25c, { metalness: 0.3 }));
  cap.position.y = 0.41; g.add(cap);
  g.position.set(x, 0, z);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Mata de juncos/totoras (orilla).
export function makeReeds(x, z) {
  const g = new THREE.Group();
  const stalkMat = mat(0x5f8a3f, { flatShading: true });
  const tipMat = mat(0x6e4a2a);
  const n = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    const h = 1.1 + Math.random() * 0.9;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, h, 5), stalkMat);
    const ox = (Math.random() - 0.5) * 0.5, oz = (Math.random() - 0.5) * 0.5;
    stalk.position.set(ox, h / 2, oz); stalk.rotation.z = (Math.random() - 0.5) * 0.2;
    g.add(stalk);
    if (Math.random() < 0.6) {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 6), tipMat);
      tip.position.set(ox, h + 0.05, oz); g.add(tip);
    }
  }
  g.position.set(x, 0, z);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
