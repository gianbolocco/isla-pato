import { AlejandroModel } from '../entities/AlejandroModel.js';
import { MamaModel } from '../entities/MamaModel.js';
import { playLines } from './conversation.js';
import { DAD, MAMA } from '../config.js';

// Misión de la Isla 3 (Cala del Pescador): Alejandro, el papá de Belu, le cuenta que la
// familia quedó VARADA acá (andaban paseando en la lancha y Lulu los dejó tirados) y que
// destrozó el puente → hay que cruzar por parkour. Al lado está la MAMÁ, un NPC de comedia
// OPCIONAL (se queja de que no hay shoppings) que NO traba la misión. La cercanía + tecla E
// las maneja el InteractionManager. Expone `talked` (papá) para la Story.

export class FishingIsland {
  constructor(scene, world, dialogue, ui, interaction) {
    this.dialogue = dialogue;
    this.ui = ui;
    this.talked = false;
    this.talkedMama = false;

    // --- Papá (Alejandro): da la misión del parkour ---
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

    // --- Mamá: comedia opcional (no traba la progresión) ---
    const m = MAMA.pos;
    const my = world.groundHeightAt(m.x, m.z) ?? 0;
    this.mama = new MamaModel();
    this.mama.object3d.position.set(m.x, my, m.z);
    this.mama.object3d.rotation.y = Math.PI / 2;   // mirando hacia la llegada (−X), hacia Belu
    scene.add(this.mama.object3d);

    interaction.add({
      pos: () => MAMA.pos,
      radius: MAMA.talkRadius,
      prompt: () => `Apretá <b>E</b> para hablar con ${MAMA.name} 🕶️`,
      enabled: () => true,
      onInteract: () => this._talkMama(),
    });
  }

  update(dt) {
    this.dad.update(dt);
    this.mama.update(dt, 0);
  }

  _talk() {
    playLines(this.dialogue, this.ui, DAD.name, DAD.lines, () => { this.talked = true; });
  }

  _talkMama() {
    playLines(this.dialogue, this.ui, MAMA.name, MAMA.lines, () => { this.talkedMama = true; });
  }
}
