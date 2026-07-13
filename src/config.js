// Constantes ajustables del juego. Tunear el "feel" del parkour desde acá.
// Unidades: 1 ≈ 1 metro, tiempo en segundos.
//
// Los TEXTOS del juego (diálogos, intro, botellas) NO viven acá: están en `textos.js`
// para editarlos fácil. Acá abajo solo se enganchan a las constantes de gameplay.
import { TEXTOS } from './textos.js';

// 🛠️ Panel de desarrollo (temporal): teletransporta por las islas para testear sin
// jugar todo. Poné en false (o borralo con ui/DevPanel.js + main.js) antes de publicar.
export const DEBUG = true;

export const PHYSICS = {
  gravity: -34,          // aceleración hacia abajo
  maxFallSpeed: -40,     // velocidad terminal de caída
};

export const MOVE = {
  walkSpeed: 6,
  runSpeed: 10,
  acceleration: 60,      // qué tan rápido alcanza la velocidad objetivo en el suelo
  airAcceleration: 25,   // control en el aire (menor = más "compromiso" al saltar)
  groundFriction: 12,    // frenado al soltar teclas en el suelo
  turnSpeed: 14,         // qué tan rápido gira el modelo hacia su dirección
  stepHeight: 0.45,      // escalón que se puede subir automáticamente (rocas, bordes)
  maxClimb: 0.9,         // pendiente máxima trepable (~tan del ángulo); más = terreno más empinado bloquea
};

export const JUMP = {
  velocity: 13,          // impulso inicial del salto (altura ≈ v²/(2·g))
  coyoteTime: 0.12,      // margen para saltar tras dejar el borde
  bufferTime: 0.12,      // margen para "recordar" que apretaste saltar antes de tocar suelo
  doubleJump: true,      // permitir un segundo salto en el aire
  doubleJumpVelocity: 11,
  cutMultiplier: 0.45,   // al soltar espacio, se corta el salto (salto variable)
};

// Render "bonito": tone mapping suave, bloom (brillo soñado en los highlights) y
// toon shading en los personajes (look de dibujo/cuento). Tunear el mood acá.
export const RENDER = {
  exposure: 1.12,          // exposición del tone mapping (más = más luminoso)
  bloom: true,
  bloomStrength: 0.5,      // intensidad del brillo
  bloomRadius: 0.6,        // qué tanto se derrama
  bloomThreshold: 0.82,    // sólo brilla lo más claro (highlights, cielo)
  toonCharacters: true,    // sombreado tipo dibujo en Belu y Gianlucca
  toonSteps: 4,            // escalones de luz del toon (menos = más "plano")
};

// Nivel 1: tablones escondidos en Isla Pato para reparar el puente a la 2ª isla.
// Posiciones (x,z) repartidas y escondidas entre rocas/vegetación.
export const PLANKS = [
  { x: 3, z: -14 },    // detrás de la cabaña
  { x: -18, z: 8 },    // orilla oeste, entre rocas
  { x: 15, z: 7 },     // este, entre palmeras
  { x: -11, z: 13 },   // hacia la playa
  { x: 19, z: -9 },    // este, entre arbustos
];
export const PLANK_PICKUP_RADIUS = 2.2;

// Nivel 2 (Cabo Roca): el loro Juancho sabe la clave de la reja. Hace 3 preguntas
// sobre Gian antes de darla. PLACEHOLDERS obvios — editá q/options/correct y `code`.
// Gameplay del loro Juancho (Cabo Roca). Los textos/preguntas están en textos.js → juancho.
export const QUIZ = {
  code: '1234',                 // 🔢 CLAVE (número). Cambiala por una con significado.
  parrotPos: { x: 130, z: 46 }, // rincón NORTE escondido de Cabo Roca (isla grande, cz=22)
  talkRadius: 3.2,
  gateRadius: 4.5,
};

// Nivel 3 (Isla de pesca): Alejandro, el papá de Belu. Le dice "pitu". El Capitán Lulu
// le destrozó el puente → hay que cruzar por parkour. Editá las líneas a gusto.
// Gameplay de Alejandro (Cala del Pescador). Nombre y líneas están en textos.js → alejandro.
export const DAD = {
  name: TEXTOS.alejandro.nombre,
  lines: TEXTOS.alejandro.lineas,
  pos: { x: 234, z: 12 },   // Cala del Pescador (isla corrida al este, cx=240)
  talkRadius: 3.6,
};

