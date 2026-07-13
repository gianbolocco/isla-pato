import * as THREE from 'three';

// Galeón pirata "El Pato Mareado". Landmark lejano (la meta) y, en el final, ESCENARIO
// CAMINABLE del abordaje. El origen local está en la línea de flotación (y=0). Armado a lo
// largo del eje X (proa +X, popa -X). `makePirateShip()` devuelve { group, anchors } donde
// `anchors` son puntos LOCALES (el World/Finale los pasa a mundo con la escala del barco):
//   deck (centro + semiejes de la cubierta caminable), deckSpawn, cannon, lulu, cage, wheel.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 1, ...opts });
}

const DECK = 5;   // altura local de la cubierta

export function makePirateShip() {
  const g = new THREE.Group();
  const wood = mat(0x5b3f26);
  const woodD = mat(0x3a2817);
  const woodL = mat(0x7a5533);
  const trim = mat(0x8a2f28);                    // franja roja del casco
  const gold = mat(0xcaa25c, { metalness: 0.3, roughness: 0.5 });
  const sailA = mat(0xe8dfc8, { side: THREE.DoubleSide });
  const sailB = mat(0xd8ccae, { side: THREE.DoubleSide });
  const flagMat = mat(0x161418, { side: THREE.DoubleSide });
  const white = mat(0xf2f2f2);

  // ---- Casco ----
  const hull = new THREE.Mesh(new THREE.BoxGeometry(30, 6, 9), wood);
  hull.position.y = 2; g.add(hull);
  const hullLow = new THREE.Mesh(new THREE.BoxGeometry(26, 4, 6.5), woodD);
  hullLow.position.y = -1.5; g.add(hullLow);      // se hunde bajo el agua
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(30.2, 1.3, 9.2), trim);
  stripe.position.y = 3.7; g.add(stripe);
  // Piso de cubierta (tablado) al ras de DECK.
  const deckFloor = new THREE.Mesh(new THREE.BoxGeometry(29, 0.4, 8.6), woodL);
  deckFloor.position.y = DECK - 0.05; g.add(deckFloor);

  // Amuras / barandas (bulwarks) alrededor de la cubierta.
  const bul = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, d), wood);
    m.position.set(x, DECK + 0.6, z); g.add(m);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), woodL);
    cap.position.set(x, DECK + 1.25, z); g.add(cap);
  };
  bul(29, 0.5, 0, 4.3); bul(29, 0.5, 0, -4.3);     // costados
  bul(0.5, 9.1, 14.4, 0); bul(0.5, 9.1, -14.4, 0); // proa/popa

  // Proa en punta (bow, +X) + bauprés.
  const bow = new THREE.Mesh(new THREE.ConeGeometry(4.6, 9, 4), wood);
  bow.rotation.z = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, 0.7);
  bow.position.set(16.5, 2.4, 0); g.add(bow);
  const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 10, 8), woodL);
  bowsprit.rotation.z = Math.PI / 2 - 0.35; bowsprit.position.set(21, 6.4, 0); g.add(bowsprit);

  // Castillo de popa (alcázar) elevado, caminable, con 2 escalones y ventanitas doradas.
  const quarter = new THREE.Mesh(new THREE.BoxGeometry(7, 0.5, 8.6), woodL);
  quarter.position.set(-11.5, DECK + 1.6, 0); g.add(quarter);            // piso del alcázar
  for (let i = 0; i < 2; i++) {                                          // escalones
    const st = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 5), woodD);
    st.position.set(-8 + i * 0.9, DECK + 0.4 + i * 0.55, 0); g.add(st);
  }
  const sternWall = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 8.6), wood);
  sternWall.position.set(-15, DECK + 2, 0); g.add(sternWall);
  const sternTrim = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 8.7), trim);
  sternTrim.position.set(-15, DECK + 4, 0); g.add(sternTrim);
  for (const zz of [-2.4, 0, 2.4]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 1), gold);
    w.position.set(-15.9, DECK + 2, zz); g.add(w);
  }
  // Rueda del timón (decorativa) en el alcázar.
  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 8, 20), woodL);
  wheelRim.position.set(-13, DECK + 2.6, 0); wheelRim.rotation.y = Math.PI / 2; g.add(wheelRim);

  // ---- Cañones asomando por el costado lejano (-Z) ----
  for (const cx of [-6, -2, 2, 6, 10]) {
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.4, 8), woodD);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(cx, DECK + 0.4, -4.7); g.add(cannon);
  }

  // ---- Mástiles + velas (con panza) ----
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
      for (let i = 0; i < p.count; i++) {
        const nx = p.getX(i) / (sw / 2);
        p.setZ(i, (1 - nx * nx) * 1.4);
      }
      sailGeo.computeVertexNormals();
      const sail = new THREE.Mesh(sailGeo, s % 2 ? sailB : sailA);
      sail.position.set(m.x, yardY - sh / 2, 0); g.add(sail);
    }
  }

  // ---- Bandera pirata (negra) en el palo mayor ----
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2), flagMat);
  flag.position.set(1.6, DECK + 27 + 0.5, 0); g.add(flag);
  const skull = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), white);
  skull.position.set(1.4, DECK + 27 + 0.6, 0.06); g.add(skull);

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // Anchors LOCALES para el final (el World los pasa a mundo con la escala del barco).
  const anchors = {
    deck: { x: 0, y: DECK, z: 0, halfX: 13.5, halfZ: 4.0 },   // cubierta caminable (centro + semiejes)
    deckSpawn: { x: 3, y: DECK, z: 2.4 },                      // donde aparece Belu al abordar
    cannon: { x: 0, y: DECK, z: 2.6 },                        // el cañón que dispara a Lulu
    lulu: { x: -10.5, y: DECK, z: 0 },                        // Lulu (frente al alcázar)
    cage: { x: 9.5, y: DECK, z: -0.6 },                       // jaula de Gian (hacia proa)
    wheel: { x: -13, y: DECK + 1.6, z: 0 },
  };

  return { group: g, anchors };
}
