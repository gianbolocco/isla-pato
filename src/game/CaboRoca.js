import { makeParrot } from '../objects/Parrot.js';
import { QUIZ } from '../config.js';

// Misión de Cabo Roca (isla 2): Juancho (loro) hace 3 preguntas sobre Gian y da la
// clave; con la clave, en la reja se abre el teclado y se abre el paso. La cercanía y
// la tecla E las maneja el InteractionManager (acá sólo registramos interactuables y
// la lógica del quiz/teclado). Expone `talked` y `gateOpen` para la Story.

export class CaboRoca {
  constructor(scene, world, player, dialogue, keypad, ui, interaction) {
    this.world = world;
    this.dialogue = dialogue;
    this.keypad = keypad;
    this.ui = ui;

    this.talked = false;
    this.gateOpen = false;
    this._t = 0;

    const p = QUIZ.parrotPos;
    const gy = world.groundHeightAt(p.x, p.z) ?? 0;

    // Juancho en su propia rama, en un claro (los árboles se mantienen lejos: ver
    // World._buildRockyIsland). Bien a la vista, pero hay que encontrarlo explorando.
    this._talkPos = { x: p.x, z: p.z };
    this.parrot = makeParrot();
    this._parrotBaseY = gy + 1.9;
    this.parrot.position.set(p.x, this._parrotBaseY, p.z);
    this.parrot.rotation.y = -Math.PI / 2;
    scene.add(this.parrot);

    // Interactuables (cercanía + E las maneja el InteractionManager).
    interaction.add({
      pos: () => this._talkPos,
      radius: QUIZ.talkRadius,
      prompt: () => 'Apretá <b>E</b> para hablar con Juancho 🦜',
      enabled: () => !this.talked,
      onInteract: () => this._startQuiz(),
    });
    interaction.add({
      pos: () => this.world.gatePos || { x: 1e9, z: 1e9 },
      radius: QUIZ.gateRadius,
      prompt: () => this.talked
        ? 'Apretá <b>E</b> para poner la clave en la reja 🔢'
        : 'La reja está cerrada. Apretá <b>E</b> para intentarlo',
      enabled: () => !this.gateOpen && !!this.world.gatePos,
      onInteract: () => this._openKeypad(),
    });
  }

  update(dt) {
    this._t += dt;
    const head = this.parrot.userData.head;
    if (head) head.rotation.z = Math.sin(this._t * 3) * 0.08;
    this.parrot.position.y = this._parrotBaseY + Math.sin(this._t * 2) * 0.03;
  }

  _startQuiz() {
    this.ui.open();
    const name = QUIZ.parrotName;
    this.dialogue.show(name,
      `¡Braaawk! Soy <b>${name}</b>. Yo sé la clave de la reja… pero primero: ¿de verdad conocés a tu pato? 🦜`,
      [{ label: '¡Dale, preguntame!', onClick: () => this._ask(0) }]);
  }

  _ask(i) {
    const name = QUIZ.parrotName;
    if (i >= QUIZ.questions.length) { this._finishQuiz(); return; }
    const q = QUIZ.questions[i];
    const opts = q.options.map((opt, idx) => ({
      label: opt,
      onClick: () => {
        if (idx === q.correct) this._ask(i + 1);
        else this.dialogue.show(name, '¡Braaawk! ✖ Esa no… ¿en serio? Probá de nuevo 🦜',
          [{ label: 'Reintentar', onClick: () => this._ask(i) }]);
      },
    }));
    this.dialogue.show(name, `Pregunta ${i + 1}/${QUIZ.questions.length}: <b>${q.q}</b>`, opts);
  }

  _finishQuiz() {
    this.talked = true;
    this.dialogue.show(QUIZ.parrotName,
      `¡Braaawk! Se nota que lo querés 💛. La clave de la reja es <b>${QUIZ.code}</b>. ¡Andá a salvar a tu pato! 🦜`,
      [{ label: 'Cerrar', onClick: () => { this.dialogue.hide(); this.ui.close(); } }]);
  }

  _openKeypad() {
    this.ui.open();
    this.keypad.open({
      title: this.talked ? 'Clave de la reja' : 'Reja cerrada — te falta la clave',
      onSubmit: (val) => {
        if (val === QUIZ.code) {
          this.gateOpen = true;
          this.world.openGate();
          this.ui.close();
          return true;
        }
        return false;
      },
      onCancel: () => this.ui.close(),
    });
  }
}
