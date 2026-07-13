import * as THREE from 'three';
import { meshFrom } from './meshUtils.js';
import { makePalm, makeCloud, makeBush, makeTree, makePine } from './props/nature.js';
import { makeDriftwood, makeAnchor, makeCampfire, makeFishingNet, makeStarfish, makeShell, makeSeaweed } from './props/coast.js';
import { makeUmbrella, makeLounger, makeBeachBall, makeTable, makeGrill } from './props/beach.js';
import { makeChair, makeBucket, makeTackleBox, makeBottle as makeDrinkBottle, makeReeds } from './props/fishing.js';
import { buildBarrel, buildWreck } from './props/parkour.js';
import { buildRock } from './props/rocks.js';
import { stoneMats } from './props/materials.js';
import { buildCabin } from './props/Cabin.js';
import { buildDock } from './props/Dock.js';
import { buildBrokenBridge, buildBridge, buildWoodPlatform, buildRockPlatform } from './props/structures.js';
import { buildGate } from './props/Gate.js';
import { makeDrawbridge, makeGantry, makeCRT } from './props/bunker.js';
import { buildShipwreck } from './props/shipwreck.js';
import { makePirateShip } from '../objects/PirateShip.js';
import { makeLighthouse } from '../objects/Lighthouse.js';
import { QUIZ, BUNKER, NAUFRAGIO } from '../config.js';   // parrotPos: zona a despejar; BUNKER/NAUFRAGIO: islas 4 y 5

// El mundo: orquesta las islas (terreno con altura, playa, nieve), el mar, cielo,
// luces y la ubicación de todos los props (que viven en ./props/*). Mantiene la
// lógica de terreno (groundHeightAt) y los datos del minimapa (getMapData).
//
// - groundHeightAt(x,z): altura de piso solido (incluye la montaña), o null si es mar.
// - getColliders(): cajas (Box3) de cabaña, muelle y puentes.
// - getMapData(): datos para el minimapa (contornos de islas, puentes, plataformas).

const SEA_LEVEL = -1.4;
const KILL_Y = -8;

// name: se muestra en el minimapa. rocky: estética rocosa (isla 2). Las islas que
// todavía no diseñamos quedan sin nombre (el minimapa las marca con "?").
// Las islas NO están en línea recta: zigzaguean en Z (el eje X sigue creciendo, que es
// el sentido del viaje) para que el archipiélago se vea natural y los puentes/parkour
// crucen en diagonal. Isla Pato queda en cz=0 (ahí está el spawn/cabaña/muelle).
const ISLANDS = [
  { name: 'Isla Pato', cx: 0, cz: 0, base: 36, amp: 7, freq: 3, phase: 0.0 },
  // Cabo Roca es GRANDE a propósito (Juancho está escondido y cuesta encontrarlo).
  { name: 'Cabo Roca', cx: 118, cz: 22, base: 38, amp: 6, freq: 4, phase: 1.3, rocky: true },
  { name: 'Cala del Pescador', cx: 240, cz: 0, base: 24, amp: 5, freq: 5, phase: 0.5 },  // lejos de Cabo Roca (puente largo)
  { name: 'El Búnker', cx: 350, cz: -18, base: 22, amp: 5, freq: 6, phase: 2.0, bunker: true },  // isla 4: puzzle lógico
  // Isla 5: la MÁS grande, rocosa y con montañas (lomas empinadas). Bordes de playa como
  // Isla Pato. `hills` = relieve caminable/empinado (ver hillsHeight). Nemo + barco encallado.
  {
    name: 'Cala del Naufragio', cx: 460, cz: -44, base: 46, amp: 8, freq: 4, phase: 0.8, rocky: true,
    hills: [
      { dx: -14, dz: 6, r: 15, h: 10 },    // pico empinado (pieza escondida arriba) — parkour
      { dx: 16, dz: -8, r: 22, h: 9 },     // loma grande
      { dx: 4, dz: 24, r: 16, h: 6 },
      { dx: -8, dz: -22, r: 17, h: 7 },
    ],
  },
];

function islandRadius(isl, a) {
  return isl.base
    + isl.amp * Math.sin(isl.freq * a + isl.phase)
    + isl.amp * 0.45 * Math.sin(isl.freq * 2 * a + isl.phase * 1.7);
}

