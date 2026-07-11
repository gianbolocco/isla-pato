import * as THREE from 'three';

// Props de la isla "El Búnker" (retro-tech en la selva): lámparas de señal, palancas
// de entrada, módulos de compuerta lógica, cables que brillan, el puente levadizo y
// ambiente (tablero, carteles de neón, monitores CRT). La lógica del puzzle vive en
// game/BunkerIsland.js; acá sólo se modela y se expone `set(on)` donde hace falta.

const ON = 0x39f0ff, OFF = 0x7a2222;

// Textura de etiqueta (símbolo de compuerta / nombre de palanca) con canvas.
function labelTexture(text, { color = '#39f0ff', bg = '#0b1418', size = 64 } = {}) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 256, 128);
  x.fillStyle = color; x.font = `bold ${size}px "Courier New", monospace`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Estilo por tipo de compuerta (color de texto/borde) para distinguirlas de un vistazo.
const GATE_STYLE = {
  AND: { fg: '#7dffb0', bg: '#0c3320' },
  OR: { fg: '#8ac6ff', bg: '#0c2742' },
  NOT: { fg: '#ff9e78', bg: '#3e1608' },
  XOR: { fg: '#e2a4ff', bg: '#2f0e40' },
  NAND: { fg: '#7dffb0', bg: '#0c3320' },
  NOR: { fg: '#8ac6ff', bg: '#0c2742' },
  XNOR: { fg: '#e2a4ff', bg: '#2f0e40' },
};

