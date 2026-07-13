import * as THREE from 'three';
import { woodMats } from './materials.js';

// Barco encallado de la Cala del Naufragio (isla 5): una carabela/balandra low-poly, escorada
// sobre unas rocas de la orilla. Arranca ROTO (casco maltrecho con cuadernas a la vista, sin
// cubierta ni aparejo); a medida que Belu repara en las estaciones se van revelando las piezas
// (`installPart(order)`), y al calafatear con brea `launch(target)` la BOTA: se desliza de las
// rocas al agua, se endereza y queda flotando/meciéndose.
//
// Estructura: `root` (identidad) contiene `rocksGroup` (rocas donde encalló, ESTÁTICAS, se
// quedan en la orilla) + `shipGroup` (el barco entero, es lo que se mueve al botar). Así la
// orilla conserva las rocas cuando el barco se va al agua.
//
// Devuelve { group, colliders (solo rocas), ship: { installPart, launch, update, isLaunched } }.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.92, flatShading: true, ...opts });
}
function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function easeOutBack(t) { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

export function buildShipwreck(x, y, z, rotY = 0) {
  const root = new THREE.Group();

  const wood = woodMats();                       // { light, dark, rope }
  const plank = mat(0x8a5a30), plankD = mat(0x6e4a2a), plankL = mat(0x9c6a3a);
  const woodDk = mat(0x513521), trim = mat(0xb5824a);
  const canvasMat = mat(0xf5eede, { roughness: 1, side: THREE.DoubleSide });
  const stripeMat = mat(0xb23a34);
  const metal = mat(0x3a3a40, { metalness: 0.5, roughness: 0.5 });
  const ropeMat = mat(0x6b5636);

  const L = 13, B = 4.6;

  // ---- Rocas donde encalló (ESTÁTICAS, en la orilla) ----
  const rocksGroup = new THREE.Group();
  rocksGroup.position.set(x, y, z);
  const colliders = [];
  const rockMats = [mat(0x6f757b), mat(0x565c5c), mat(0x7c8188)];
  const cos = Math.cos(rotY), sin = Math.sin(rotY);
  for (const [rx, rz, rr] of [[-5, -2.4, 2.2], [3.5, -2.6, 2.6], [6.5, 1.2, 2.0], [-2.5, 2.8, 1.9], [1, -3.6, 2.0], [-7, 1.6, 1.7]]) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rr), rockMats[Math.floor(Math.abs(rx + rz)) % 3]);
    rock.position.set(rx, 0.1, rz);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.y = 0.7; rock.castShadow = rock.receiveShadow = true;
    rocksGroup.add(rock);
    const wx = x + rx * cos + rz * sin, wz = z - rx * sin + rz * cos;
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(wx, y + 0.1, wz), new THREE.Vector3(rr * 1.5, 1.4, rr * 1.5)));
  }
  root.add(rocksGroup);

  // ---- El barco (se mueve al botar). y local: ~0 = línea de flotación. ----
  const shipGroup = new THREE.Group();
  shipGroup.position.set(x, y + 1.3, z);   // apoyado sobre las rocas
  shipGroup.rotation.y = rotY;
  shipGroup.rotation.z = 0.2;              // escora (se endereza al botar)
  root.add(shipGroup);

  // Casco: cuerpo principal + fondo en V + proa en punta + popa con alcázar. Cubierta ABIERTA.
  const hull = box(L * 0.78, 1.5, B, plank); hull.position.y = -0.35; shipGroup.add(hull);
  const bilge = box(L * 0.7, 0.9, B * 0.6, plankD); bilge.position.y = -1.05; shipGroup.add(bilge);
  const keel = box(L + 0.6, 0.35, 0.5, woodDk); keel.position.y = -1.35; shipGroup.add(keel);

  // Tracas (tablones horizontales) del costado, para textura de casco.
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const strake = box(L * 0.76, 0.34, 0.12, k % 2 ? plankL : plank);
      strake.position.set(0, -0.05 - k * 0.42, s * (B / 2 + 0.01)); shipGroup.add(strake);
    }
  }

  // Proa en punta: dos amuras que convergen a la roda elevada + bauprés.
  for (const s of [-1, 1]) {
    const cheek = box(3.0, 1.5, 0.28, plank);
    cheek.position.set(L / 2 - 0.9, 0.0, s * (B / 4)); cheek.rotation.y = -s * 0.55; shipGroup.add(cheek);
  }
  const stem = box(0.5, 2.0, 0.5, plankD); stem.position.set(L / 2 + 0.25, 0.5, 0); stem.rotation.z = -0.3; shipGroup.add(stem);
  const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.0, 8), plankL);
  bowsprit.rotation.z = Math.PI / 2 - 0.3; bowsprit.position.set(L / 2 + 1.3, 1.1, 0); shipGroup.add(bowsprit);

  // Popa: espejo + alcázar (quarterdeck) elevado con baranda y ventanita.
  const transom = box(0.5, 2.0, B, plank); transom.position.set(-L / 2 + 0.1, 0.1, 0); shipGroup.add(transom);
  const quarter = box(2.6, 0.8, B * 0.92, plankL); quarter.position.set(-L / 2 + 1.5, 1.15, 0); shipGroup.add(quarter);
  const win = box(0.1, 0.6, 0.7, mat(0xffd98a, { emissive: 0x6b4a12, emissiveIntensity: 0.5 }));
  win.position.set(-L / 2 + 0.05, 0.6, 0); shipGroup.add(win);

  // Amuras/baranda (bulwark) con curva de brusca: más alta en proa y popa.
  for (const s of [-1, 1]) {
    for (const [bx, by] of [[-L / 2 + 1.3, 1.0], [-2, 0.55], [2, 0.55], [L / 2 - 1.6, 1.05]]) {
      const rail = box(2.6, 0.5, 0.22, trim);
      rail.position.set(bx, by, s * (B / 2 - 0.05)); shipGroup.add(rail);
    }
  }

  // Cuadernas (ribs) a la vista mientras falta la cubierta (estado roto).
  const ribs = new THREE.Group();
  for (let i = -3; i <= 3; i++) {
    const rib = box(0.16, 1.4, B * 0.9, woodDk);
    rib.position.set(i * 1.4, 0.1, 0); ribs.add(rib);
  }
  shipGroup.add(ribs);

  // ---- Piezas de reparación (ocultas; se revelan en las estaciones) ----
  const pieces = {};

  // 1) Parche de casco (proa) · 2) Parche de casco (popa): tapan el hueco de tablas.
  for (const [key, cxp] of [[1, 2.4], [2, -2.4]]) {
    const patch = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      for (const s of [-1, 1]) {
        const pl = box(3.0, 0.36, 0.14, plankL);
        pl.position.set(cxp, 0.0 - k * 0.42, s * (B / 2 + 0.03)); patch.add(pl);
      }
    }
    pieces[key] = patch;
  }

  // 3) Cubierta (tablones caminables sobre la abertura) — al ponerla tapa las cuadernas.
  const deck = new THREE.Group();
  const planks = 12;
  for (let i = 0; i < planks; i++) {
    const pl = box(L * 0.82 / planks * 0.92, 0.16, B * 0.86, i % 2 ? plankL : plank);
    pl.position.set(-L * 0.41 + (i + 0.5) * (L * 0.82 / planks), 0.7, 0); deck.add(pl);
  }
  const hatch = box(1.2, 0.3, 1.2, woodDk); hatch.position.set(-1, 0.9, 0); deck.add(hatch);
  pieces[3] = deck;

  // 4) Timón (a popa).
  const rudder = new THREE.Group();
  const blade = box(0.2, 2.0, 1.0, woodDk); blade.position.set(-L / 2 - 0.15, -0.9, 0); rudder.add(blade);
  pieces[4] = rudder;

  // 5) Mástil (vertical, apenas a proa del centro).
  const mast = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 9, 10), plankL);
  pole.position.set(0.5, 4.8, 0); mast.add(pole);
  const step = box(0.9, 0.5, 0.9, woodDk); step.position.set(0.5, 0.9, 0); mast.add(step);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.4, 8), plankL);
  top.position.set(0.5, 8.4, 0); mast.add(top);   // cofa
  pieces[5] = mast;

  // 6) Verga (palo horizontal, athwartships).
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, B * 1.7, 8), plankL);
  yard.rotation.x = Math.PI / 2; yard.position.set(0.5, 6.6, 0);
  pieces[6] = yard;

  // 7) Aparejo: vela cuadra crema (con panza) + franja roja + foque + jarcia (obenques/estáis).
  const rig = new THREE.Group();
  const sailGeo = new THREE.PlaneGeometry(B * 1.6, 4.6, 6, 4);
  const sp = sailGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / (B * 0.8); sp.setZ(i, Math.cos(u * 1.2) * 0.7 - 0.35); }
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, canvasMat);
  sail.rotation.y = Math.PI / 2;           // la vela cruza a lo ancho (bajo la verga), no de proa a popa
  sail.position.set(0.5, 4.3, 0); rig.add(sail);
  const stripe = box(0.12, 0.8, B * 1.6, stripeMat); stripe.position.set(0.5, 5.5, 0); rig.add(stripe);
  // Foque (triangular) del bauprés al mástil.
  const jibGeo = new THREE.BufferGeometry();
  jibGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    0.5, 7.6, 0, L / 2 + 2.6, 1.4, 0, 0.5, 2.6, 0,
  ], 3));
  jibGeo.setIndex([0, 1, 2]); jibGeo.computeVertexNormals();
  const jib = new THREE.Mesh(jibGeo, canvasMat); rig.add(jib);
  // Jarcia: obenques a los costados + estáis proa/popa (cilindros finos).
  const lineTo = (ax, ay, az, bx, by, bz) => {
    const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz);
    const len = a.distanceTo(b);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 5), ropeMat);
    c.position.copy(a).add(b).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return c;
  };
  for (const s of [-1, 1]) {
    rig.add(lineTo(0.5, 8.2, 0, -3, 0.8, s * (B / 2)));
    rig.add(lineTo(0.5, 8.2, 0, 3.5, 0.8, s * (B / 2)));
  }
  rig.add(lineTo(0.5, 8.2, 0, L / 2 + 2.4, 1.2, 0));    // estái de proa
  rig.add(lineTo(0.5, 8.2, 0, -L / 2 + 0.3, 0.4, 0));   // estái de popa
  pieces[7] = rig;

  // 8) Rueda del timón (en el alcázar).
  const wheel = new THREE.Group();
  const rimW = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 20), plankL); wheel.add(rimW);
  for (let i = 0; i < 6; i++) { const sp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), plankL); sp2.rotation.z = (i / 6) * Math.PI; wheel.add(sp2); }
  wheel.rotation.y = Math.PI / 2; wheel.position.set(-L / 2 + 2.4, 1.9, 0);
  pieces[8] = wheel;

  // Banderín pirata (se iza al botar).
  const pennant = new THREE.Group();
  const cloth = box(1.1, 0.7, 0.03, mat(0x1a1a1f)); cloth.position.set(-0.55, 0, 0.02); pennant.add(cloth);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(0xf2efe6)); skull.position.set(-0.55, 0.04, 0.05); skull.scale.z = 0.4; pennant.add(skull);
  pennant.position.set(0.5, 8.9, 0);
  pieces.pennant = pennant;

  for (const g of Object.values(pieces)) { g.visible = false; shipGroup.add(g); }
  shipGroup.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ---- Animación: pop de piezas + botadura (deslizar al agua) + cabeceo ----
  const anims = [];
  let launching = false, launched = false, tL = 0, t = 0, cinematic = false;
  let fromPos = null, fromRotZ = 0, toPos = null;

  const revealRibsHidden = () => { if (pieces[3].visible) ribs.visible = false; };

  const ship = {
    isLaunched: () => launched,
    group3d: shipGroup,                    // grupo que se mueve (para la cinemática)
    setCinematic(b) { cinematic = b; },    // true = deja de auto-actualizarse (lo maneja la cinemática)

    installPart(order) {
      const g = pieces[order];
      if (!g || g.visible) return;
      g.visible = true; g.scale.setScalar(0.01);
      anims.push({ g, t: 0 });
      revealRibsHidden();
    },

    // target: THREE.Vector3 (o {x,y,z}) en el mar. Bota el barco: se desliza y se endereza.
    launch(target) {
      if (launching || launched) return;
      launching = true;
      fromPos = shipGroup.position.clone();
      fromRotZ = shipGroup.rotation.z;
      toPos = new THREE.Vector3(target.x, target.y, target.z);
      if (pieces.pennant) { pieces.pennant.visible = true; pieces.pennant.scale.setScalar(0.01); anims.push({ g: pieces.pennant, t: 0 }); }
      revealRibsHidden();
    },

    update(dt) {
      if (cinematic) return;   // durante la cinemática el barco lo mueve SailCutscene
      t += dt;
      for (let i = anims.length - 1; i >= 0; i--) {
        const a = anims[i]; a.t += dt * 2.4;
        a.g.scale.setScalar(a.t >= 1 ? 1 : easeOutBack(Math.min(1, a.t)));
        if (a.t >= 1) { a.g.scale.setScalar(1); anims.splice(i, 1); }
      }
      if (launching && !launched) {
        tL = Math.min(1, tL + dt * 0.42);
        const e = easeInOut(tL);
        shipGroup.position.lerpVectors(fromPos, toPos, e);
        shipGroup.rotation.z = fromRotZ + (0.02 - fromRotZ) * e;
        if (tL >= 1) launched = true;
      }
      // Cabeceo continuo una vez a flote (grounded = quieto sobre las rocas).
      if (launched) {
        shipGroup.position.y = toPos.y + Math.sin(t * 0.7) * 0.2;
        shipGroup.rotation.z = 0.02 + Math.sin(t * 0.5) * 0.01;
        shipGroup.rotation.x = Math.sin(t * 0.6) * 0.012;
      }
    },
  };

  return { group: root, colliders, ship };
}