function smoother(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

// Relieve de lomas/montañas: suma de montículos suaves (smootherstep) definidos en
// `isl.hills` = [{dx, dz, r, h}]. Devuelve la altura del terreno en (x,z), 0 si la isla no
// tiene lomas. Los montículos deben apagarse antes del borde (para no romper la playa).
function hillsHeight(isl, x, z) {
  if (!isl.hills) return 0;
  let h = 0;
  for (const m of isl.hills) {
    const d = Math.hypot(x - (isl.cx + m.dx), z - (isl.cz + m.dz));
    if (d < m.r) h += m.h * smoother(1 - d / m.r);
  }
  return h;
}

// Muestrea la montaña en (x,z): devuelve altura, si esta sobre el camino, y nieve.
// La montaña son TERRAZAS planas (escalones) conectadas por una RAMPA en espiral:
// fuera del camino la altura "cae" al escalon de abajo (acantilado empinado), sobre
// el camino sube en rampa suave. Asi solo se sube por el caminito.
function mountainSample(isl, x, z) {
  const m = isl.mountain;
  const dx = x - isl.cx, dz = z - isl.cz;
  const d = Math.hypot(dx, dz);
  const ang = Math.atan2(dz, dx);
  const rEff = m.radius * (1 + 0.08 * Math.sin(3 * ang + 0.7) + 0.04 * Math.sin(5 * ang));
  if (d >= rEff) return { h: 0, onPath: false, snow: 0 };

  const u = 1 - d / rEff;                                   // 0 base .. 1 cima
  const rampH = u * m.height;
  const terraceH = (Math.floor(u * m.levels) / m.levels) * m.height;

  const spiral = m.turns * u * Math.PI * 2 + (m.phase0 || 0);
  let diff = ang - spiral;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const pathAng = m.pathWidth / Math.max(d, 3);
  const onp = 1 - THREE.MathUtils.clamp(Math.abs(diff) / pathAng, 0, 1);
  const blend = smoother(onp);

  const h = terraceH * (1 - blend) + rampH * blend;
  const snow = THREE.MathUtils.clamp((h - m.height * m.snowFrom) / (m.height * 0.22), 0, 1);
  return { h, onPath: onp > 0.4, snow };
}

// Perfil de la playa (compartido por la malla visual y la colisión, para que
// coincidan): [factor del radio, altura y]. El color va aparte en BEACH_COLORS.
const GRASS_F = 0.80;                 // hasta acá el pasto; de acá al borde, la playa
const BEACH = [
  [GRASS_F, 0.0],
  [0.92, -0.04],
  [1.00, -0.15],
  [1.05, -0.9],
  [1.12, -1.9],
];
const BEACH_COLORS = [0xe9dcb0, 0xdfce98, 0xd0b880, 0xb89f6f, 0x8f7a52];
const BEACH_WALK = 1.08;              // hay piso hasta acá (la orilla); más allá, mar

// Altura de la playa según el factor de radio f (0 en el interior, baja hacia el agua).
function beachDrop(f) {
  if (f <= BEACH[0][0]) return 0;
  for (let i = 0; i < BEACH.length - 1; i++) {
    const [f0, y0] = BEACH[i], [f1, y1] = BEACH[i + 1];
    if (f <= f1) return y0 + (y1 - y0) * ((f - f0) / (f1 - f0));
  }
  return BEACH[BEACH.length - 1][1];
}

function terrainHeight(isl, x, z) {
  const dx = x - isl.cx, dz = z - isl.cz;
  const f = Math.hypot(dx, dz) / islandRadius(isl, Math.atan2(dz, dx));
  const base = isl.mountain ? mountainSample(isl, x, z).h : hillsHeight(isl, x, z);
  return base + beachDrop(f);          // interior = base (montaña/lomas); borde = base + pendiente de playa
}

function bump(x, z) {
  return (Math.sin(x * 0.5) * Math.cos(z * 0.4) + Math.sin(x * 0.17 + z * 0.23)) * 0.05;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.clouds = [];
    this._bridges = [];
    this._platforms = [];
    this._time = 0;

    this._buildSky();
    this._buildLights();
    this._buildSea();
    this._buildIslands();
    this._buildBridges();
    this._buildGrass();
    this._buildFlowers();
    this._buildRocks();
    this._buildPalms();
    this._buildClouds();
    this._place(buildCabin());
    this._place(buildDock());
    this._buildResort();
    this._buildRockyIsland();   // isla 2: árboles, rocas y faro
    this._scatterHome();        // vegetación/rocas extra en Isla Pato (esconden tablones)
    this._buildFishingIsland(); // isla 3: muelle + campamento de pesca de Alejandro
    this._buildParkour();       // isla 3 -> isla 4: puente destruido + parkour sobre el agua
    this._buildBunkerIsland();  // isla 4: puente levadizo + ambiente retro-tech
    this._buildShipwreckIsland(); // isla 5: cala con naufragio + Nemo + el bote
    this._buildPirateShip();
  }

  // Isla 3 (Cala del Pescador): muelle + campamento de pesca. Alejandro (NPC) lo pone
  // el manager de juego (game/FishingIsland). Acá van los props y los juncos.
  _buildFishingIsland() {
    const isl = ISLANDS[2];
    this._place(buildDock(isl.cx, isl.cz + 16, isl.cz + 40, 3.0));   // muelle hacia el mar (+Z)

    // Props del campamento, relativos al centro de la isla (cx, cz) para que se muevan
    // junto con ella. El campamento está al lado de Alejandro (DAD.pos ≈ isl.cx-6, +12).
    const cx = isl.cx, cz = isl.cz;
    const g = new THREE.Group();
    g.add(makeChair(cx - 4, cz + 12, 0x2f6b8f));   // silla al lado de Alejandro
    g.add(makeBucket(cx - 8, cz + 10));
    g.add(makeTackleBox(cx - 2, cz + 15));
    g.add(makeDrinkBottle(cx, cz + 14, 0x3a7d4a));
    g.add(makeTable(cx + 5, cz + 9));
    for (let i = 0; i < 10; i++) {                 // juncos por la orilla norte
      const a = Math.PI / 2 + (Math.random() - 0.5) * 1.7;
      const r = islandRadius(isl, a) * (0.8 + Math.random() * 0.12);
      g.add(makeReeds(cx + Math.cos(a) * r, cz + Math.sin(a) * r));
    }
    this.scene.add(g);

    // Árboles por la isla (despejando el campamento).
    this._scatter(isl, 12, 0.2, 0.75, (x, z) => {
      const tree = makeTree();
      tree.position.set(x, terrainHeight(isl, x, z), z);
      tree.scale.setScalar(0.95 + Math.random() * 0.5);
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(tree);
    }, (x, z) => Math.hypot(x - (cx - 2), z - (cz + 12)) < 9);
  }

  // Isla 3 -> Isla 4: el puente lo destruyó Lulu → se cruza por PARKOUR (largo, dificultad
  // media) sobre el agua: rocas, barriles, plataformas y un naufragio. SIN checkpoints en
  // el medio: si te caés, volvés a la Cala del Pescador y lo rehacés entero.
  _buildParkour() {
    const a = ISLANDS[2];
    const x0 = a.cx + islandRadius(a, 0);          // orilla este de la isla de pesca

    // Muñón del puente destruido (postes rotos en la orilla).
    const dark = new THREE.MeshStandardMaterial({ color: 0x82531f, roughness: 1 });
    for (const [dx, dz, tilt] of [[0.5, 1.4, 0.3], [1.4, -1.2, -0.4], [2.6, 0.6, 0.5]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.7, 8), dark);
      post.position.set(x0 + dx, 0.3, dz); post.rotation.z = tilt; post.castShadow = true;
      this.scene.add(post);
    }

    // Circuito zigzag, alturas variables, que además DERIVA en Z hacia la Isla 4 (que
    // está en cz=-18): arranca en la orilla (z≈0) y va bajando en Z. [tipo, dx, y, z, r?]
    const pieces = [
      ['rock', 3, 1.0, 0, 1.7], ['barrel', 7, 1.6, -1], ['barrel', 11, 1.2, 1],
      ['wood', 15, 2.2, -3], ['rock', 19, 2.8, -1, 1.6], ['barrel', 23, 2.0, -5],
      ['wreck', 28, 2.6, -3], ['wood', 33, 3.0, -7], ['rock', 37, 2.2, -5, 1.6],
      ['barrel', 41, 1.6, -10], ['wood', 45, 2.2, -8], ['barrel', 49, 1.4, -13],
      ['rock', 52, 1.0, -15, 1.8],
    ];
    for (const [type, dx, y, z, r] of pieces) {
      const x = x0 + dx;
      if (type === 'rock') this._place(buildRockPlatform(x, y, z, r));
      else if (type === 'barrel') this._place(buildBarrel(x, y, z));
      else if (type === 'wood') this._place(buildWoodPlatform(x, y, z, 2.2, 2.2, SEA_LEVEL));
      else if (type === 'wreck') this._place(buildWreck(x, y, z));
    }

    // Checkpoints SOLO en tierra (llegadas). El último, en la Cala junto al parkour:
    // si te caés en el parkour, respawneás acá y lo hacés de nuevo entero.
    this.checkpoints = [
      { x: 84, y: 1.2, z: 22 },     // llegada a Cabo Roca (isla grande, en z=22)
      { x: 224, y: 1.2, z: 0 },     // llegada a la Cala del Pescador (corrida al este)
      { x: x0 - 4, y: 1.2, z: 0 },  // borde de la Cala, junto al parkour
    ];
  }

  // Isla 4 "El Búnker": el PUENTE LEVADIZO (trabado arriba) hacia la isla del naufragio,
  // su cabrestante, una plataforma de llegada del otro lado y el ambiente retro-tech
  // (luces cian/magenta + nubes de tormenta). La consola del circuito la arma
  // game/BunkerIsland.js (desde la Story). El puente baja con lowerDrawbridge().
  _buildBunkerIsland() {
    const isl = ISLANDS[3];
    const px = isl.cx + islandRadius(isl, 0) - 2;   // pivote en el borde este
    const len = 16;
    this._dbPivot = { x: px, z: isl.cz };
    this._dbEndX = px + len;
    this._drawbridge = makeDrawbridge(px, isl.cz, len, 3.4);
    this.scene.add(this._drawbridge.group);
    this.scene.add(makeGantry(px, isl.cz, 3.4));
    // Plataforma de llegada del otro lado (futura isla del naufragio).
    this._place(buildRockPlatform(px + len + 1.4, 0.2, isl.cz, 2.8));

    // Ambiente: luces locales cian/magenta + nubes de tormenta bajas sobre la isla.
    const l1 = new THREE.PointLight(0x39f0ff, 1.3, 46, 2);
    l1.position.set(BUNKER.console.x, 5, BUNKER.console.z - 1);
    this.scene.add(l1);
    const l2 = new THREE.PointLight(0xff53c0, 0.7, 32, 2);
    l2.position.set(BUNKER.console.x - 5, 3, BUNKER.console.z + 2);
    this.scene.add(l2);
    for (let i = 0; i < 5; i++) {
      const cloud = makeCloud();
      cloud.position.set(isl.cx + (Math.random() - 0.5) * 42, 33 + Math.random() * 10, isl.cz + (Math.random() - 0.5) * 42);
      cloud.scale.setScalar(1.5);
      cloud.traverse((o) => {
        if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.45); }
      });
      this.scene.add(cloud);   // estáticas (sólo ambientan la tormenta)
    }

    // Objetos de ambiente: selva oscura (árboles/arbustos), rocas, barriles-chatarra,
    // monitores CRT sueltos y faroles que brillan. Lejos de la consola, la botella y el puente.
    const avoid = (x, z) =>
      Math.hypot(x - BUNKER.console.x, z - BUNKER.console.z) <= 10 ||
      Math.hypot(x - BUNKER.bottle.x, z - BUNKER.bottle.z) <= 4 ||
      x >= this._dbPivot.x - 3;
    this._scatter(isl, 16, 0.5, 0.86, (x, z) => {
      const tree = makeTree();
      tree.position.set(x, terrainHeight(isl, x, z), z);
      tree.scale.setScalar(0.9 + Math.random() * 0.5); tree.rotation.y = Math.random() * 7;
      tree.traverse((o) => { if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.68); } });
      this.scene.add(tree);
    }, avoid);
    this._scatter(isl, 12, 0.5, 0.86, (x, z) => this.scene.add(makeBush(x, z)), avoid);
    const rmats = stoneMats([0x565c5c, 0x474d4d, 0x3f4a4a]);   // piedra oscura del Búnker
    this._scatter(isl, 12, 0.5, 0.86, (x, z, i) => {
      this._place(buildRock(x, terrainHeight(isl, x, z) + 0.1, z, 0.6 + Math.random() * 1.2, rmats[i % 3], 0.8));
    }, avoid);
    for (const [dx, dz] of [[-9, 5.5], [-6.5, 7], [8.5, 6]]) {
      this._place(buildBarrel(BUNKER.console.x + dx, 1.0, BUNKER.console.z + dz));
    }
    for (const [dx, dz, ry] of [[-11, 2.5, 0.6], [7.5, 4.5, -0.5]]) {
      const crt = makeCRT();
      crt.position.set(BUNKER.console.x + dx, 0, BUNKER.console.z + dz); crt.rotation.y = ry;
      this.scene.add(crt);
    }
    // Faroles que brillan (poste + esfera emisiva + lucecita) — cálidos y algún cian.
    for (const [dx, dz, col] of [[-8, -6, 0xffb14a], [10, -3, 0x39f0ff], [-13, 6, 0xffb14a]]) {
      const x = BUNKER.console.x + dx, z = BUNKER.console.z + dz;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 }));
      post.position.set(x, 1.1, z); post.castShadow = true; this.scene.add(post);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: col, emissiveIntensity: 2.2 }));
      orb.position.set(x, 2.35, z); this.scene.add(orb);
      const pl = new THREE.PointLight(col, 0.5, 12, 2); pl.position.set(x, 2.35, z); this.scene.add(pl);
    }
  }

  get drawbridgePivot() { return this._dbPivot || null; }
  get drawbridgeEndX() { return this._dbEndX || 0; }
  lowerDrawbridge() { if (this._drawbridge) this._drawbridge.lower(); }

  // Isla 5 "Cala del Naufragio": la isla más grande y rocosa (con montañas). Un puente la une a
  // la plataforma de llegada del Búnker. Acá viven el BARCO ENCALLADO en las rocas (que se repara
  // en estaciones y se bota al agua), la escalera de roca al pico donde se esconde un material, y
  // los elementos de la isla. Nemo, los materiales y las estaciones los maneja
  // game/ShipwreckIsland.js. Expone `naufragio` (posiciones absolutas) + `installShipPart` /
  // `launchShipwreck` / `shipwreckLaunched` para el barco 3D.
  _buildShipwreckIsland() {
    const isl = ISLANDS[4];
    const cx = isl.cx, cz = isl.cz;
    const abs = (dx, dz) => ({ x: cx + dx, z: cz + dz });

    // Puente desde la plataforma de llegada del puente levadizo hasta la orilla oeste.
    const landX = this._dbEndX + 1.4, landZ = this._dbPivot.z;
    const shoreX = cx - islandRadius(isl, Math.PI) + 1.5;
    this._place(buildBridge(landX, landZ, shoreX, cz));

    // Datos absolutos (resueltos desde config NAUFRAGIO + centro de la isla) para el manager.
    const ship = abs(NAUFRAGIO.ship.dx, NAUFRAGIO.ship.dz);
    this._naufragioData = {
      center: { cx, cz },
      arrival: { x: shoreX + 5, z: cz },
      nemo: abs(NAUFRAGIO.nemo.dx, NAUFRAGIO.nemo.dz),
      ship: { x: ship.x, z: ship.z },
      boardRadius: NAUFRAGIO.boardRadius,
      // Materiales (lista plana para spawnear) + estaciones de reparación (posición absoluta).
      materialItems: NAUFRAGIO.materials.flatMap((m) => m.spots.map((s) => ({ kind: m.kind, ...abs(s.dx, s.dz) }))),
      stations: NAUFRAGIO.stations.map((s) => ({ ...s, x: ship.x + s.dx, z: ship.z + s.dz })),
    };

    // El barco encallado en las rocas de la orilla este (carabela; se bota al agua al reparar).
    this._shipwreck = buildShipwreck(ship.x, 0.2, ship.z, NAUFRAGIO.ship.rotY);
    this.scene.add(this._shipwreck.group);
    this.colliders.push(...this._shipwreck.colliders);

    // Escalera de rocas hasta el pico empinado donde se esconde una pieza (parkour). Sube
    // hacia el centro del pico (hill[0]) desde el lado interior de la isla.
    const peak = isl.hills[0];
    const px = cx + peak.dx, pz = cz + peak.dz;
    for (const [dx, dz, y] of [[9, 1, 2.5], [6, -1.5, 4.5], [3.5, 1, 6.5], [1.5, -0.5, 8.5]]) {
      this._place(buildRockPlatform(px + dx, y, pz + dz, 1.7));
    }

    // Elementos de la isla: montañas rocosas, bosque (pinos arriba / árboles abajo), palmeras en
    // la playa y detalles de costa. Despeja Nemo, el barco, los materiales y las estaciones.
    const clearOf = this._naufragioData.materialItems
      .concat([this._naufragioData.nemo, { x: ship.x, z: ship.z }])
      .concat(this._naufragioData.stations);
    const avoid = (x, z) => clearOf.some((p) => Math.hypot(x - p.x, z - p.z) < 4.5);
    const rmats = stoneMats([0x8a8f96, 0x7c8188, 0x6f757b]);

    // Cúmulos de rocas sobre las lomas → picos escarpados (más rocas en picos más altos).
    for (const hill of isl.hills) {
      const hx = cx + hill.dx, hz = cz + hill.dz;
      for (let i = 0; i < 4 + Math.floor(hill.h); i++) {
        const a = Math.random() * Math.PI * 2, rr = Math.random() * hill.r * 0.7;
        const x = hx + Math.cos(a) * rr, z = hz + Math.sin(a) * rr;
        if (avoid(x, z)) continue;
        this._place(buildRock(x, terrainHeight(isl, x, z) + 0.2, z, 0.8 + Math.random() * 2.4, rmats[i % 3], 0.7 + Math.random() * 0.4));
      }
    }
    // Rocas grandes dispersas (montañas-hito) por toda la isla.
    this._scatter(isl, 16, 0.12, 0.9, (x, z, i) => {
      this._place(buildRock(x, terrainHeight(isl, x, z) + 0.15, z, 0.7 + Math.random() * 2.0, rmats[i % 3], 0.8));
    }, avoid);
    // Bosque: pino sin nieve en lo alto/rocoso, árbol frondoso en lo bajo.
    this._scatter(isl, 22, 0.18, 0.82, (x, z) => {
      const y = terrainHeight(isl, x, z);
      const t = y > 3.5 ? makePine({ snow: false }) : makeTree();
      t.position.set(x, y, z); t.rotation.y = Math.random() * 7;
      t.scale.setScalar((y > 3.5 ? 1.1 : 0.9) + Math.random() * 0.6);
      this.scene.add(t);
    }, avoid);
    this._scatter(isl, 16, 0.2, 0.85, (x, z) => this.scene.add(makeBush(x, z)), avoid);
    // Palmeras en el anillo de playa.
    this._scatter(isl, 8, 0.72, 0.9, (x, z) => {
      const palm = makePalm(); palm.position.set(x, terrainHeight(isl, x, z), z); palm.rotation.y = Math.random() * 7;
      this.scene.add(palm);
    }, avoid);
    // Detalles de costa dispersos por la playa (caracoles, estrellas de mar, algas).
    this._scatter(isl, 24, 0.78, 0.98, (x, z, i) => {
      const d = i % 3 === 0 ? makeStarfish() : i % 3 === 1 ? makeShell() : makeSeaweed();
      d.position.set(x, terrainHeight(isl, x, z), z); this.scene.add(d);
    });
    // Escombros junto al barco + un campamento cerca de Nemo (fogón, red, ancla, tronco).
    for (const [dx, dz] of [[NAUFRAGIO.ship.dx - 8, NAUFRAGIO.ship.dz + 6], [NAUFRAGIO.ship.dx - 6, NAUFRAGIO.ship.dz - 7]]) {
      this._place(buildBarrel(cx + dx, 0.9, cz + dz));
    }
    const at = (dx, dz, o) => { o.position.set(cx + dx, terrainHeight(isl, cx + dx, cz + dz), cz + dz); this.scene.add(o); };
    at(NAUFRAGIO.ship.dx - 12, NAUFRAGIO.ship.dz + 3, makeDriftwood());
    at(NAUFRAGIO.ship.dx - 10, NAUFRAGIO.ship.dz - 4, makeAnchor());
    at(NAUFRAGIO.nemo.dx + 5, NAUFRAGIO.nemo.dz + 2, makeCampfire());
    at(NAUFRAGIO.nemo.dx + 2, NAUFRAGIO.nemo.dz - 4, makeFishingNet());

    // Checkpoints: llegada al Búnker (tras el parkour) y a la cala (una caída no te manda atrás).
    if (this.checkpoints) {
      this.checkpoints.push({ x: 340, y: 1.2, z: -16 });
      this.checkpoints.push({ x: shoreX + 5, y: 1.2, z: cz });
    }
  }

  get naufragio() { return this._naufragioData || null; }
  get shipwreckLaunched() { return this._shipwreck ? this._shipwreck.ship.isLaunched() : false; }
  installShipPart(order) { if (this._shipwreck) this._shipwreck.ship.installPart(order); }

  // Bota el barco al agua: calcula un punto en el mar (afuera del centro) y lo lanza.
  launchShipwreck() {
    if (!this._shipwreck) return;
    const c = this._naufragioData.center, s = this._naufragioData.ship;
    const dx = s.x - c.cx, dz = s.z - c.cz, d = Math.hypot(dx, dz) || 1;
    this._shipwreck.ship.launch({
      x: s.x + (dx / d) * NAUFRAGIO.waterOffset,
      y: NAUFRAGIO.waterY,
      z: s.z + (dz / d) * NAUFRAGIO.waterOffset,
    });
  }

  // "El Pato Mareado" lejos en el mar (dirección +Z desde el muelle): la meta.
  _buildPirateShip() {
    this.ship = makePirateShip();
    this.ship.scale.setScalar(1.6);
    this.ship.position.set(40, SEA_LEVEL, 285);
    this.ship.rotation.y = -0.5;   // de perfil/3-4 hacia la isla
    this._shipBaseRot = this.ship.rotation.z;
    this.scene.add(this.ship);
  }

  get seaLevel() { return SEA_LEVEL; }
  get killY() { return KILL_Y; }
  getColliders() { return this.colliders; }

  // Punta del puente roto del lado de Isla Pato (para el checkpoint "llegar al puente").
  get bridgeStart() {
    const b = this._brokenBridge;
    return b ? { x: b.bridge.x1, z: b.bridge.z1 } : null;
  }

  // Agrega un resultado de builder ({ group, colliders, bridge, platform(s) }) a la
  // escena y registra sus colisiones/marcadores de minimapa.
  _place(built) {
    this.scene.add(built.group);
    if (built.colliders) this.colliders.push(...built.colliders);
    if (built.bridge) this._bridges.push(built.bridge);
    if (built.platform) this._platforms.push(built.platform);
    if (built.platforms) this._platforms.push(...built.platforms);
  }

  // Dispersa `count` objetos al azar sobre una isla, entre `rMin`..`rMax` (fracción del
  // radio del contorno). `place(x, z, i)` ubica cada uno; `avoid(x, z)` (opcional) devuelve
  // true donde NO se debe poner (ej. despejar un NPC o el camino). Reutilizable por isla.
  _scatter(isl, count, rMin, rMax, place, avoid) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = (rMin + Math.random() * (rMax - rMin)) * islandRadius(isl, a);
      const x = isl.cx + Math.cos(a) * rr, z = isl.cz + Math.sin(a) * rr;
      if (avoid && avoid(x, z)) continue;
      place(x, z, i);
    }
  }

  groundHeightAt(x, z) {
    for (const isl of ISLANDS) {
      const dx = x - isl.cx, dz = z - isl.cz;
      const a = Math.atan2(dz, dx);
      // Hay piso hasta la orilla (radio * BEACH_WALK), así se puede caminar por la
      // arena que baja al agua sin caerse. Más allá es mar (null).
      if (Math.hypot(dx, dz) <= islandRadius(isl, a) * BEACH_WALK) return terrainHeight(isl, x, z);
    }
    return null;
  }

  getMapData() {
    const islands = ISLANDS.map((isl) => {
      const pts = [];
      for (let i = 0; i < 56; i++) {
        const a = (i / 56) * Math.PI * 2;
        const r = islandRadius(isl, a);
        pts.push([isl.cx + Math.cos(a) * r, isl.cz + Math.sin(a) * r]);
      }
      return { cx: isl.cx, cz: isl.cz, pts, mountain: !!isl.mountain, name: isl.name || null };
    });
    return { islands, bridges: this._bridges, platforms: this._platforms };
  }

  update(dt) {
    this._time += dt;
    if (this.sea) this.sea.position.y = SEA_LEVEL + Math.sin(this._time * 0.6) * 0.08;
    if (this.ship) {
      this.ship.position.y = SEA_LEVEL + Math.sin(this._time * 0.5) * 0.4;
      this.ship.rotation.z = this._shipBaseRot + Math.sin(this._time * 0.4) * 0.02;
    }
    if (this._gate) this._gate.update(dt);
    if (this._drawbridge) {
      this._drawbridge.update(dt);
      if (this._drawbridge.isDown() && !this._dbAdded) {   // ya bajó: ahora es caminable
        this.colliders.push(this._drawbridge.collider);
        this._dbAdded = true;
      }
    }
    if (this._shipwreck) this._shipwreck.ship.update(dt);   // barco: pop de piezas + botadura + cabeceo
    for (const c of this.clouds) {
      c.position.x += dt * c.userData.speed;
      if (c.position.x > 240) c.position.x = -240;
    }
  }

  _buildSky() {
    const canvas = document.createElement('canvas');
    canvas.width = 2; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.0, '#2f83d8');
    g.addColorStop(0.55, '#8ec4ea');
    g.addColorStop(1.0, '#cdeaf3');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = tex;
    this.scene.fog = new THREE.Fog(0xcdeaf3, 120, 500);
  }

  _buildLights() {
    const hemi = new THREE.HemisphereLight(0xbfe6ff, 0xa9b57e, 0.85);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff4e0, 1.5);
    sun.position.set(60, 100, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = 120;
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 320 });
    sun.shadow.bias = -0.0004;
    sun.target.position.set(30, 0, -40);
    this.scene.add(sun);
    this.scene.add(sun.target);
  }

  _buildSea() {
    const geo = new THREE.PlaneGeometry(1400, 1400, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2aa7c4, roughness: 0.2, metalness: 0.35, transparent: true, opacity: 0.9,
    });
    const sea = new THREE.Mesh(geo, mat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = SEA_LEVEL;
    sea.receiveShadow = true;
    this.scene.add(sea);
    this.sea = sea;
  }

  _buildIslands() {
    for (const isl of ISLANDS) this.scene.add(buildIslandMesh(isl));
  }

  _buildBridges() {
    const [A, B, C] = ISLANDS;   // Isla Pato, Cabo Roca, Cala del Pescador
    // Puente ROTO de Isla Pato -> Cabo Roca (diagonal, las islas no están alineadas).
    // Se repara juntando tablones.
    const b = buildBrokenBridge(
      A.cx + islandRadius(A, 0) - 2, A.cz,
      B.cx - islandRadius(B, Math.PI) + 2, B.cz,
    );
    this._brokenBridge = b;
    this.scene.add(b.group);
    this._bridges.push(b.bridge);        // marcador de minimapa
    this.colliders.push(...b.colliders); // tramos intactos sólidos (no se atraviesa)
    // El hueco del medio recién obtiene colisión al reparar (ver repairBridge()).

    // Puente Cabo Roca -> Cala del Pescador (diagonal, caminable). La REJA lo bloquea
    // hasta abrirla; se pone en el borde de Cabo Roca (arranque del puente).
    const gx1 = B.cx + islandRadius(B, 0) - 2;
    const gx2 = C.cx - islandRadius(C, Math.PI) + 2;
    this._place(buildBridge(gx1, B.cz, gx2, C.cz));
    this._gate = buildGate(gx1 - 0.5, B.cz);
    this.scene.add(this._gate.group);
    this.colliders.push(this._gate.gateCollider, ...this._gate.wallColliders);
  }

  get gatePos() { return this._gate ? this._gate.pos : null; }

  // Abre la reja: sube los barrotes y saca la colisión del hueco (los muros quedan).
  openGate() {
    if (!this._gate || this._gate._opened) return;
    this._gate.open();
    const i = this.colliders.indexOf(this._gate.gateCollider);
    if (i >= 0) this.colliders.splice(i, 1);
    this._gate._opened = true;
  }

  // Repara el puente: muestra los tablones faltantes y completa la colisión del hueco.
  repairBridge() {
    if (!this._brokenBridge || this._brokenBridge._repaired) return;
    this._brokenBridge.repair();
    this.colliders.push(...this._brokenBridge.gapColliders);
    this._brokenBridge._repaired = true;
  }

  _buildGrass() {
    const blade = new THREE.PlaneGeometry(0.05, 0.3, 1, 3);
    const p = blade.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) + 0.15) / 0.3;
      p.setX(i, p.getX(i) * (1 - t * 0.85));
    }
    blade.translate(0, 0.15, 0);
    blade.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, side: THREE.DoubleSide });
    const N = 4600;
    const mesh = new THREE.InstancedMesh(blade, mat, N);
    const dummy = new THREE.Object3D();
    const cA = new THREE.Color(0x5f9e46), cB = new THREE.Color(0x84c25c), tmp = new THREE.Color();

    let n = 0;
    const tufts = Math.floor(N / 5);
    for (let tf = 0; tf < tufts && n < N; tf++) {
      const isl = ISLANDS[Math.floor(Math.random() * ISLANDS.length)];
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * (islandRadius(isl, a) - 3);
      const bx = isl.cx + Math.cos(a) * rr;
      const bz = isl.cz + Math.sin(a) * rr;
      if (isl.mountain && terrainHeight(isl, bx, bz) > isl.mountain.height * isl.mountain.snowFrom) continue;
      for (let k = 0; k < 5 && n < N; k++) {
        const gx = bx + (Math.random() - 0.5) * 0.5;
        const gz = bz + (Math.random() - 0.5) * 0.5;
        dummy.position.set(gx, terrainHeight(isl, gx, gz), gz);
        dummy.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
        const sc = 0.7 + Math.random() * 0.8;
        dummy.scale.set(sc, sc * (0.8 + Math.random() * 0.7), sc);
        dummy.updateMatrix();
        mesh.setMatrixAt(n, dummy.matrix);
        mesh.setColorAt(n, tmp.copy(cA).lerp(cB, Math.random()));
        n++;
      }
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.scene.add(mesh);
  }

  _buildFlowers() {
    const petalColors = [0xff9ec2, 0xffe98a, 0xffffff, 0xc79bff];
    for (let i = 0; i < 70; i++) {
      const isl = ISLANDS[Math.floor(Math.random() * ISLANDS.length)];
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * (islandRadius(isl, a) - 4);
      const x = isl.cx + Math.cos(a) * rr;
      const z = isl.cz + Math.sin(a) * rr;
      const h = terrainHeight(isl, x, z);
      if (isl.mountain && h > isl.mountain.height * isl.mountain.snowFrom) continue;
      const flower = new THREE.Group();
      const petalMat = new THREE.MeshStandardMaterial({ color: petalColors[i % petalColors.length], roughness: 0.9 });
      for (let k = 0; k < 5; k++) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), petalMat);
        const pa = (k / 5) * Math.PI * 2;
        petal.position.set(Math.cos(pa) * 0.05, 0.18, Math.sin(pa) * 0.05);
        flower.add(petal);
      }
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5),
        new THREE.MeshStandardMaterial({ color: 0xffd94a, roughness: 0.9 }));
      center.position.y = 0.19;
      flower.add(center);
      flower.position.set(x, h, z);
      this.scene.add(flower);
    }
  }

  _buildRocks() {
    const mats = stoneMats();
    for (const isl of ISLANDS) {
      const isHome = isl === ISLANDS[0];
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        // En la isla del inicio, dejar libre el corredor del muelle (hacia +Z ≈ π/2).
        if (isHome && Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.5) continue;
        const rr = islandRadius(isl, a) * (0.82 + Math.random() * 0.14);
        const x = isl.cx + Math.cos(a) * rr, z = isl.cz + Math.sin(a) * rr;
        const size = 0.5 + Math.random() * 1.0;
        this._place(buildRock(x, terrainHeight(isl, x, z), z, size, mats[i % 3], 0.7));
      }
    }
  }

  _buildPalms() {
    const spots = [
      [0, 0.4, 0.6], [0, 1.4, 0.72], [0, 2.5, 0.5], [0, 3.5, 0.7], [0, 4.6, 0.6], [0, 5.6, 0.75],
      [1, 0.8, 0.6], [1, 2.2, 0.7], [1, 3.9, 0.62], [1, 5.2, 0.66],
    ];
    for (const [i, a, rf] of spots) {
      const isl = ISLANDS[i];
      const r = islandRadius(isl, a) * rf;
      const palm = makePalm();
      palm.position.set(isl.cx + Math.cos(a) * r, 0, isl.cz + Math.sin(a) * r);
      palm.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(palm);
    }
  }

  // Isla 2 (Cabo Roca): faro + árboles + muchas rocas (estética rocosa).
  _buildRockyIsland() {
    const isl = ISLANDS[1];
    const lh = makeLighthouse();
    lh.position.set(isl.cx, terrainHeight(isl, isl.cx, isl.cz), isl.cz);
    this.scene.add(lh);

    // Zona a despejar alrededor del loro Juancho (que no lo tapen los árboles/rocas), con
    // mucha vegetación alrededor para que cueste encontrarlo en la isla grande.
    const nearParrot = (x, z) => Math.hypot(x - QUIZ.parrotPos.x, z - QUIZ.parrotPos.z) <= 6;

    this._scatter(isl, 32, 0.18, 0.88, (x, z) => {
      const tree = makeTree();
      tree.position.set(x, terrainHeight(isl, x, z), z);
      tree.scale.setScalar(0.95 + Math.random() * 0.55);
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(tree);
    }, nearParrot);

    const rockMats = stoneMats([0x8a8f96, 0x7c8188, 0x6f757b]);
    this._scatter(isl, 38, 0.1, 0.85, (x, z, i) => {
      const size = 0.6 + Math.random() * 1.6;
      this._place(buildRock(x, terrainHeight(isl, x, z) + 0.1, z, size, rockMats[i % 3], 0.8 + Math.random() * 0.4));
    }, nearParrot);
  }

  // Vegetación y rocas extra en Isla Pato (esconden los tablones del nivel 1).
  _scatterHome() {
    const isl = ISLANDS[0];
    const g = new THREE.Group();
    this._scatter(isl, 18, 0.2, 0.85, (x, z) => g.add(makeBush(x, z)));
    const rockMats = stoneMats();
    // Grupitos de rocas (con colisión) cerca de donde están escondidos los tablones.
    const spots = [[3, -13], [-17, 7], [15, 8], [-11, 14], [19, -8], [-8, -14], [12, -3]];
    for (const [x, z] of spots) {
      for (let k = 0; k < 3; k++) {
        const size = 0.5 + Math.random() * 0.9;
        this._place(buildRock(x + (Math.random() - 0.5) * 2.4, 0.1, z + (Math.random() - 0.5) * 2.4, size, rockMats[k % 3], 0.7));
      }
    }
    for (const [x, z] of [[-20, -8], [20, 4], [-14, -15], [16, 14]]) {
      const palm = makePalm();
      palm.position.set(x, 0, z);
      palm.rotation.y = Math.random() * Math.PI * 2;
      g.add(palm);
    }
    this.scene.add(g);
  }

  _buildClouds() {
    for (let i = 0; i < 18; i++) {
      const cloud = makeCloud();
      cloud.position.set((Math.random() - 0.5) * 480, 48 + Math.random() * 45, (Math.random() - 0.5) * 480);
      cloud.userData.speed = 1.5 + Math.random() * 2.5;
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }
  }

  // Zona de vacaciones frente a la cabaña: sombrilla, reposeras, pelota, mesa,
  // parrilla, plantitas y palmeras. Todo decorativo (sin colisión).
  _buildResort() {
    const g = new THREE.Group();
    g.add(makeUmbrella(-5.5, 4));
    g.add(makeLounger(-6.6, 4, 0x2f7fd8));
    g.add(makeLounger(-4.4, 4, 0xe0554e));
    g.add(makeBeachBall(2, 10));
    g.add(makeTable(6, -1));
    g.add(makeGrill(8, -3.5));
    g.add(makeUmbrella(6.5, 5));
    for (const [x, z] of [[-10, -6], [10, -5], [-9, 2], [9, 2], [-6, -2.5], [6, -2.5], [11, 5]]) {
      g.add(makeBush(x, z));
    }
    for (const [x, z] of [[-11, 6], [11, 7], [-11, -2], [12, -4], [4, 14], [-5, 13]]) {
      const palm = makePalm();
      palm.position.set(x, 0, z);
      palm.rotation.y = Math.random() * Math.PI * 2;
      g.add(palm);
    }
    this.scene.add(g);
  }
}