// Props decorativos (.glb gratis, ej. Poly Pizza / Kenney / Quaternius) que se
// apoyan sobre el suelo. Archivos en public/models/props/. Se llenan a medida que
// bajemos assets. Ejemplo:
//   { model: '/models/props/heart.glb', x: 3, z: 5, scale: 0.6, y: 0, rotY: 0 }
export const PROPS = [];

export const CAMERA = {
  distance: 6.5,
  height: 1.6,           // a qué altura del personaje mira
  minPitch: -0.6,        // límites verticales (radianes)
  maxPitch: 1.2,
  sensitivity: 0.0025,
  invertY: true,   // true = tirar el mouse hacia abajo mira hacia abajo
  fov: 60,
};

// Tamaño del collider de Belu (caja). Aproxima su silueta chibi.
export const PLAYER = {
  width: 0.7,
  height: 1.7,
  depth: 0.7,
  spawn: { x: 0, y: 2, z: -8 },   // ADENTRO de la cabaña (despierta de la siesta)
};

// Intro: "Belu al Rescate". Belu despierta sola en la cabaña, sale, y encuentra
// una botella con el mensaje de Gian en el muelle. Ver GAME_DESIGN.md.
export const INTRO = {
  bottle: { x: 0, z: 40, y: 0.1 },  // sobre el muelle (a ras), cerca de la punta
  readRadius: 3.4,                // a esta distancia aparece el mensaje
  title: TEXTOS.botellaIntro.titulo,
  message: TEXTOS.botellaIntro.mensaje,
};

// Isla 4 "El Búnker" (Bahía Binaria): ruina retro-tech en la selva. El Capitán Lulu
// trabó el PUENTE LEVADIZO con una cerradura de COMPUERTAS LÓGICAS. Belu (ingeniera en
// informática) mueve palancas de entrada (0/1); las compuertas AND/OR/NOT combinan las
// señales; cuando la SALIDA se enciende en cian, el puente baja. Ver game/BunkerIsland.js.
export const BUNKER = {
  // Botella con el mensaje de Gian, ADENTRO de la isla (el paso del parkour se completa
  // en x>332; si la botella está antes, Belu ya pasó cuando el mensaje se activa).
  bottle: { x: 342, z: -16, y: 0.2 },
  readRadius: 4.2,
  bottleTitle: TEXTOS.botellaBunker.titulo,
  bottleMessage: TEXTOS.botellaBunker.mensaje,
  // Consola del circuito (cerca del centro-este de la isla, ISLANDS[3] = (350,-18)).
  console: { x: 356, z: -18 },
  board: { w: 15.5, h: 8.5, y: 4.4 },
  // Colores de señal (cian = 1 energizado; rojo tenue = 0).
  colors: { on: 0x39f0ff, off: 0x7a2222 },
  // Entradas (palancas): id + offset X respecto de la consola (fila al frente).
  inputs: [
    { id: 'A', dx: -6.0 }, { id: 'B', dx: -4.3 }, { id: 'C', dx: -2.6 }, { id: 'D', dx: -0.9 },
    { id: 'E', dx: 0.9 }, { id: 'F', dx: 2.6 }, { id: 'G', dx: 4.3 }, { id: 'H', dx: 6.0 },
  ],
  // Circuito (data-driven): op + entradas + posición en el tablero (dx respecto consola, y).
  // Ops soportadas: AND OR NOT XOR NAND NOR XNOR. Se evalúan en orden (ver _evaluate).
  //
  //   Restricciones: (A XOR B)·(E OR F)·(NOT F)·(G XOR H)·(A AND C)·(D AND G) todas en 1,
  //   combinadas por un árbol de AND hasta la SALIDA.
  //   Única solución (verificada por enumeración): A1 B0 C1 D1 E1 F0 G1 H0.
  gates: [
    { id: 'g1', op: 'XOR', in: ['A', 'B'], dx: -6.0, y: 2.6 },
    { id: 'g3', op: 'OR', in: ['E', 'F'], dx: -3.6, y: 2.6 },
    { id: 'g4', op: 'NOT', in: ['F'], dx: -1.2, y: 2.6 },
    { id: 'g5', op: 'XOR', in: ['G', 'H'], dx: 1.2, y: 2.6 },
    { id: 'g6', op: 'AND', in: ['A', 'C'], dx: 3.6, y: 2.6 },
    { id: 'g7', op: 'AND', in: ['D', 'G'], dx: 6.0, y: 2.6 },
    { id: 'c1', op: 'AND', in: ['g1', 'g3'], dx: -4.0, y: 4.4 },
    { id: 'c2', op: 'AND', in: ['g4', 'g5'], dx: 0.0, y: 4.4 },
    { id: 'c3', op: 'AND', in: ['g6', 'g7'], dx: 4.0, y: 4.4 },
    { id: 'c4', op: 'AND', in: ['c1', 'c2'], dx: -2.0, y: 5.9 },
    { id: 'OUT', op: 'AND', in: ['c4', 'c3'], dx: 0.6, y: 7.2 },
  ],
};

