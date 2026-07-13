import { NemoModel } from '../entities/NemoModel.js';
import { playLines } from './conversation.js';
import { NAUFRAGIO } from '../config.js';

// Misión de la Isla 5 (Cala del Naufragio): tras bajar el puente levadizo, Belu llega a
// una cala con un barco encallado. Ahí la encuentra NEMO (reencuentro emotivo, tecla E) y,
// después de saludarlo, puede subir al BOTE para arrancar el rumbo a "El Pato Mareado".
// La cercanía + tecla E las maneja el InteractionManager. Expone `talked` y `aboard`.

export class ShipwreckIsland {
  constructor(scene, world, messageBox, dialogue, ui, interaction) {
    this.messageBox = messageBox;
    this.dialogue = dialogue;
    this.ui = ui;
    this.talked = false;   // ya saludó a Nemo
    this.aboard = false;   // ya subió al bote

    // Nemo esperando entre los restos del naufragio, mirando hacia donde llega Belu (-X).
    const n = NAUFRAGIO.nemo;
    const gy = world.groundHeightAt(n.x, n.z) ?? 0;
    this.nemo = new NemoModel();
    this.nemo.object3d.position.set(n.x, gy, n.z);
    this.nemo.object3d.rotation.y = -Math.PI / 2;   // hocico hacia -X (a la orilla de llegada)
    scene.add(this.nemo.object3d);

    interaction.add({
      pos: () => ({ x: n.x, z: n.z }),
      radius: n.talkRadius,
      prompt: () => `Apretá <b>E</b> para saludar a ${NAUFRAGIO.nemoName} 🐶`,
      enabled: () => !this.talked,
      onInteract: () => this._greetNemo(),
    });

    // El bote: recién se puede subir DESPUÉS de encontrar a Nemo.
    const b = NAUFRAGIO.boat;
    interaction.add({
      pos: () => ({ x: b.x, z: b.z }),
      radius: b.readRadius,
      prompt: () => 'Apretá <b>E</b> para subir al bote ⛵',
      enabled: () => this.talked && !this.aboard,
      onInteract: () => this._board(),
    });
  }

  update(dt) {
    this.nemo.update(dt);
    // Nemo menea la cola más fuerte cuando Belu ya lo saludó (idle contento).
    if (this.talked) this.nemo.wagPhase += dt * 4;
  }

  _greetNemo() {
    playLines(this.dialogue, this.ui, NAUFRAGIO.nemoName, NAUFRAGIO.reunion, () => { this.talked = true; });
  }

  _board() {
    this.aboard = true;
    this.messageBox.show(NAUFRAGIO.boatTitle, NAUFRAGIO.boatMessage);
  }
}
