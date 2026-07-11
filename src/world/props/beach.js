import * as THREE from 'three';
import { meshFrom } from '../meshUtils.js';

// Props de la zona de vacaciones. Cada maker devuelve un THREE.Group ya ubicado en
// (x,z) sobre el piso (y=0).

export function makeUmbrella(x, z) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 8),
    new THREE.MeshStandardMaterial({ color: 0xefe7d6, roughness: 0.8 }));
  pole.position.y = 1.5;
  g.add(pole);
  // Copa a rayas: gajos triangulares alternando color.
  const R = 1.8, top = 3.0, rim = 2.4, seg = 12;
  const arrA = [], arrB = [];
  for (let i = 0; i < seg; i++) {
    const a1 = (i / seg) * Math.PI * 2, a2 = ((i + 1) / seg) * Math.PI * 2;
    const t = i % 2 ? arrB : arrA;
    t.push(0, top, 0,
      Math.cos(a1) * R, rim, Math.sin(a1) * R,
      Math.cos(a2) * R, rim, Math.sin(a2) * R);
  }
  g.add(meshFrom(arrA, 0xe0554e, { flat: true }));
  g.add(meshFrom(arrB, 0xf4f1e8, { flat: true }));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xefe7d6 }));
  knob.position.y = top + 0.06;
  g.add(knob);
  g.position.set(x, 0, z);
  g.rotation.z = 0.1;    // ladeada, con onda
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function makeLounger(x, z, color) {
  const g = new THREE.Group();
  const fabric = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const frame = new THREE.MeshStandardMaterial({ color: 0xf0ebe0, roughness: 0.7 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 1.5), fabric);
  seat.position.set(0, 0.35, 0);
  g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.9), fabric);
  back.position.set(0, 0.62, -0.85);
  back.rotation.x = 0.6;
  g.add(back);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), frame);
    leg.position.set(sx * 0.3, 0.17, sz * 0.6);
    g.add(leg);
  }
  g.position.set(x, 0, z);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function makeBeachBall(x, z) {
  const geo = new THREE.SphereGeometry(0.4, 20, 14);
  const pos = geo.attributes.position;
  const palette = [0xe0554e, 0xf4f1e8, 0x2f7fd8, 0xf4c948].map((c) => new THREE.Color(c));
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const ang = Math.atan2(pos.getZ(i), pos.getX(i));
    const band = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 6) % palette.length;
    const c = palette[band];
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
  const ball = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }));
  ball.position.set(x, 0.4, z);
  ball.castShadow = true;
  return ball;
}

export function makeTable(x, z) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0xf0ebe0, roughness: 0.8 });
  const woodD = new THREE.MeshStandardMaterial({ color: 0xcfc6b2, roughness: 0.8 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 16), wood);
  top.position.y = 0.9;
  g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 8), woodD);
  leg.position.y = 0.45;
  g.add(leg);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 12), woodD);
  base.position.y = 0.04;
  g.add(base);
  for (const sx of [-1.1, 1.1]) {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 12), wood);
    stool.position.set(sx, 0.5, 0);
    g.add(stool);
    const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.5, 8), woodD);
    sl.position.set(sx, 0.25, 0);
    g.add(sl);
  }
  g.position.set(x, 0, z);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function makeGrill(x, z) {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3a3e, roughness: 0.6, metalness: 0.3 });
  const barMat = new THREE.MeshStandardMaterial({ color: 0x555559, roughness: 0.5, metalness: 0.4 });
  const ember = new THREE.MeshStandardMaterial({ color: 0xff7a2a, emissive: 0xff5a1e, emissiveIntensity: 1.8, roughness: 1 });
  const basin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.7), metal);
  basin.position.y = 0.8;
  g.add(basin);
  const coals = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.55), ember);
  coals.position.y = 0.93;
  g.add(coals);
  for (let i = -2; i <= 2; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.05), barMat);
    bar.position.set(0, 1.0, i * 0.12);
    g.add(bar);
  }
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), metal);
    leg.position.set(sx * 0.45, 0.4, 0);
    g.add(leg);
  }
  g.position.set(x, 0, z);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