// Isla 5 "Cala del Naufragio": la isla MÁS grande, rocosa y con montañas empinadas (bordes
// de playa como Isla Pato). Belu reencuentra a NEMO, junta las 8 PIEZAS del barco encallado
// desperdigadas por la isla y después las ARMA en orden (puzzle) para reparar el barco y
// zarpar hacia "El Pato Mareado". Posiciones dx/dz relativas al centro de la isla (ISLANDS[4]).
// Textos en textos.js → nemo/barcoPuzzle/barcoListo. Ver game/ShipwreckIsland.js.
export const NAUFRAGIO = {
  nemo: { dx: -34, dz: 2, talkRadius: 3.8 },     // cerca de la llegada (orilla oeste)
  ship: { dx: 48, dz: 8, rotY: -0.5 },           // encallado en las rocas de la orilla este
  boardRadius: 7.0,                              // radio para reparar/embarcar junto al barco
  pickupRadius: 2.8,                             // cercanía para juntar cada pieza
  nemoName: TEXTOS.nemo.nombre,
  reunion: TEXTOS.nemo.reencuentro,
  puzzle: TEXTOS.barcoPuzzle,
  boardTitle: TEXTOS.barcoListo.titulo,
  boardMessage: TEXTOS.barcoListo.mensaje,
  // Las 8 piezas del barco. `order` = orden correcto de armado (1 = primero, de abajo hacia
  // arriba). dx/dz relativos al centro. `peak` marca la pieza escondida en un pico (parkour).
  parts: [
    { kind: 'bowPlanks',   name: 'Tablas de proa',  order: 1, dx: -30, dz: -14 },
    { kind: 'sternPlanks', name: 'Tablas de popa',  order: 2, dx:  22, dz: -30 },
    { kind: 'deck',        name: 'Cubierta',        order: 3, dx: -10, dz:  30 },
    { kind: 'rudder',      name: 'Timón',           order: 4, dx:  34, dz: -18 },
    { kind: 'mast',        name: 'Mástil',          order: 5, dx: -14, dz:   6, peak: true }, // pico empinado (saltar rocas)
    { kind: 'yard',        name: 'Verga',           order: 6, dx:   4, dz: -10 },
    { kind: 'sail',        name: 'Vela',            order: 7, dx:  26, dz:  28 },
    { kind: 'wheel',       name: 'Rueda del timón', order: 8, dx: -20, dz: -28 },
  ],
};

// Avatar 3D con rig (Ready Player Me). Si `enabled` está en true y el .glb existe,
// se usa el avatar con animación esquelética; si no, cae en el modelo de primitivas.
// Ajustar `scale`/`yOffset`/`yawOffset` para calzar el avatar sobre el collider.
export const AVATAR = {
  // Apagado: el avatar de RPM hay que generarlo a mano desde una selfie (no se puede
  // automatizar). Mientras tanto se usan los modelos chibi de primitivas (Belu +
  // Gianlucca). Poner en true si algún día se genera el belu.glb (ver public/models/).
  enabled: false,
  // Rutas servidas desde public/ (Vite las expone en la raíz "/").
  model: '/models/belu.glb',
  anims: {
    idle: '/models/anim/idle.glb',
    walk: '/models/anim/walk.glb',
    run:  '/models/anim/run.glb',
  },
  scale: 1.0,        // el avatar RPM ya mide ~1.7m; afinar si hace falta
  yOffset: 0,        // corrección vertical fina (pies exactos en y=0)
  yawOffset: 0,      // giro extra si el avatar no mira a +Z (probar Math.PI)
  // Umbrales de speed01 para cruzar de una animación a otra.
  walkThreshold: 0.1,
  runThreshold: 0.6,
  fadeTime: 0.18,    // duración del cross-fade entre animaciones (s)
};
