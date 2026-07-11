import * as THREE from 'three';

// Galeón pirata "El Pato Mareado". Por ahora es un LANDMARK lejano (la meta en el
// horizonte), sin personajes ni colisión. Más adelante será el nivel final.
// El origen local está en la línea de flotación (y=0); el llamador lo pone en el mar.
// Está armado a lo largo del eje X (proa +X, popa -X) para verse de perfil.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 1, ...opts });
}

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

  const DECK = 5;

  // ---- Casco ----
  const hull = new THREE.Mesh(new THREE.BoxGeometry(30, 6, 9), wood);
  hull.position.y = 2; g.add(hull);
  const hullLow = new THREE.Mesh(new THREE.BoxGeometry(26, 4, 6.5), woodD);
  hullLow.position.y = -1.5; g.add(hullLow);      // se hunde bajo el agua
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(30.2, 1.3, 9.2), trim);
  stripe.position.y = 3.7; g.add(stripe);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(30.4, 0.5, 9.3), woodL);
  rail.position.y = DECK + 0.2; g.add(rail);

  // Proa en punta (bow, +X) + bauprés.
  const bow = new THREE.Mesh(new THREE.ConeGeometry(4.6, 9, 4), wood);
  bow.rotation.z = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, 0.7);
  bow.position.set(16.5, 2.4, 0); g.add(bow);
  const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 10, 8), woodL);
  bowsprit.rotation.z = Math.PI / 2 - 0.35; bowsprit.position.set(21, 6.4, 0); g.add(bowsprit);

  // Castillo de popa (stern, -X) elevado, con ventanitas doradas.
  const stern = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 8.6), wood);
  stern.position.set(-13, DECK + 2, 0); g.add(stern);
  const sternTrim = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1, 8.7), trim);
  sternTrim.position.set(-13, DECK + 4.6, 0); g.add(sternTrim);
  for (const zz of [-2.4, 0, 2.4]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 1), gold);
    w.position.set(-16.55, DECK + 1.5, zz); g.add(w);
  }

  // ---- Cañones asomando por el costado cercano (-Z) ----
  for (const cx of [-6, -2, 2, 6, 10]) {
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.4, 8), woodD);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(cx, 3.3, -4.7); g.add(cannon);
  }

  // ---- Mástiles + velas (con panza) ----
  const masts = [{ x: 9, h: 20, w: 7 }, { x: 0, h: 27, w: 9 }, { x: -10, h: 16, w: 5.5 }];
  for (const m of masts) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.5, m.h, 8), woodL);
    mast.position.set(m.x, DECK + m.h / 2, 0); g.add(mast);

    for (let s = 0; s < 2; s++) {
      const yardY = DECK + m.h * (0.42 + s * 0.34);
      const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, m.w * 1.15, 6), woodD);
      yard.rotation.z = Math.PI / 2;                 // yarda horizontal (a lo largo de X)
      yard.position.set(m.x, yardY, 0); g.add(yard);

      const sw = m.w, sh = m.h * 0.28;
      const sailGeo = new THREE.PlaneGeometry(sw, sh, 8, 4);
      const p = sailGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const nx = p.getX(i) / (sw / 2);             // -1..1
        p.setZ(i, (1 - nx * nx) * 1.4);              // panza hacia el viewer (+Z)
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
  return g;
}
