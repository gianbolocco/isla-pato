import { INTRO } from '../config.js';
import { MessageBox } from '../ui/MessageBox.js';
import { ObjectiveHud } from '../ui/ObjectiveHud.js';
import { Dialogue } from '../ui/Dialogue.js';
import { Keypad } from '../ui/Keypad.js';
import { makeBottle } from '../objects/Bottle.js';
import { PlankField } from './PlankField.js';
import { CaboRoca } from './CaboRoca.js';

// Máquina de estados de la historia (checkpoints). Cada paso tiene un `objective`
// (texto para el HUD, string o función) y un `update(dt)` que devuelve true cuando
// se cumple; opcionalmente `onEnter`/`onDone`. Para agregar islas/misiones nuevas,
// se agregan pasos a `_buildSteps()`. Centraliza botella, mensaje, tablones y puente.
//
// Nivel 1: leer la botella -> llegar al puente roto (ahí aparecen los tablones) ->
// juntarlos -> puente reparado -> cruzar a Cabo Roca.

export class Story {
  constructor(scene, world, player, container, ui, input) {
    this.scene = scene;
    this.world = world;
    this.player = player;

    this.messageBox = new MessageBox(container);
    this.hud = new ObjectiveHud(container);
    this.plankField = new PlankField(scene);

    // UI de diálogo/teclado + misión de Cabo Roca (loro Juancho + reja).
    this.dialogue = new Dialogue(container);
    this.keypad = new Keypad(container);
    this.caboRoca = new CaboRoca(scene, world, player, this.dialogue, this.keypad, ui, input, container);

    // Botella (un poco más grande) en el muelle.
    this.bottle = makeBottle();
    this.bottle.scale.setScalar(1.6);
    this.bottle.position.set(INTRO.bottle.x, INTRO.bottle.y, INTRO.bottle.z);
    scene.add(this.bottle);

    this._t = 0;
    this._bottleSeen = false;
    this._steps = this._buildSteps();
    this._i = 0;
    this._refreshHud();
  }

  _buildSteps() {
    const dist = (x, z) => Math.hypot(this.player.position.x - x, this.player.position.z - z);
    return [
      {
        objective: 'Busca alguna señal de Gianlucca en la isla…',
        update: () => {
          const near = dist(this.bottle.position.x, this.bottle.position.z) < INTRO.readRadius;
          if (near) { this.messageBox.show(INTRO.title, INTRO.message); this._bottleSeen = true; }
          else this.messageBox.hide();
          return this._bottleSeen && !near;         // la leyó y se alejó
        },
      },
      {
        objective: 'El puente al este está roto — andá a verlo',
        update: () => {
          const b = this.world.bridgeStart;
          return !!b && dist(b.x, b.z) < 8;
        },
        onDone: () => this.plankField.spawn(),        // recién ahora aparecen los tablones
      },
      {
        objective: () => `Juntá los tablones para arreglar el puente: ${this.plankField.collected}/${this.plankField.total}`,
        update: (dt) => {
          this.plankField.update(dt, this.player.position);
          return this.plankField.allCollected;
        },
        onDone: () => this.world.repairBridge(),
      },
      {
        objective: '¡Puente reparado! Cruzá a Cabo Roca',
        update: () => this.player.position.x > 96,    // llegó a Cabo Roca
      },
      {
        objective: 'Explorá Cabo Roca…',   // que encuentre a Juancho sola (sin flecha)
        update: () => this.caboRoca.talked,
      },
      {
        objective: 'Poné la clave en la reja para abrir el paso 🔢',
        update: () => this.caboRoca.gateOpen,
      },
      {
        objective: 'Cruzá el puente a la próxima isla',
        update: () => this.player.position.x > 176,   // llegó a la isla 3
      },
      {
        objective: 'Isla 3: próximamente… (a diseñar)',
        update: () => false,
      },
    ];
  }

  get _step() { return this._steps[this._i]; }

  _refreshHud() {
    const s = this._step;
    if (s) this.hud.set(typeof s.objective === 'function' ? s.objective() : s.objective);
  }

  update(dt) {
    this._t += dt;
    // La botella se mece y gira suave.
    this.bottle.rotation.y += dt * 0.6;
    this.bottle.position.y = INTRO.bottle.y + Math.sin(this._t * 1.6) * 0.06;

    this.caboRoca.update(dt);   // loro (idle) + disparadores de proximidad

    const s = this._step;
    if (!s) return;
    const done = s.update(dt);
    if (typeof s.objective === 'function') this._refreshHud();   // objetivo dinámico (contador)
    if (done) {
      if (s.onDone) s.onDone();
      this._i++;
      this._refreshHud();
    }
  }
}
