import * as THREE from 'three';

// Barco encallado de la Cala del Naufragio (isla 5): un velero grande hecho pedazos,
// escorado sobre unas rocas de la orilla. Arranca ROTO (casco maltrecho, cuadernas a la
// vista, sin mástil/vela/timón/rueda); a medida que Belu resuelve el puzzle de armado se
// van revelando las piezas (`installPart(order)`), y al completarlo `repair()` iza la
// bandera y endereza el barco (queda listo para zarpar).
//
// Devuelve { group, colliders, installPart(order), repair(), update(dt), isRepaired() }.
// Eje del casco a lo largo de X local (proa hacia +X). rotY orienta el barco en el mundo.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.92, flatShading: true, ...opts });
}
function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function easeOutBack(t) { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

export function buildShipwreck(x, y, z, rotY = 0) {
  const root = new THREE.Group();
  root.position.set(x, y, z);
  root.rotation.y = rotY;

  const colliders = [];
  const cos = Math.cos(rotY), sin = Math.sin(rotY);
  const worldPos = (lx, lz) => new THREE.Vector3(x + lx * cos + lz * sin, y, z - lx * sin + lz * cos);

  const wood = mat(0x6e4a2a), woodD = mat(0x513521), woodL = mat(0x8a5a30), trim = mat(0x9c6a3a);
  const canvasMat = mat(0xe9e2cf, { roughness: 1, side: THREE.DoubleSide });
  const metal = mat(0x3a3a40, { metalness: 0.5, roughness: 0.5 });

  // ---- Rocas donde encalló (base sólida) ----
  const rockMats = [mat(0x6f757b), mat(0x565c5c), mat(0x7c8188)];
  for (const [rx, rz, rr] of [[-7, -2.5, 2.4], [4, -3, 2.8], [8, 1.5, 2.2], [-3, 3.2, 2.0], [1, -4.2, 2.2], [-9, 2, 1.8]]) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rr), rockMats[(rx + rz + 6) % 3 | 0] || rockMats[0]);
    rock.position.set(rx, 0.2, rz);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.y = 0.7;
    rock.castShadow = rock.receiveShadow = true;
    root.add(rock);
    const c = worldPos(rx, rz); c.y = y + 0.2;
    colliders.push(new THREE.Box3().setFromCenterAndSize(c, new THREE.Vector3(rr * 1.5, 1.4, rr * 1.5)));
  }

  // ---- Casco (escorado; se endereza al reparar) ----
  const L = 18, B = 6, D = 4;
  const tilt = new THREE.Group();
  tilt.position.y = 2.0;         // apoyado sobre las rocas
  tilt.rotation.z = 0.22;        // escora a babor (roto); repair() la lleva a ~0.03
  tilt.rotation.x = 0.05;
  root.add(tilt);

  // Quilla + pantoque (fondo redondeado con un medio-cilindro).
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(B / 2, B / 2, L, 20, 1, true, 0, Math.PI), wood);
  bottom.rotation.z = Math.PI / 2;      // eje del cilindro pasa a X
  bottom.rotation.y = Math.PI;          // la parte abierta (cubierta) queda arriba
  bottom.position.y = 0;
  bottom.material.side = THREE.DoubleSide;
  tilt.add(bottom);
  const keel = box(L + 1, 0.5, 0.7, woodD); keel.position.y = -B / 2 + 0.2; tilt.add(keel);

  // Amuras (bordes superiores del casco) a lo largo, con leve flare.
  for (const s of [-1, 1]) {
    const rail = box(L * 0.98, 0.4, 0.4, trim);
    rail.position.set(0, 0.3, s * (B / 2 - 0.2));
    tilt.add(rail);
    // Tracas (tablones horizontales) del costado.
    for (let k = 0; k < 3; k++) {
      const strake = box(L * 0.96, 0.5, 0.14, k % 2 ? woodL : wood);
      strake.position.set(0, -0.1 - k * 0.7, s * (B / 2 - 0.05 + 0.02 * k));
      tilt.add(strake);
    }
  }

  // Proa: dos costados que convergen a una roda (stem).
  for (const s of [-1, 1]) {
    const cheek = box(3.2, D * 0.7, 0.3, wood);
    cheek.position.set(L / 2 - 1.0, 0.1, s * (B / 4));
    cheek.rotation.y = -s * 0.5;
    tilt.add(cheek);
  }
  const stem = box(0.5, D * 0.9, 0.5, woodD);
  stem.position.set(L / 2 + 0.3, 0.4, 0); stem.rotation.z = -0.35; tilt.add(stem);
  // Bauprés.
  const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3.4, 8), woodL);
  bowsprit.rotation.z = Math.PI / 2 - 0.35; bowsprit.position.set(L / 2 + 1.4, 1.0, 0); tilt.add(bowsprit);

  // Popa: espejo + castillo con ventanita.
  const transom = box(0.5, D * 0.9, B * 0.9, wood);
  transom.position.set(-L / 2 + 0.1, 0.3, 0); tilt.add(transom);
  const castle = box(3.0, 2.0, B * 0.86, woodL);
  castle.position.set(-L / 2 + 1.6, 1.5, 0); tilt.add(castle);
  const win = box(0.1, 0.6, 0.6, mat(0xffd98a, { emissive: 0x6b4a12, emissiveIntensity: 0.6 }));
  win.position.set(-L / 2 + 0.05, 1.6, 0); tilt.add(win);

  // Sección rota: hueco en un costado con las cuadernas (ribs) a la vista.
  const ribs = new THREE.Group();
  for (let i = -2; i <= 2; i++) {
    const rib = box(0.16, D * 0.8, 0.5, woodD);
    rib.position.set(i * 1.1, -0.2, -(B / 2 - 0.1));
    rib.rotation.x = 0.25;
    ribs.add(rib);
  }
  tilt.add(ribs);

  // Tablones sueltos y barril de escombro sobre las rocas (ambiente de destrozo).
  for (const [px, py, pz, rz] of [[2, 0.3, 3.4, 0.6], [-4, 0.2, -3.6, -0.4], [6, 0.2, 3.0, 0.2]]) {
    const p = box(2.4, 0.16, 0.5, wood); p.position.set(px, py, pz); p.rotation.z = rz; p.rotation.y = rz; root.add(p);
  }

  // ---- Piezas de reparación (ocultas; se revelan al armar) ----
  const pieces = {};   // order -> objeto

  // 1) Tablas de proa (parche sobre el hueco, lado proa).
  const bowPatch = new THREE.Group();
  for (let k = 0; k < 3; k++) { const pl = box(3.2, 0.5, 0.16, woodL); pl.position.set(2.2, -0.1 - k * 0.7, -(B / 2 - 0.02)); bowPatch.add(pl); }
  pieces[1] = bowPatch;

  // 2) Tablas de popa (parche sobre el hueco, lado popa).
  const sternPatch = new THREE.Group();
  for (let k = 0; k < 3; k++) { const pl = box(3.2, 0.5, 0.16, woodL); pl.position.set(-2.2, -0.1 - k * 0.7, -(B / 2 - 0.02)); sternPatch.add(pl); }
  pieces[2] = sternPatch;

  // 3) Cubierta (tablones caminables sobre la abertura).
  const deck = new THREE.Group();
  const planks = 11;
  for (let i = 0; i < planks; i++) {
    const pl = box(L * 0.88 / planks * 0.94, 0.18, B * 0.82, i % 2 ? woodL : wood);
    pl.position.set(-L * 0.44 + (i + 0.5) * (L * 0.88 / planks), 0.85, 0);
    deck.add(pl);
  }
  pieces[3] = deck;

  // 4) Timón (a popa, bajo el espejo).
  const rudder = new THREE.Group();
  const blade = box(0.2, 2.2, 1.1, woodD); blade.position.set(-L / 2 - 0.2, -1.0, 0); rudder.add(blade);
  const tiller = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), metal);
  tiller.rotation.z = Math.PI / 2; tiller.position.set(-L / 2 + 0.4, 0.3, 0); rudder.add(tiller);
  pieces[4] = rudder;

  // 5) Mástil (vertical, al centro).
  const mast = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 11, 10), woodL);
  pole.position.set(0.5, 6.0, 0); mast.add(pole);
  const step = box(1.0, 0.6, 1.0, woodD); step.position.set(0.5, 0.9, 0); mast.add(step);
  pieces[5] = mast;

  // 6) Verga (palo horizontal cerca de la punta del mástil).
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 8.5, 8), woodL);
  yard.rotation.x = Math.PI / 2; yard.position.set(0.5, 9.2, 0);
  pieces[6] = yard;

  // 7) Vela (colgada de la verga, con panza).
  const sailGeo = new THREE.PlaneGeometry(7.5, 6, 6, 4);
  const sp = sailGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / 3.75; sp.setZ(i, Math.cos(u * 1.2) * 0.9 - 0.5); }
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, canvasMat);
  sail.rotation.x = -Math.PI / 2; sail.rotation.z = 0; sail.position.set(0.5, 6.1, 0.0);
  // Franja roja pirata.
  const stripe = box(7.5, 0.9, 0.02, mat(0xb23a34)); stripe.position.set(0.5, 7.4, 0.05);
  const sailG = new THREE.Group(); sailG.add(sail); sailG.add(stripe);
  pieces[7] = sailG;

  // 8) Rueda del timón (en el castillo de popa).
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.09, 8, 20), woodL);
  wheel.add(rim);
  for (let i = 0; i < 6; i++) { const sp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6), woodL); sp2.rotation.z = (i / 6) * Math.PI; wheel.add(sp2); }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), metal); wheel.add(hub);
  wheel.rotation.y = Math.PI / 2;
  wheel.position.set(-L / 2 + 2.4, 2.4, 0);
  pieces[8] = wheel;

  // Bandera pirata (se iza al terminar, en repair()).
  const flag = new THREE.Group();
  const cloth = box(1.2, 0.8, 0.03, mat(0x1a1a1f));
  cloth.position.set(0, 0, 0.02); flag.add(cloth);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(0xf2efe6));
  skull.position.set(0, 0.05, 0.05); skull.scale.z = 0.4; flag.add(skull);
  flag.position.set(0.5, 11.4, 0); flag.scale.x = -1;   // ondea hacia -X (popa)

  for (const g of Object.values(pieces)) { g.visible = false; tilt.add(g); }
  flag.visible = false; tilt.add(flag);
  tilt.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ---- Animación (pop de piezas + enderezado al reparar + cabeceo) ----
  const anims = [];
  let repairing = false, repaired = false, tRepair = 0, t = 0;
  const baseTiltZ = tilt.rotation.z, baseTiltX = tilt.rotation.x, baseY = root.position.y;

  return {
    group: root,
    colliders,
    isRepaired: () => repaired,

    installPart(order) {
      const g = pieces[order];
      if (!g || g.visible) return;
      g.visible = true; g.scale.setScalar(0.01);
      anims.push({ g, t: 0 });
    },

    repair() {
      if (repairing) return;
      repairing = true;
      flag.visible = true; flag.scale.setScalar(0.01);
      anims.push({ g: flag, t: 0 });
    },

    update(dt) {
      t += dt;
      // Pop de las piezas recién instaladas (easeOutBack).
      for (let i = anims.length - 1; i >= 0; i--) {
        const a = anims[i]; a.t += dt * 2.4;
        const s = a.t >= 1 ? 1 : easeOutBack(Math.min(1, a.t));
        a.g.scale.setScalar(s);
        if (a.t >= 1) { a.g.scale.setScalar(1); anims.splice(i, 1); }
      }
      // Enderezado + asentado en el agua al reparar.
      if (repairing && !repaired) {
        tRepair = Math.min(1, tRepair + dt * 0.6);
        tilt.rotation.z = baseTiltZ + (0.03 - baseTiltZ) * tRepair;
        tilt.rotation.x = baseTiltX + (0.0 - baseTiltX) * tRepair;
        if (tRepair >= 1) repaired = true;
      }
      // Cabeceo suave (más marcado una vez reparado, como meciéndose).
      const amp = repaired ? 0.18 : 0.05;
      root.position.y = baseY + Math.sin(t * 0.7) * amp;
      root.rotation.z = Math.sin(t * 0.5) * (repaired ? 0.015 : 0.006);
    },
  };
}
