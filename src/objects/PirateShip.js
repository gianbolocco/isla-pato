import * as THREE from 'three';

// Galeón pirata "El Pato Mareado". Landmark lejano (la meta) y, en el final, ESCENARIO
// CAMINABLE del abordaje. Origen local en la línea de flotación (y=0). Armado a lo largo del
// eje X (proa +X, popa −X). La CUBIERTA caminable está a y=DECK. `makePirateShip()` devuelve
// { group, anchors } con posiciones LOCALES (el World las pasa a mundo con la escala del barco):
//   deck (referencia), deckSpawn/cannon/lulu/cage/wheel, y `colliders` (cajas locales: piso,
//   barandas, muros de proa/popa) que el World escala + ubica.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 1, ...opts });
}
function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

const DECK = 5;   // altura local de la cubierta (superficie caminable = tope de los tablones)

export function makePirateShip() {
  const g = new THREE.Group();
  const wood = mat(0x5b3f26);
  const woodD = mat(0x3a2817);
  const woodL = mat(0x7a5533);
  const plankA = mat(0x6e4a2a), plankB = mat(0x5a3c22);   // tablones (dos tonos)
  const trim = mat(0x8a2f28);                    // franja roja del casco
  const gold = mat(0xcaa25c, { metalness: 0.3, roughness: 0.5 });
  const iron = mat(0x26262c, { metalness: 0.4, roughness: 0.5 });
  const rope = mat(0x8a7448, { roughness: 1 });
  const sailA = mat(0xe8dfc8, { side: THREE.DoubleSide });
  const sailB = mat(0xd8ccae, { side: THREE.DoubleSide });
  const flagMat = mat(0x161418, { side: THREE.DoubleSide });
  const white = mat(0xf2f2f2);

  // ---- Casco ----
  const hull = box(30, 6, 9, wood); hull.position.y = 2; g.add(hull);
  const hullLow = box(26, 4, 6.5, woodD); hullLow.position.y = -1.5; g.add(hullLow);
  const stripe = box(30.2, 1.3, 9.2, trim); stripe.position.y = 3.7; g.add(stripe);

  // ---- Cubierta de TABLONES (superficie al ras de DECK) ----
  const deckPlanks = new THREE.Group();
  const rows = 11, plankW = 8.2 / rows;
  for (let i = 0; i < rows; i++) {
    const z = -4.1 + (i + 0.5) * plankW;
    const pl = box(29.5, 0.16, plankW * 0.9, i % 2 ? plankA : plankB);
    pl.position.set(-0.5, DECK - 0.08, z); deckPlanks.add(pl);
  }
  // Juntas transversales (unas pocas) para dar textura.
  for (const x of [-9, -3, 4, 11]) {
    const seam = box(0.12, 0.17, 8.2, woodD); seam.position.set(x, DECK - 0.07, 0); deckPlanks.add(seam);
  }
  g.add(deckPlanks);

  // ---- Amuras / barandas (bulwarks) con troneras ----
  const bulwark = (z) => {
    const wall = box(29, 1.3, 0.5, wood); wall.position.set(-0.5, DECK + 0.65, z); g.add(wall);
    const cap = box(29, 0.25, 0.6, woodL); cap.position.set(-0.5, DECK + 1.35, z); g.add(cap);
  };
  bulwark(4.3); bulwark(-4.3);
  const capFore = box(0.5, 1.3, 9.1, wood); capFore.position.set(14.4, DECK + 0.65, 0); g.add(capFore);

  // Proa en punta (bow, +X) + bauprés.
  const bow = new THREE.Mesh(new THREE.ConeGeometry(4.6, 9, 4), wood);
  bow.rotation.z = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, 0.7);
  bow.position.set(16.5, 2.4, 0); g.add(bow);
  const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 10, 8), woodL);
  bowsprit.rotation.z = Math.PI / 2 - 0.35; bowsprit.position.set(21, 6.4, 0); g.add(bowsprit);

  // ---- Castillo de popa (alcázar) elevado, con piso de tablones, muro, timón y ventanas ----
  const QY = DECK + 1.6;
  for (let i = 0; i < 6; i++) {   // piso del alcázar (tablones)
    const z = -4.0 + i * 1.35;
    const pl = box(7, 0.16, 1.2, i % 2 ? plankA : plankB); pl.position.set(-11.5, QY - 0.08, z); g.add(pl);
  }
  const sternWall = box(0.6, 4.5, 8.8, wood); sternWall.position.set(-8, DECK + 1.5, 0); g.add(sternWall);  // muro (bloquea)
  const sternBack = box(1.4, 4, 8.8, wood); sternBack.position.set(-15, DECK + 2, 0); g.add(sternBack);
  const sternTrim = box(1.6, 0.9, 8.9, trim); sternTrim.position.set(-15, DECK + 4, 0); g.add(sternTrim);
  for (const zz of [-2.4, 0, 2.4]) {
    const w = box(0.3, 1.2, 1, gold); w.position.set(-15.7, DECK + 2, zz); g.add(w);
  }
  // Barandas del alcázar.
  for (const zz of [-4.2, 4.2]) { const r = box(7, 0.8, 0.3, woodL); r.position.set(-11.5, QY + 0.7, zz); g.add(r); }
  const rimWheel = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 8, 20), woodL);
  rimWheel.position.set(-9.5, QY + 0.9, 0); rimWheel.rotation.y = Math.PI / 2; g.add(rimWheel);
  for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6), woodL); sp.position.set(-9.5, QY + 0.9, 0); sp.rotation.x = (i / 6) * Math.PI; g.add(sp); }

  // ---- Cañones asomando por AMBOS costados (con cureña) ----
  const addCannon = (cx, z, dir) => {
    const carr = box(1.1, 0.35, 0.7, woodD); carr.position.set(cx, DECK + 0.2, z - dir * 0.2); g.add(carr);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 1.5, 10), iron);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(cx, DECK + 0.45, z + dir * 0.6); g.add(barrel);
  };
  for (const cx of [-5, -1, 3, 7, 11]) { addCannon(cx, -4.6, -1); addCannon(cx, 4.6, 1); }

  // ---- Props de cubierta: barriles, cajas, faroles ----
  for (const [x, z] of [[7, -3], [7.9, -3.1], [-3, 3.2]]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 1.1, 12), woodL);
    barrel.position.set(x, DECK + 0.55, z); g.add(barrel);
    for (const yy of [-0.3, 0.3]) { const bnd = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.04, 6, 16), iron); bnd.rotation.x = Math.PI / 2; bnd.position.set(x, DECK + 0.55 + yy, z); g.add(bnd); }
  }
  for (const [x, z] of [[12, 2.6], [12.4, 2.2]]) { const crate = box(0.9, 0.9, 0.9, wood); crate.position.set(x, DECK + 0.45, z); g.add(crate); }
  for (const [x, z] of [[-6.5, -3.6], [13, -2.6]]) {   // faroles que brillan
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), woodD); post.position.set(x, DECK + 0.7, z); g.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0xffffff, { emissive: 0xffb14a, emissiveIntensity: 2.2 })); lamp.position.set(x, DECK + 1.5, z); g.add(lamp);
    const pl = new THREE.PointLight(0xffb14a, 0.5, 10, 2); pl.position.set(x, DECK + 1.5, z); g.add(pl);
  }
  // Rollos de soga.
  for (const [x, z] of [[5.5, 3.4], [-4.5, -3.3]]) {
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.34 - k * 0.03, 0.07, 8, 18), rope); c.rotation.x = Math.PI / 2; c.position.set(x, DECK + 0.15 + k * 0.13, z); g.add(c); }
  }

  // ---- Mástiles + velas ----
  const lineTo = (ax, ay, az, bx, by, bz, r = 0.04) => {
    const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz);
    const len = a.distanceTo(b);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 5), rope);
    c.position.copy(a).add(b).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return c;
  };
  const masts = [{ x: 9, h: 20, w: 7 }, { x: 0, h: 27, w: 9 }, { x: -10, h: 16, w: 5.5 }];
  for (const m of masts) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.5, m.h, 8), woodL);
    mast.position.set(m.x, DECK + m.h / 2, 0); g.add(mast);
    for (let s = 0; s < 2; s++) {
      const yardY = DECK + m.h * (0.42 + s * 0.34);
      const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, m.w * 1.15, 6), woodD);
      yard.rotation.z = Math.PI / 2; yard.position.set(m.x, yardY, 0); g.add(yard);
      const sw = m.w, sh = m.h * 0.28;
      const sailGeo = new THREE.PlaneGeometry(sw, sh, 8, 4);
      const p = sailGeo.attributes.position;
      for (let i = 0; i < p.count; i++) { const nx = p.getX(i) / (sw / 2); p.setZ(i, (1 - nx * nx) * 1.4); }
      sailGeo.computeVertexNormals();
      const sail = new THREE.Mesh(sailGeo, s % 2 ? sailB : sailA);
      sail.position.set(m.x, yardY - sh / 2, 0); g.add(sail);
    }
  }
  // Cuerdas ALTAS entre los topes de los mástiles (bien arriba, NO cruzan la cubierta).
  g.add(lineTo(9, DECK + 20, 0, 0, DECK + 27, 0, 0.05));
  g.add(lineTo(0, DECK + 27, 0, -10, DECK + 16, 0, 0.05));

  // ---- Bandera pirata ----
  const flag = box(3.2, 2, 0.05, flagMat); flag.position.set(1.6, DECK + 27 + 0.5, 0); g.add(flag);
  const skull = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), white); skull.position.set(1.4, DECK + 27 + 0.6, 0.06); g.add(skull);

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // Anchors LOCALES. `colliders` = [cx,cy,cz, hx,hy,hz] (semiejes) → el World los escala/ubica.
  const anchors = {
    deck: { x: 2.25, y: DECK, z: 0, halfX: 10.5, halfZ: 4.1 },
    deckSpawn: { x: 9, y: DECK, z: 2.2 },
    cannon: { x: 4, y: DECK, z: 2.4 },
    lulu: { x: -5, y: DECK, z: 1.4 },
    cage: { x: 10.5, y: DECK, z: -1.6 },
    wheel: { x: -9.5, y: QY + 0.9, z: 0 },
    colliders: [
      [2.25, DECK - 0.25, 0, 10.6, 0.25, 4.15],   // piso de la cubierta (tope = DECK)
      [2.25, DECK + 0.75, 4.35, 11, 1.0, 0.35],    // baranda estribor
      [2.25, DECK + 0.75, -4.35, 11, 1.0, 0.35],   // baranda babor
      [12.9, DECK + 1.0, 0, 0.35, 1.3, 4.35],      // muro de proa (fin de la zona caminable)
      [-8, DECK + 1.2, 0, 0.4, 1.6, 4.35],         // muro de popa (bloquea el alcázar)
    ],
  };

  return { group: g, anchors };
}
