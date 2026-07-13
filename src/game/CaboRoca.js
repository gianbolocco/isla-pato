import { makeParrot } from '../objects/Parrot.js';
import { QUIZ } from '../config.js';
import { TEXTOS } from '../textos.js';

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
      prompt: () => `Apretá <b>E</b> para hablar con ${TEXTOS.juancho.nombre} 🦜`,
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
    const J = TEXTOS.juancho;
    this.dialogue.show(J.nombre, J.saludo.replaceAll('{nombre}', J.nombre),
      [{ label: J.empezar, onClick: () => this._ask(0) }]);
  }

  _ask(i) {
    const J = TEXTOS.juancho;
    const qs = J.preguntas;
    if (i >= qs.length) { this._finishQuiz(); return; }
    const q = qs[i];
    const opts = q.opciones.map((opt, idx) => ({
      label: opt,
      onClick: () => {
        if (idx === q.correcta) this._ask(i + 1);
        else this.dialogue.show(J.nombre, J.incorrecto,
          [{ label: 'Reintentar', onClick: () => this._ask(i) }]);
      },
    }));
    this.dialogue.show(J.nombre, `Pregunta ${i + 1}/${qs.length}: <b>${q.pregunta}</b>`, opts);
  }

  _finishQuiz() {
    this.talked = true;
    const J = TEXTOS.juancho;
    this.dialogue.show(J.nombre, J.final.replaceAll('{clave}', QUIZ.code),
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
