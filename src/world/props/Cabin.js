import * as THREE from 'three';
import { meshFrom } from '../meshUtils.js';
import { makeWoodTex, makeStripeTex, makeHeartTex } from '../textures.js';

// Cabaña HABITABLE: paredes huecas con puerta abierta, interior con cama y muebles,
// ventanas que brillan y luz tibia. Colisión por paredes (con hueco en la puerta).
// Devuelve { group, colliders } para que el World los agregue a la escena/colisiones.
export function buildCabin(cx = 0, cz = -8) {
  const group = new THREE.Group();
  const colliders = [];

  const W = 8, H = 3.6, D = 7;
  const t = 0.25;                    // espesor de pared
  const front = cz + D / 2, back = cz - D / 2;
  const left = cx - W / 2, right = cx + W / 2;
  const doorHalf = 0.95, doorH = 2.4;

  const logMat = new THREE.MeshStandardMaterial({ color: 0xb07a45, roughness: 1, flatShading: true });
  const logDark = new THREE.MeshStandardMaterial({ color: 0x8a5c30, roughness: 1, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xa23c34, roughness: 1, flatShading: true });
  const floorTex = makeWoodTex('#a5703c', '#6e4522'); floorTex.repeat.set(5, 4);
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 1 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 1 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xffe6a3, emissive: 0xffb64d, emissiveIntensity: 1.6, roughness: 0.5,
  });

  // Pared: mesh + collider (salvo collide=false para el dintel).
  const wall = (w, h, d, x, y, z, collide = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), logMat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
    if (collide) {
      colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, y, z), new THREE.Vector3(w, h, d)));
    }
  };

  // Piso de madera.
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, D), floorMat);
  floor.position.set(cx, 0.01, cz);
  floor.receiveShadow = true;
  group.add(floor);

  // Paredes: fondo, izquierda, derecha, y frente partido por la puerta.
  wall(W, H, t, cx, H / 2, back);                       // fondo
  wall(t, H, D, left, H / 2, cz);                       // izquierda
  wall(t, H, D, right, H / 2, cz);                      // derecha
  const segW = (W / 2 - doorHalf);
  wall(segW, H, t, (left - doorHalf) / 2, H / 2, front); // frente-izq
  wall(segW, H, t, (right + doorHalf) / 2, H / 2, front);// frente-der
  // Dintel sobre la puerta (sin colisión; la puerta es más baja que Belu).
  wall(doorHalf * 2, H - doorH, t, cx, (doorH + H) / 2, front, false);

  // ---- Techo a dos aguas EN PICO (^) ----
  const peak = 2.0;
  const eaveHalf = W / 2 + 0.6;
  const theta = Math.atan2(peak, eaveHalf);
  const slabLen = Math.hypot(eaveHalf, peak) + 0.2;
  for (const s of [-1, 1]) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(slabLen, 0.18, D + 1.0), roofMat);
    slab.position.set(cx + s * eaveHalf / 2, H + peak / 2, cz);
    slab.rotation.z = -s * theta;
    slab.castShadow = true;
    group.add(slab);
  }
  for (const zf of [front, back]) {
    const tri = [cx - W / 2, H, zf,  cx + W / 2, H, zf,  cx, H + peak, zf];
    group.add(meshFrom(tri, 0xb07a45, { flat: true }));
  }

  // Puerta ABIERTA (batiente girado en la bisagra del lado izquierdo del hueco).
  const doorPivot = new THREE.Group();
  doorPivot.position.set(cx - doorHalf, doorH / 2, front);
  doorPivot.rotation.y = -1.15;      // abierta hacia afuera
  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorHalf * 2, doorH, 0.1), doorMat);
  doorPanel.position.set(doorHalf, 0, 0);
  doorPivot.add(doorPanel);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xd9b25a, roughness: 0.4, metalness: 0.3 }));
  knob.position.set(doorHalf * 1.7, 0, 0.1);
  doorPivot.add(knob);
  group.add(doorPivot);

  // Ventanas con marco y cruceta: 2 laterales + 2 al frente.
  // facing: 'x' (pared lateral) o 'z' (pared del frente); nrm = normal saliente (±).
  const addWindow = (px, py, pz, facing, nrm) => {
    const fw = 1.35, fh = 1.35, inner = 0.22;
    const isX = facing === 'x';
    const off = (base, o) => base + nrm * o;
    const frame = new THREE.Mesh(
      isX ? new THREE.BoxGeometry(0.1, fh, fw) : new THREE.BoxGeometry(fw, fh, 0.1), logDark);
    frame.position.set(isX ? off(px, 0.05) : px, py, isX ? pz : off(pz, 0.05));
    group.add(frame);
    const glass = new THREE.Mesh(
      isX ? new THREE.BoxGeometry(0.08, fh - inner, fw - inner) : new THREE.BoxGeometry(fw - inner, fh - inner, 0.08), glowMat);
    glass.position.set(isX ? off(px, 0.11) : px, py, isX ? pz : off(pz, 0.11));
    group.add(glass);
    const vBar = new THREE.Mesh(
      isX ? new THREE.BoxGeometry(0.05, fh - inner, 0.06) : new THREE.BoxGeometry(0.06, fh - inner, 0.05), logDark);
    vBar.position.set(isX ? off(px, 0.14) : px, py, isX ? pz : off(pz, 0.14));
    group.add(vBar);
    const hBar = new THREE.Mesh(
      isX ? new THREE.BoxGeometry(0.05, 0.06, fw - inner) : new THREE.BoxGeometry(fw - inner, 0.06, 0.05), logDark);
    hBar.position.set(isX ? off(px, 0.14) : px, py, isX ? pz : off(pz, 0.14));
    group.add(hBar);
  };
  addWindow(left, 1.9, cz + 1.4, 'x', -1);              // lateral izquierda
  addWindow(right, 1.9, cz + 1.4, 'x', 1);              // lateral derecha
  addWindow((left - doorHalf) / 2, 1.9, front, 'z', 1); // frente izquierda
  addWindow((right + doorHalf) / 2, 1.9, front, 'z', 1);// frente derecha

  // Chimenea.
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), logDark);
  chimney.position.set(cx + W / 2 - 0.7, H + 0.9, cz - 0.9);
  chimney.castShadow = true;
  group.add(chimney);

  // Muebles adentro.
  addFurniture(group, cx, cz, back, right);

  // Luz interior tibia (sin sombras, barata).
  const warm = new THREE.PointLight(0xffcf8a, 1.3, 16, 2);
  warm.position.set(cx, 2.4, cz);
  group.add(warm);

  return { group, colliders };
}

