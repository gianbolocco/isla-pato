import * as THREE from 'three';

// Props decorativos de costa/isla para la Cala del Naufragio (isla 5). Cada maker devuelve
// un THREE.Group con el origen en la base (y=0), sin colisión (ambiente). Se ubican con
// scene.add en el World. Estilo low-poly / flatShading acorde al resto.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true, ...opts });
}

// Troncos a la deriva (madera vieja grisácea) tirados en la playa.
export function makeDriftwood() {
  const g = new THREE.Group();
  const wood = mat(0x9a8b6f), woodD = mat(0x7c6f57);
  for (let i = 0; i < 2; i++) {
    const len = 1.6 + Math.random() * 1.2;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, len, 7), i ? woodD : wood);
    log.rotation.z = Math.PI / 2; log.rotation.y = (Math.random() - 0.5) * 1.2;
    log.position.set((Math.random() - 0.5) * 0.6, 0.18, (Math.random() - 0.5) * 0.6);
    log.castShadow = true; g.add(log);
  }
  return g;
}

// Ancla vieja semienterrada, inclinada.
export function makeAnchor() {
  const g = new THREE.Group();
  const iron = mat(0x4a4e55, { metalness: 0.4, roughness: 0.6 });
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.7, 8), iron);
  shank.position.y = 0.85; g.add(shank);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 16), iron);
  ring.position.y = 1.7; g.add(ring);
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), iron);
  stock.rotation.z = Math.PI / 2; stock.position.y = 1.4; g.add(stock);
  // Brazos curvos (aprox con dos cilindros en V) + uñas.
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6), iron);
    arm.position.set(s * 0.3, 0.25, 0); arm.rotation.z = s * 0.9; g.add(arm);
    const fluke = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 4), iron);
    fluke.position.set(s * 0.55, 0.45, 0); fluke.rotation.z = s * -0.6; g.add(fluke);
  }
  g.rotation.z = 0.5; g.rotation.y = Math.random() * Math.PI;   // caída/semienterrada
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Fogón: anillo de piedras + leños cruzados + una brasa emisiva (brilla con el bloom).
export function makeCampfire() {
  const g = new THREE.Group();
  const stone = mat(0x7c8188);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + Math.random() * 0.06), stone);
    r.position.set(Math.cos(a) * 0.55, 0.1, Math.sin(a) * 0.55);
    r.rotation.set(Math.random(), Math.random(), Math.random());
    r.castShadow = true; g.add(r);
  }
  const logMat = mat(0x5f4326);
  for (const s of [-1, 1]) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 6), logMat);
    log.rotation.z = Math.PI / 2 - 0.3 * s; log.rotation.y = 0.5 * s; log.position.y = 0.14; g.add(log);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 7),
    mat(0xff9a3c, { emissive: 0xff6a1a, emissiveIntensity: 2.6, flatShading: true }));
  flame.position.y = 0.42; g.add(flame);
  const light = new THREE.PointLight(0xff8a3a, 0.6, 8, 2); light.position.y = 0.6; g.add(light);
  return g;
}

// Red de pesca colgada entre dos palos (plano semitransparente con leve caída).
export function makeFishingNet() {
  const g = new THREE.Group();
  const wood = mat(0x6e4b2a);
  for (const x of [-0.9, 0.9]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.6, 6), wood);
    pole.position.set(x, 0.8, 0); pole.castShadow = true; g.add(pole);
  }
  const geo = new THREE.PlaneGeometry(1.8, 1.0, 6, 4);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) / 0.9; p.setZ(i, -Math.cos(u * 1.4) * 0.15 - 0.1); }
  geo.computeVertexNormals();
  const net = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0xcfc7ad, roughness: 1, transparent: true, opacity: 0.5, side: THREE.DoubleSide, wireframe: true,
  }));
  net.position.y = 0.9; g.add(net);
  return g;
}

// Estrella de mar (5 brazos) para la playa.
export function makeStarfish(color = 0xe07a54) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 1 });
  for (let i = 0; i < 5; i++) {
    const arm = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 5), m);
    const a = (i / 5) * Math.PI * 2;
    arm.position.set(Math.cos(a) * 0.14, 0.04, Math.sin(a) * 0.14);
    arm.rotation.z = Math.PI / 2; arm.rotation.y = -a; g.add(arm);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), m); core.scale.y = 0.4; core.position.y = 0.05; g.add(core);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}

// Caracol/concha chica.
export function makeShell(color = 0xf0e2c8) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(color, { roughness: 0.7 }));
  shell.scale.set(1, 0.7, 1); shell.position.y = 0.02; g.add(shell);
  return g;
}

// Mata de algas verdes.
export function makeSeaweed() {
  const g = new THREE.Group();
  const greens = [0x3f7a4a, 0x2f6f3a, 0x4f8f52].map((c) => mat(c, { roughness: 1 }));
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5 + Math.random() * 0.3, 5), greens[i % 3]);
    blade.position.set((Math.random() - 0.5) * 0.4, 0.28, (Math.random() - 0.5) * 0.4);
    blade.rotation.z = (Math.random() - 0.5) * 0.5; g.add(blade);
  }
  return g;
}
