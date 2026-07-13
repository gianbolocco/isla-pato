import { NemoModel } from '../entities/NemoModel.js';
import { playLines } from './conversation.js';
import { ShipPartsField } from './ShipPartsField.js';
import { AssemblyPuzzle } from '../ui/AssemblyPuzzle.js';
import { NAUFRAGIO } from '../config.js';

// Misión de la Isla 5 (Cala del Naufragio): Belu reencuentra a NEMO, que le muestra el barco
// encallado y roto. Hay que juntar las 8 PIEZAS por la isla y después ARMARLAS en orden
// (puzzle) para reparar el barco y zarpar hacia "El Pato Mareado".
//
// Flujo: hablar con Nemo (E) → aparecen las piezas → juntarlas todas → reparar el barco (E,
// abre el puzzle) → armar en orden → embarcar (E) → mensaje de cierre.
// Expone: talked, allCollected, collected, total, repaired, aboard (para la Story/HUD).

export class ShipwreckIsland {
  constructor(scene, world, player, container, messageBox, dialogue, ui, interaction) {
    this.world = world;
    this.player = player;
    this.messageBox = messageBox;
    this.dialogue = dialogue;
    this.ui = ui;

    this.talked = false;    // ya habló con Nemo (arranca la misión)
    this.repaired = false;  // ya resolvió el puzzle (barco reparado)
    this.aboard = false;    // ya embarcó (fin del capítulo)

    const N = world.naufragio;   // posiciones absolutas resueltas por el World

    // Nemo esperando cerca de la llegada, mirando hacia el oeste (a la orilla).
    const gy = world.groundHeightAt(N.nemo.x, N.nemo.z) ?? 0;
    this.nemo = new NemoModel();
    this.nemo.object3d.position.set(N.nemo.x, gy, N.nemo.z);
    this.nemo.object3d.rotation.y = -Math.PI / 2;
    scene.add(this.nemo.object3d);

    this.parts = new ShipPartsField(scene, world);
    this.puzzle = new AssemblyPuzzle(container);

    // 1) Saludar a Nemo → arranca la misión (aparecen las piezas).
    interaction.add({
      pos: () => N.nemo,
      radius: NAUFRAGIO.nemo.talkRadius,
      prompt: () => `Apretá <b>E</b> para saludar a ${NAUFRAGIO.nemoName} 🐶`,
      enabled: () => !this.talked,
      onInteract: () => this._greetNemo(),
    });

    // 2) Reparar el barco: sólo cuando juntaste todas las piezas y todavía no lo reparaste.
    interaction.add({
      pos: () => N.ship,
      radius: N.boardRadius,
      prompt: () => 'Apretá <b>E</b> para armar el barco 🔧',
      enabled: () => this.parts.allCollected && !this.repaired,
      onInteract: () => this._openPuzzle(),
    });

    // 3) Embarcar: barco reparado y todavía no zarpaste.
    interaction.add({
      pos: () => N.ship,
      radius: N.boardRadius,
      prompt: () => 'Apretá <b>E</b> para embarcar ⚓',
      enabled: () => this.repaired && !this.aboard,
      onInteract: () => this._board(),
    });
  }

  get total() { return this.parts.total; }
  get collected() { return this.parts.collected; }
  get allCollected() { return this.parts.allCollected; }

  update(dt) {
    this.nemo.update(dt);
    if (this.talked) this.nemo.wagPhase += dt * 4;   // más contento tras el reencuentro
    this.parts.update(dt, this.player.position);
  }

  _greetNemo() {
    playLines(this.dialogue, this.ui, NAUFRAGIO.nemoName, NAUFRAGIO.reunion, () => {
      this.talked = true;
      this.parts.spawn(this.world.naufragio.parts);   // aparecen las piezas por la isla
    });
  }

  _openPuzzle() {
    this.ui.open();
    this.puzzle.open({
      parts: this.world.naufragio.parts,
      texts: NAUFRAGIO.puzzle,
      onPlace: (order) => this.world.installShipPart(order),   // arma la pieza en el barco 3D
      onComplete: () => {
        this.world.repairShipwreck();
        this.repaired = true;
        this.ui.close();
      },
      onCancel: () => this.ui.close(),
    });
  }

  _board() {
    this.aboard = true;
    this.messageBox.show(NAUFRAGIO.boardTitle, NAUFRAGIO.boardMessage);
  }
}
