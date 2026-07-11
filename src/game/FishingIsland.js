import { AlejandroModel } from '../entities/AlejandroModel.js';
import { playLines } from './conversation.js';
import { DAD } from '../config.js';

// Misión de la Isla 3 (Cala del Pescador): Alejandro, el papá de Belu, le cuenta que
// Lulu destrozó el puente y hay que cruzar por parkour. La cercanía + tecla E las
// maneja el InteractionManager. Expone `talked` para la Story.

export class FishingIsland {
  constructor(scene, world, dialogue, ui, interaction) {
    this.dialogue = dialogue;
    this.ui = ui;
    this.talked = false;

    const p = DAD.pos;
    const gy = world.groundHeightAt(p.x, p.z) ?? 0;
    this.dad = new AlejandroModel();
    this.dad.object3d.position.set(p.x, gy, p.z);
    this.dad.object3d.rotation.y = 0;              // mirando al agua (+Z), pescando
    scene.add(this.dad.object3d);

    interaction.add({
      pos: () => DAD.pos,
      radius: DAD.talkRadius,
      prompt: () => `Apretá <b>E</b> para hablar con ${DAD.name} 🎣`,
      enabled: () => true,                          // puede volver a hablarle
      onInteract: () => this._talk(),
    });
  }

  update(dt) { this.dad.update(dt); }

  _talk() {
    playLines(this.dialogue, this.ui, DAD.name, DAD.lines, () => { this.talked = true; });
  }
}
