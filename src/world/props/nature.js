import * as THREE from 'three';

// Props de naturaleza reutilizables. Cada maker devuelve un THREE.Group con el
// origen en la base (y=0), listo para posicionar en el mundo.

export function makePine() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 }));
  trunk.position.y = 0.4; trunk.castShadow = true;
  g.add(trunk);
  const green = new THREE.MeshStandardMaterial({ color: 0x2f6f3a, roughness: 1, flatShading: true });
  const snowM = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 1, flatShading: true });
  let y = 0.7;
  for (let i = 0; i < 3; i++) {
    const r = 0.7 - i * 0.17, h = 0.8;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), green);
    cone.position.y = y + h * 0.4; cone.castShadow = true;
    g.add(cone);
    y += h * 0.5;
  }
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 8), snowM);
  cap.position.y = y + 0.35;
  g.add(cap);
  return g;
}

export function makePalm() {
  const palm = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0xa9793f, roughness: 1 });
  const leafA = new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 0.85, side: THREE.DoubleSide });
  const leafB = new THREE.MeshStandardMaterial({ color: 0x4fa544, roughness: 0.85, side: THREE.DoubleSide });
  const cocoMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 });

  const sections = 8;
  const segH = 0.72;
  let x = 0, y = 0, tilt = 0;
  for (let i = 0; i < sections; i++) {
    const rBottom = Math.max(0.09, 0.24 - i * 0.017);
    const rTop = Math.max(0.08, 0.24 - (i + 1) * 0.017);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, segH, 10), trunkMat);
    tilt += 0.05;
    seg.rotation.z = tilt;
    seg.position.set(x + Math.sin(tilt) * segH * 0.5, y + Math.cos(tilt) * segH * 0.5, 0);
    seg.castShadow = true;
    palm.add(seg);
    x += Math.sin(tilt) * segH;
    y += Math.cos(tilt) * segH;
  }

  const crown = new THREE.Group();
  crown.position.set(x, y, 0);
  crown.rotation.z = tilt;
  palm.add(crown);

  const N = 11;
  for (let i = 0; i < N; i++) {
    const frond = makeFrond(i % 2 ? leafA : leafB);
    frond.rotation.y = (i / N) * Math.PI * 2 + Math.random() * 0.12;
    frond.rotation.x = -0.5 - Math.random() * 0.25;
    frond.scale.setScalar(0.9 + Math.random() * 0.3);
    crown.add(frond);
  }
  for (let i = 0; i < 3; i++) {
    const frond = makeFrond(leafB);
    frond.rotation.y = Math.random() * Math.PI * 2;
    frond.rotation.x = -1.15;
    frond.scale.setScalar(0.8);
    crown.add(frond);
  }
  for (let i = 0; i < 4; i++) {
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), cocoMat);
    const a = (i / 4) * Math.PI * 2;
    coco.position.set(Math.cos(a) * 0.16, -0.05, Math.sin(a) * 0.16);
    crown.add(coco);
  }
  return palm;
}

function makeFrond(mat) {
  const frond = new THREE.Group();
  const len1 = 1.4, len2 = 1.2;
  frond.add(leafBlade(mat, len1, 0.34));
  const tip = new THREE.Group();
  tip.position.z = len1;
  tip.rotation.x = 0.6;
  tip.add(leafBlade(mat, len2, 0.24));
  frond.add(tip);
  return frond;
}

function leafBlade(mat, length, width) {
  const geo = new THREE.PlaneGeometry(width, length, 2, 10);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0, length / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const t = THREE.MathUtils.clamp(z / length, 0, 1);
    const prof = Math.pow(Math.sin(Math.PI * t), 0.6);
    pos.setX(i, pos.getX(i) * (prof * 0.9 + 0.06));
    const ridge = Math.abs(pos.getX(i)) < 0.001 ? 0.05 * prof : 0;
    pos.setY(i, ridge - 0.12 * t * t);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

// Arbusto/plantita: se posiciona directamente en (x,z).
export function makeBush(x, z) {
  const g = new THREE.Group();
  const greens = [0x4e9b45, 0x5fae52, 0x439a3e].map((c) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }));
  const n = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) {
    const blob = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.2), greens[i % 3]);
    blob.position.set((Math.random() - 0.5) * 0.5, 0.28 + Math.random() * 0.15, (Math.random() - 0.5) * 0.5);
    blob.castShadow = true;
    g.add(blob);
  }
  g.position.set(x, 0, z);
  return g;
}

export function makeCloud() {
  const cloud = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, fog: true });
  const puffs = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < puffs; i++) {
    const r = 3 + Math.random() * 3;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
    puff.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6);
    puff.scale.y = 0.6;
    cloud.add(puff);
  }
  return cloud;
}