// Cama + muebles dentro de la cabaña (con texturas procedurales para que se vea lindo).
function addFurniture(g, cx, cz, back, right) {
  const woodTex = makeWoodTex('#8a5c30', '#5f3c1f'); woodTex.repeat.set(2, 2);
  const wood = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 1 });
  const sheet = new THREE.MeshStandardMaterial({ color: 0xf5efe4, roughness: 1 });
  const quiltTex = makeStripeTex('#d98c86', '#f0e2d0', 6); quiltTex.repeat.set(2, 1);
  const blanket = new THREE.MeshStandardMaterial({ map: quiltTex, roughness: 1 });

  // Cama contra la pared del fondo (a la izquierda).
  const bx = cx - 2.2, bz = back + 1.4;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 2.4), wood);
  frame.position.set(bx, 0.25, bz);
  g.add(frame);
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.16), wood);
  headboard.position.set(bx, 0.5, bz - 1.2);
  g.add(headboard);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.25, 2.2), sheet);
  mattress.position.set(bx, 0.5, bz);
  g.add(mattress);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.5), sheet);
  pillow.position.set(bx, 0.68, bz - 0.85);
  g.add(pillow);
  const quilt = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 1.4), blanket);
  quilt.position.set(bx, 0.66, bz + 0.4);
  g.add(quilt);

  // Mesita de luz + lamparita que brilla.
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.6), wood);
  stand.position.set(bx + 1.4, 0.35, bz - 0.9);
  g.add(stand);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffe6a3, emissive: 0xffb64d, emissiveIntensity: 1.8, roughness: 0.5 }));
  lamp.position.set(bx + 1.4, 0.85, bz - 0.9);
  g.add(lamp);

  // Alfombra a rayas.
  const rugTex = makeStripeTex('#6a94b0', '#dbe8ef', 7); rugTex.repeat.set(1, 1);
  const rug = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.03, 2.6),
    new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
  rug.position.set(cx + 1, 0.04, cz + 0.6);
  g.add(rug);

  // Baúl / cómoda contra la pared derecha.
  const chest = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.7), wood);
  chest.position.set(right - 0.9, 0.45, cz + 1.6);
  g.add(chest);
  const chestLid = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 1 }));
  chestLid.position.set(right - 0.9, 0.92, cz + 1.6);
  g.add(chestLid);

  // Estante con libritos.
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.4), wood);
  shelf.position.set(cx + 2.3, 2.3, back + 0.3);
  g.add(shelf);
  for (let i = 0; i < 4; i++) {
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.28),
      new THREE.MeshStandardMaterial({ color: [0x88586f, 0x4f7f6f, 0xc08a3e, 0x9a5b4a][i], roughness: 1 }));
    book.position.set(cx + 1.85 + i * 0.2, 2.52, back + 0.3);
    g.add(book);
  }

  // Cuadrito con corazón en la pared del fondo (toque tierno).
  const pframe = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.82, 0.06), wood);
  pframe.position.set(cx - 2.2, 2.3, back + 0.14);
  g.add(pframe);
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.64),
    new THREE.MeshStandardMaterial({ map: makeHeartTex(), roughness: 0.85 }));
  photo.position.set(cx - 2.2, 2.3, back + 0.18);
  g.add(photo);

  // Plantita en maceta en un rincón.
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.36, 12),
    new THREE.MeshStandardMaterial({ color: 0xb5623c, roughness: 1 }));
  pot.position.set(right - 0.5, 0.18, cz - 2.3);
  g.add(pot);
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.1, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x4e9b45, roughness: 1, flatShading: true }));
    leaf.position.set(right - 0.5 + (Math.random() - 0.5) * 0.3, 0.5 + Math.random() * 0.25, cz - 2.3 + (Math.random() - 0.5) * 0.3);
    g.add(leaf);
  }

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
}
