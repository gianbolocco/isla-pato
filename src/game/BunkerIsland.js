import * as THREE from 'three';
import { BUNKER } from '../config.js';
import {
  makeLever, makeGateTile, makeBoard, makeCable, makeCRT, makeStoneBase,
} from '../world/props/bunker.js';

// Isla 4 "El Búnker": puzzle de COMPUERTAS LÓGICAS que baja el puente levadizo. Belu
// mueve las palancas de entrada (0/1); las compuertas (AND/OR/NOT/XOR…) combinan las
// señales; cuando la SALIDA (OUT) se enciende, se llama world.lowerDrawbridge().
//
// Todo el circuito es data-driven (config.BUNKER.inputs/gates: op, entradas y posición).
// La consola se apoya sobre una base de LADRILLOS DE PIEDRA (un pedestal caminable).
// La cercanía + tecla E de cada palanca las maneja el InteractionManager. Expone `solved`.

const DECK = 0.4;   // altura del pedestal de piedra (≤ MOVE.stepHeight para subir solo)

function applyOp(op, a, b) {
  switch (op) {
    case 'AND': return a && b;
    case 'OR': return a || b;
    case 'NOT': return !a;
    case 'XOR': return a !== b;
    case 'NAND': return !(a && b);
    case 'NOR': return !(a || b);
    case 'XNOR': return a === b;
    default: return false;
  }
}

export class BunkerIsland {
  constructor(scene, world, interaction) {
    this.world = world;
    this.solved = false;
    this._t = 0;

    const cx = BUNKER.console.x, cz = BUNKER.console.z;
    const B = BUNKER.board;
    const gy = world.groundHeightAt(cx, cz) ?? 0;

    const root = new THREE.Group();
    root.position.y = gy;
    scene.add(root);

    // Pedestal de ladrillos de piedra (con collider caminable) sobre el que va la consola.
    const plinth = makeStoneBase(B.w + 2.5, 6.8, DECK);
    plinth.position.set(cx, DECK / 2, cz + 0.2);
    root.add(plinth);
    world.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(cx, gy + DECK / 2, cz + 0.2),
      new THREE.Vector3(B.w + 2.5, DECK, 6.8)));

    // Todo lo de la consola va en un grupo elevado a la altura del pedestal.
    const deck = new THREE.Group();
    deck.position.y = DECK;
    root.add(deck);

    // Estado de las entradas (todas en 0 al empezar).
    this.st = {}; for (const it of BUNKER.inputs) this.st[it.id] = false;
    this.lamps = {};       // id -> { set(on) }
    this.nodePos = {};     // id -> [x,y,z] (coords del deck) para tender los cables

    // Tablero de fondo con borde de madera + monitor CRT de ambiente.
    const board = makeBoard(B.w, B.h);
    board.position.set(cx, B.y, cz - 2.2);
    deck.add(board);
    const crt = makeCRT();
    crt.position.set(cx - B.w / 2 - 0.6, 0, cz + 1.6); crt.rotation.y = 0.5;
    deck.add(crt);

    // Palancas de entrada (fila al frente, mirando al oeste por donde llega Belu).
    const leverZ = cz + 2.6;
    for (const it of BUNKER.inputs) {
      const lx = cx + it.dx;
      const lv = makeLever(it.id);
      lv.group.position.set(lx, 0, leverZ);
      deck.add(lv.group);
      this.lamps[it.id] = { set: lv.set };
      this.nodePos[it.id] = [lx, 1.75, leverZ + 0.24];
      interaction.add({
        pos: () => ({ x: lx, z: leverZ }),
        radius: 2.4,
        prompt: () => `Apretá <b>E</b>: palanca <b>${it.id}</b> (${this.st[it.id] ? '1' : '0'})`,
        enabled: () => !this.solved,
        onInteract: () => { this.st[it.id] = !this.st[it.id]; this._refresh(); },
      });
    }

    // Compuertas montadas en el tablero (posición desde config: dx respecto consola, y).
    const tileZ = cz - 2.0;
    for (const g of BUNKER.gates) {
      const gx = cx + g.dx;
      const tile = makeGateTile(g.op);
      tile.group.position.set(gx, g.y, tileZ);
      deck.add(tile.group);
      this.lamps[g.id] = tile.lamp;
      this.nodePos[g.id] = [gx, g.y, tileZ + 0.16];
    }

    // Cables: uno por cada entrada de cada compuerta (brilla según el nodo de origen).
    this.cables = [];
    const addCable = (src, dst) => {
      const c = makeCable(this.nodePos[src], this.nodePos[dst]);
      deck.add(c.mesh);
      this.cables.push({ set: c.set, src });
    };
    for (const g of BUNKER.gates) for (const src of g.in) addCable(src, g.id);
    // Cable de SALIDA hacia el cabrestante del puente (borde este de la isla).
    const piv = world.drawbridgePivot;
    if (piv) {
      this.nodePos.BRIDGE = [piv.x - 0.5, 3.2 - gy - DECK, piv.z];
      addCable('OUT', 'BRIDGE');
    }

    this._refresh();
  }

  // Evalúa el circuito (config.gates, en orden) y devuelve todos los valores de nodo.
  _evaluate() {
    const v = { ...this.st };
    for (const g of BUNKER.gates) v[g.id] = applyOp(g.op, v[g.in[0]], v[g.in[1]]);
    return v;
  }

  // Actualiza lámparas y cables según el estado; baja el puente si la SALIDA se enciende.
  _refresh() {
    const v = this._evaluate();
    for (const id in this.lamps) this.lamps[id].set(!!v[id]);
    for (const c of this.cables) c.set(!!v[c.src]);
    if (v.OUT && !this.solved) {
      this.solved = true;
      this.world.lowerDrawbridge();
    }
  }

  update(dt) {
    this._t += dt;
    // Parpadeo de la lámpara de salida cuando ya está resuelto (celebración).
    if (this.solved && this.lamps.OUT?.mat) {
      this.lamps.OUT.mat.emissiveIntensity = 2.4 + Math.sin(this._t * 6) * 0.8;
    }
  }
}