// ---- Geometria de las islas (superficie con altura, nieve y caminito) ----

function buildIslandMesh(isl) {
  const group = new THREE.Group();
  const ANG = 128;
  const RINGS = (isl.mountain || isl.hills) ? 44 : 10;
  const grassF = GRASS_F;   // hasta acá el pasto; de acá al borde, la playa
  const skirtY = -6;

  const green = new THREE.Color(0x74b350);
  const dirt = new THREE.Color(0x9c7a4a);
  const snow = new THREE.Color(0xf4f7fb);

  const vertAt = (tR, ang) => {
    const rEdge = islandRadius(isl, ang) * grassF;
    const r = tR * rEdge;
    const x = isl.cx + Math.cos(ang) * r;
    const z = isl.cz + Math.sin(ang) * r;
    let h, col;
    if (isl.mountain) {
      const s = mountainSample(isl, x, z);
      h = s.h;
      if (s.onPath && s.snow < 0.5) {
        col = dirt.clone();
      } else if (s.snow > 0) {
        col = green.clone().lerp(snow, s.snow);
      } else {
        col = green.clone().multiplyScalar(0.9 + Math.random() * 0.14);
      }
    } else if (isl.rocky) {
      h = hillsHeight(isl, x, z);   // 0 si la isla rocosa no tiene lomas (ej. Cabo Roca)
      const rock = new THREE.Color(0x929892), moss = new THREE.Color(0x5c7d48), bare = new THREE.Color(0xb7bcb7);
      const m = Math.sin(x * 0.6) * Math.cos(z * 0.5) * 0.5 + 0.5;   // 0..1 manchones
      col = rock.clone().lerp(moss, m * 0.55);
      if (isl.hills) col.lerp(bare, THREE.MathUtils.clamp(h / 11, 0, 1) * 0.65);   // picos más pelados/claros
      col.multiplyScalar(0.85 + Math.random() * 0.18);
    } else if (isl.bunker) {
      h = 0;   // piedra húmeda oscura + musgo (ruina tech al atardecer)
      const stone = new THREE.Color(0x3f4a4a), moss = new THREE.Color(0x2f5540);
      const m = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 + 0.5;
      col = stone.clone().lerp(moss, m * 0.5).multiplyScalar(0.7 + Math.random() * 0.16);
    } else {
      h = 0;
      const v = 0.82 + (Math.sin(x * 1.3) * Math.cos(z * 1.1) * 0.5 + 0.5) * 0.32;
      col = green.clone().multiplyScalar(v);
    }
    const y = h + 0.02 + bump(x, z) * (h > 0.5 ? 0.2 : 1);
    return { x, y, z, col };
  };

  const top = [], topCol = [];
  const pushV = (v) => { top.push(v.x, v.y, v.z); topCol.push(v.col.r, v.col.g, v.col.b); };

  for (let j = 0; j < ANG; j++) {
    const a1 = (j / ANG) * Math.PI * 2;
    const a2 = ((j + 1) / ANG) * Math.PI * 2;
    for (let i = 0; i < RINGS; i++) {
      const t1 = i / RINGS, t2 = (i + 1) / RINGS;
      const v00 = vertAt(t1, a1), v01 = vertAt(t1, a2);
      const v10 = vertAt(t2, a1), v11 = vertAt(t2, a2);
      pushV(v00); pushV(v10); pushV(v11);
      pushV(v00); pushV(v11); pushV(v01);
    }
  }

  // ---- Playa realista ----
  // Bandas concéntricas de arena que bajan al agua con vertex-colors (seca clara ->
  // húmeda oscura -> sumergida), una línea de espuma en la orilla, y una falda
  // submarina como base sólida. Los factores son múltiplos del radio de la isla.
  // Anillos de la playa: [factor de R, altura y, color] — mismo perfil que la
  // colisión (BEACH) para que la arena visible y el piso coincidan.
  const rings = BEACH.map(([f, y], i) => [f, y, new THREE.Color(BEACH_COLORS[i])]);

  const beach = [], beachCol = [], foam = [], skirt = [];
  const P = (r, ang) => [isl.cx + Math.cos(ang) * r, isl.cz + Math.sin(ang) * r];
  for (let j = 0; j < ANG; j++) {
    const a1 = (j / ANG) * Math.PI * 2;
    const a2 = ((j + 1) / ANG) * Math.PI * 2;
    const r1 = islandRadius(isl, a1), r2 = islandRadius(isl, a2);

    // Bandas de arena (dos triángulos por anillo, con color por vértice).
    for (let k = 0; k < rings.length - 1; k++) {
      const [f0, y0, c0] = rings[k];
      const [f1, y1, c1] = rings[k + 1];
      const [ax, az] = P(r1 * f0, a1), [aax, aaz] = P(r2 * f0, a2);
      const [bx, bz] = P(r1 * f1, a1), [bbx, bbz] = P(r2 * f1, a2);
      beach.push(ax, y0, az, bx, y1, bz, bbx, y1, bbz);
      beachCol.push(c0.r, c0.g, c0.b, c1.r, c1.g, c1.b, c1.r, c1.g, c1.b);
      beach.push(ax, y0, az, bbx, y1, bbz, aax, y0, aaz);
      beachCol.push(c0.r, c0.g, c0.b, c1.r, c1.g, c1.b, c0.r, c0.g, c0.b);
    }

    // Línea de espuma que cruza el nivel del agua (~y=-1.4).
    const [fa0x, fa0z] = P(r1 * 1.06, a1), [fa1x, fa1z] = P(r2 * 1.06, a2);
    const [fb0x, fb0z] = P(r1 * 1.10, a1), [fb1x, fb1z] = P(r2 * 1.10, a2);
    foam.push(fa0x, -1.0, fa0z, fb0x, -1.57, fb0z, fb1x, -1.57, fb1z);
    foam.push(fa0x, -1.0, fa0z, fb1x, -1.57, fb1z, fa1x, -1.0, fa1z);

    // Falda submarina (base sólida hacia el fondo).
    const [s0x, s0z] = P(r1 * 1.12, a1), [s1x, s1z] = P(r2 * 1.12, a2);
    const [d0x, d0z] = P(r1 * 1.02, a1), [d1x, d1z] = P(r2 * 1.02, a2);
    skirt.push(s0x, -1.9, s0z, d0x, skirtY, d0z, d1x, skirtY, d1z);
    skirt.push(s0x, -1.9, s0z, d1x, skirtY, d1z, s1x, -1.9, s1z);
  }

  group.add(meshFrom(top, 0xffffff, { colors: topCol }));
  group.add(meshFrom(beach, 0xffffff, { colors: beachCol }));
  group.add(meshFrom(skirt, 0x8a744e, { flat: true }));
  group.add(meshFrom(foam, 0xeef6f2, { flat: true, transparent: true, opacity: 0.55 }));
  group.children.forEach((m) => { m.receiveShadow = true; });
  return group;
}