// Cartel grande y claro con el nombre de la compuerta (color + borde según el tipo).
function gateLabelTexture(op) {
  const s = GATE_STYLE[op] || { fg: '#ffffff', bg: '#141414' };
  const c = document.createElement('canvas');
  c.width = 256; c.height = 150;
  const x = c.getContext('2d');
  x.fillStyle = s.bg; x.fillRect(0, 0, 256, 150);
  x.strokeStyle = s.fg; x.lineWidth = 12; x.strokeRect(6, 6, 244, 138);
  x.fillStyle = s.fg;
  x.font = `bold ${op.length >= 4 ? 70 : 96}px "Arial Black", Arial, sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(op, 128, 80);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Textura de veta de madera (rayas verticales) para palancas y marcos.
function woodTexture(base = '#8a5a2b', dark = '#6b4420') {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 64, 64);
  x.strokeStyle = dark; x.globalAlpha = 0.5;
  for (let i = 0; i < 10; i++) {
    x.lineWidth = 0.5 + Math.random() * 1.5;
    x.beginPath();
    const px = Math.random() * 64;
    x.moveTo(px, 0);
    x.bezierCurveTo(px + 4, 20, px - 4, 44, px + 2, 64);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function woodMat(base, dark) {
  return new THREE.MeshStandardMaterial({ map: woodTexture(base, dark), roughness: 0.8 });
}

// Textura de ladrillos de piedra (hiladas con traba) para la base de la consola.
function brickTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#3a3d40'; x.fillRect(0, 0, 128, 128);   // mortero
  const bw = 32, bh = 16;
  for (let row = 0; row < 8; row++) {
    const off = (row % 2) * (bw / 2);
    for (let col = -1; col < 5; col++) {
      const g = 120 + Math.floor(Math.random() * 40);
      x.fillStyle = `rgb(${g - 20},${g - 14},${g - 18})`;
      x.fillRect(col * bw + off + 1.5, row * bh + 1.5, bw - 3, bh - 3);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Base/pedestal de LADRILLOS DE PIEDRA sobre la que se apoya la consola.
export function makeStoneBase(w, d, h) {
  const tex = brickTexture();
  tex.repeat.set(Math.max(2, w / 3), Math.max(1, h));
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  box.position.y = h / 2;
  box.castShadow = true; box.receiveShadow = true;
  return box;
}

// Lámpara de señal: esfera emisiva que cambia cian (1) / rojo tenue (0). set(on).
export function makeLamp(radius = 0.14) {
  const mat = new THREE.MeshStandardMaterial({ color: OFF, emissive: 0x3a0a0a, emissiveIntensity: 0.6, roughness: 0.4 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), mat);
  const set = (on) => {
    mat.color.set(on ? ON : OFF);
    mat.emissive.set(on ? ON : 0x3a0a0a);
    mat.emissiveIntensity = on ? 2.4 : 0.6;
  };
  return { mesh, set, mat };
}

// Cable/canal que lleva la señal entre dos puntos; brilla cian cuando pasa corriente.
export function makeCable(a, b) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x203a3a, emissive: 0x0a1414, emissiveIntensity: 0.4, roughness: 0.5 });
  const av = new THREE.Vector3(a[0], a[1], a[2]);
  const bv = new THREE.Vector3(b[0], b[1], b[2]);
  const dir = new THREE.Vector3().subVectors(bv, av);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, dir.length(), 6), mat);
  mesh.position.copy(av).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const set = (on) => {
    mat.color.set(on ? ON : 0x203a3a);
    mat.emissive.set(on ? 0x0f4a50 : 0x0a1414);
    mat.emissiveIntensity = on ? 1.8 : 0.4;
  };
  return { mesh, set };
}

// Palanca de entrada (0/1): base metálica, manija que se inclina y una lámpara + rótulo.
// set(on) inclina la manija y prende la lámpara. `lamp` para leer el estado.
export function makeLever(label) {
  const g = new THREE.Group();
  const wood = woodMat('#9a6a34', '#6e4620');
  const woodDark = woodMat('#7a4d24', '#5a3618');
  const stone = new THREE.MeshStandardMaterial({ map: brickTexture(), roughness: 1 });

  // Base de piedra + caja de madera.
  const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), stone);
  stoneBase.position.y = 0.2; g.add(stoneBase);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.62), woodDark);
  box.position.y = 0.58; g.add(box);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.9, 8), wood);
  post.position.y = 1.05; g.add(post);

  const pivot = new THREE.Group();
  pivot.position.y = 1.15; g.add(pivot);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.7, 8), wood);
  handle.position.y = 0.3; pivot.add(handle);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xc23b30, roughness: 0.5 }));
  knob.position.y = 0.66; pivot.add(knob);

  const lamp = makeLamp(0.1);
  lamp.mesh.position.set(0, 1.75, 0.24); g.add(lamp.mesh);

  // Rótulo (A..F) mirando al oeste (por donde llega Belu).
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32),
    new THREE.MeshBasicMaterial({ map: labelTexture(label, { size: 90, bg: '#2a1a0c' }), side: THREE.DoubleSide }));
  plate.position.set(-0.42, 0.58, 0); plate.rotation.y = -Math.PI / 2; g.add(plate);

  const set = (on) => { pivot.rotation.z = on ? -0.6 : 0.6; lamp.set(on); };
  set(false);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, set, lamp };
}

// Módulo de compuerta lógica: marco de MADERA + placa con el símbolo (AND/OR/NOT/XOR)
// y su lámpara de salida.
export function makeGateTile(op) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.2, 0.22), woodMat('#7a4d24', '#5a3618'));
  g.add(frame);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 0.9),
    new THREE.MeshBasicMaterial({ map: gateLabelTexture(op) }));
  plate.position.z = 0.12; g.add(plate);
  const lamp = makeLamp(0.12);
  lamp.mesh.position.set(0.72, 0.46, 0.14); g.add(lamp.mesh);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, lamp };
}

// Tablero de fondo: panel oscuro con BORDE DE MADERA (donde se montan las compuertas).
export function makeBoard(w, h) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.9, h + 0.9, 0.28), woodMat('#8a5a2b', '#6b4420'));
  g.add(frame);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x14181b, roughness: 0.75, metalness: 0.15 }));
  screen.position.z = 0.06; g.add(screen);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// Monitor CRT retro con pantalla verde que brilla (ambiente).
export function makeCRT() {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xb8b09a, roughness: 0.8 }));
  shell.position.y = 0.4; g.add(shell);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5),
    new THREE.MeshBasicMaterial({ map: labelTexture('0110', { color: '#6bff8a', bg: '#04140a', size: 60 }) }));
  screen.position.set(0, 0.42, 0.36); g.add(screen);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Puente LEVADIZO: pivotea en el borde de la isla (origen del grupo) y el extremo se
// levanta. Arranca arriba (trabado); lower() lo baja. update(dt) anima; isDown() avisa
// cuando quedó plano (para que el World agregue el collider). El deck va hacia +X.
export function makeDrawbridge(x, z, len, width) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const light = new THREE.MeshStandardMaterial({ color: 0x9a7b46, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x5f4423, roughness: 1 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.5, metalness: 0.5 });

  const step = 0.55, n = Math.floor(len / step);
  for (let i = 0; i <= n; i++) {
    const px = 0.3 + i * step;
    if (px > len) break;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, width), i % 2 ? light : dark);
    plank.position.set(px, -0.06, 0);
    plank.castShadow = true; plank.receiveShadow = true;
    group.add(plank);
  }
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.14, 0.14), dark);
    rail.position.set(len / 2, 0.4, s * (width / 2 - 0.1)); group.add(rail);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 5), metal);
    chain.position.set(len - 0.2, 0.9, s * (width / 2 - 0.1)); chain.rotation.z = 0.5; group.add(chain);
  }
  const endBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, width), metal);
  endBar.position.set(len - 0.1, 0.1, 0); group.add(endBar);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  const RAISED = 1.18;
  group.rotation.z = RAISED;
  const collider = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(x + len / 2, -0.1, z), new THREE.Vector3(len, 0.3, width));

  const st = { a: RAISED, target: RAISED };
  return {
    group, collider,
    lower() { st.target = 0; },
    update(dt) {
      if (Math.abs(st.a - st.target) < 0.0005) return;
      st.a += (st.target - st.a) * Math.min(1, dt * 1.3);
      group.rotation.z = st.a;
    },
    isDown() { return st.a < 0.03; },
  };
}

// Torre/cabrestante en el pivote del puente (decorativo).
export function makeGantry(x, z, width) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const metal = new THREE.MeshStandardMaterial({ color: 0x54585e, roughness: 0.6, metalness: 0.4 });
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.4, 8), metal);
    leg.position.set(-0.4, 1.7, s * (width / 2 + 0.1)); leg.rotation.z = 0.12; g.add(leg);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, width + 0.6), metal);
  beam.position.set(-0.6, 3.3, 0); g.add(beam);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, width * 0.7, 12), metal);
  drum.rotation.x = Math.PI / 2; drum.position.set(-0.6, 3.0, 0); g.add(drum);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
