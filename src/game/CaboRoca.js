import { makeParrot } from '../objects/Parrot.js';
import { makeTree } from '../world/props/nature.js';
import { Prompt } from '../ui/Prompt.js';
import { QUIZ } from '../config.js';

// Misión de Cabo Roca (isla 2): Juancho (loro) posado en la rama de un árbol hace 3
// preguntas sobre Gian y da la clave; con la clave, en la reja se abre el teclado y,
// si acertás, se abre el paso. Se interactúa con la tecla **E** (muestra un prompt).
// `ui` coordina el pointer-lock de Game. Expone `talked` y `gateOpen` para la Story.

export class CaboRoca {
  constructor(scene, world, player, dialogue, keypad, ui, input, container) {
    this.world = world;
    this.player = player;
    this.dialogue = dialogue;
    this.keypad = keypad;
    this.ui = ui;
    this.input = input;
    this.prompt = new Prompt(container);

    this.talked = false;
    this.gateOpen = false;
    this._t = 0;
    this._busy = false;
    this._ePrev = false;

    const p = QUIZ.parrotPos;
    const gy = world.groundHeightAt(p.x, p.z) ?? 0;

    // Árbol de contexto.
    const tree = makeTree();
    tree.position.set(p.x, gy, p.z);
    tree.scale.setScalar(1.3);
    scene.add(tree);

    // Loro en una rama que sale hacia el lado por donde llega Belu → VISIBLE (fuera de
    // la copa). Igual hay que encontrarlo solo (no hay flecha ni objetivo que lo señale).
    const px = p.x - 2.4, pz = p.z;
    this._talkPos = { x: px, z: pz };
    this.parrot = makeParrot();
    this._parrotBaseY = gy + 2.2;
    this.parrot.position.set(px, this._parrotBaseY, pz);
    this.parrot.rotation.y = -Math.PI / 2;   // mira hacia Belu
    scene.add(this.parrot);
  }

  update(dt) {
    this._t += dt;
    const head = this.parrot.userData.head;
    if (head) head.rotation.z = Math.sin(this._t * 3) * 0.08;
    this.parrot.position.y = this._parrotBaseY + Math.sin(this._t * 2) * 0.03;

    if (this._busy) { this.prompt.hide(); return; }

    const pp = this.player.position;
    const nearParrot = !this.talked &&
      Math.hypot(pp.x - this._talkPos.x, pp.z - this._talkPos.z) < QUIZ.talkRadius;
    const gp = this.world.gatePos;
    const nearGate = !!gp && !this.gateOpen &&
      Math.hypot(pp.x - gp.x, pp.z - gp.z) < QUIZ.gateRadius;

    const e = this.input.isDown('KeyE');
    const eEdge = e && !this._ePrev;
    this._ePrev = e;

    if (nearParrot) {
      this.prompt.show('Apretá <b>E</b> para hablar con Juancho 🦜');
      if (eEdge) this._startQuiz();
    } else if (nearGate) {
      this.prompt.show(this.talked
        ? 'Apretá <b>E</b> para poner la clave en la reja 🔢'
        : 'La reja está cerrada. Apretá <b>E</b> para intentarlo');
      if (eEdge) this._openKeypad();
    } else {
      this.prompt.hide();
    }
  }

  _startQuiz() {
    this._busy = true;
    this.prompt.hide();
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
        if (idx === q.correct) {
          this._ask(i + 1);
        } else {
          this.dialogue.show(name, '¡Braaawk! ✖ Esa no… ¿en serio? Probá de nuevo 🦜',
            [{ label: 'Reintentar', onClick: () => this._ask(i) }]);
        }
      },
    }));
    this.dialogue.show(name, `Pregunta ${i + 1}/${QUIZ.questions.length}: <b>${q.q}</b>`, opts);
  }

  _finishQuiz() {
    const name = QUIZ.parrotName;
    this.talked = true;
    this.dialogue.show(name,
      `¡Braaawk! Se nota que lo querés 💛. La clave de la reja es <b>${QUIZ.code}</b>. ¡Andá a salvar a tu pato! 🦜`,
      [{ label: 'Cerrar', onClick: () => this._closeUi(() => this.dialogue.hide()) }]);
  }

  _openKeypad() {
    this._busy = true;
    this.prompt.hide();
    this.ui.open();
    this.keypad.open({
      title: this.talked ? 'Clave de la reja' : 'Reja cerrada — te falta la clave',
      onSubmit: (val) => {
        if (val === QUIZ.code) {
          this.gateOpen = true;
          this.world.openGate();
          this._busy = false;
          this.ui.close();
          return true;
        }
        return false;
      },
      onCancel: () => this._closeUi(),
    });
  }

  _closeUi(before) {
    if (before) before();
    this._busy = false;
    this.ui.close();
  }
}
