import { INTRO, BUNKER } from '../config.js';
import { MessageBox } from '../ui/MessageBox.js';
import { ObjectiveHud } from '../ui/ObjectiveHud.js';
import { Dialogue } from '../ui/Dialogue.js';
import { Keypad } from '../ui/Keypad.js';
import { Prompt } from '../ui/Prompt.js';
import { makeBottle } from '../objects/Bottle.js';
import { PlankField } from './PlankField.js';
import { InteractionManager } from './InteractionManager.js';
import { CaboRoca } from './CaboRoca.js';
import { FishingIsland } from './FishingIsland.js';
import { BunkerIsland } from './BunkerIsland.js';
import { ShipwreckIsland } from './ShipwreckIsland.js';
import { Checkpoints } from './Checkpoints.js';

// Máquina de estados de la historia (checkpoints narrativos). Cada paso tiene un
// `objective` (HUD, string o función) y un `update(dt)` que devuelve true al cumplirse.
// Para agregar islas/misiones se agregan pasos a `_buildSteps()`. Orquesta la UI, los
// managers de cada isla y el sistema de checkpoints (respawn).

export class Story {
  constructor(scene, world, player, container, ui, input) {
    this.scene = scene;
    this.world = world;
    this.player = player;

    this.messageBox = new MessageBox(container);
    this.hud = new ObjectiveHud(container);
    this.dialogue = new Dialogue(container);
    this.keypad = new Keypad(container);
    this.prompt = new Prompt(container);

    // Interacción centralizada (cercanía + tecla E + cartelito) para todos los NPC.
    this.interaction = new InteractionManager(player, input, this.prompt, ui);

    // Misiones por isla.
    this.plankField = new PlankField(scene);
    this.caboRoca = new CaboRoca(scene, world, player, this.dialogue, this.keypad, ui, this.interaction);
    this.fishingIsland = new FishingIsland(scene, world, this.dialogue, ui, this.interaction);
    this.bunker = new BunkerIsland(scene, world, this.interaction);
    this.shipwreck = new ShipwreckIsland(scene, world, this.messageBox, this.dialogue, ui, this.interaction);
    this.checkpoints = new Checkpoints(scene, player, world.checkpoints || []);

    // Botella con el mensaje de Gian, en el muelle (intro).
    this.bottle = makeBottle();
    this.bottle.scale.setScalar(1.6);
    this.bottle.position.set(INTRO.bottle.x, INTRO.bottle.y, INTRO.bottle.z);
    scene.add(this.bottle);

    // Segunda botella de Gian, en la llegada al Búnker (explica el puzzle lógico).
    this.bunkerBottle = makeBottle();
    this.bunkerBottle.scale.setScalar(1.6);
    this.bunkerBottle.position.set(BUNKER.bottle.x, BUNKER.bottle.y, BUNKER.bottle.z);
    scene.add(this.bunkerBottle);

    this._t = 0;
    // Las botellas se leen apretando E (no automático al pasar cerca), vía el
    // InteractionManager. Cada una devuelve su estado { seen } para gatear la Story.
    this.introBottle = this._addBottleReader(INTRO.bottle, INTRO.readRadius, INTRO.title, INTRO.message);
    this.bunkerNote = this._addBottleReader(BUNKER.bottle, BUNKER.readRadius, BUNKER.bottleTitle, BUNKER.bottleMessage);

    this._steps = this._buildSteps();
    this._i = 0;
    this._refreshHud();
  }

  // Registra una botella leíble con E (cercanía + cartelito + tecla). Devuelve el estado
  // { seen } que la Story usa para avanzar. Reutilizable para cualquier nota/botella.
  _addBottleReader(pos, radius, title, message) {
    const state = { seen: false };
    this.interaction.add({
      pos: () => ({ x: pos.x, z: pos.z }),
      radius,
      prompt: () => 'Apretá <b>E</b> para leer el mensaje 🍾',
      enabled: () => !state.seen,
      onInteract: () => { this.messageBox.show(title, message); state.seen = true; },
    });
    return state;
  }

  _buildSteps() {
    const dist = (x, z) => Math.hypot(this.player.position.x - x, this.player.position.z - z);
    return [
      {
        objective: 'Busca alguna señal de Gianlucca… (apretá E en la botella 🍾)',
        update: () => {
          const near = dist(this.bottle.position.x, this.bottle.position.z) < INTRO.readRadius;
          if (!near) this.messageBox.hide();
          return this.introBottle.seen && !near;
        },
      },
      {
        objective: 'El puente al este está roto — andá a verlo',
        update: () => { const b = this.world.bridgeStart; return !!b && dist(b.x, b.z) < 8; },
        onDone: () => this.plankField.spawn(),
      },
      {
        objective: () => `Juntá los tablones para arreglar el puente: ${this.plankField.collected}/${this.plankField.total}`,
        update: (dt) => { this.plankField.update(dt, this.player.position); return this.plankField.allCollected; },
        onDone: () => this.world.repairBridge(),
      },
      {
        objective: '¡Puente reparado! Cruzá a Cabo Roca',
        update: () => this.player.position.x > 96,
      },
      {
        objective: 'Explorá Cabo Roca…',
        update: () => this.caboRoca.talked,
      },
      {
        objective: 'Poné la clave en la reja para abrir el paso 🔢',
        update: () => this.caboRoca.gateOpen,
      },
      {
        objective: 'Cruzá el largo puente a la Cala del Pescador',
        update: () => this.player.position.x > 224,
      },
      {
        objective: 'Explorá la Cala del Pescador…',
        update: () => this.fishingIsland.talked,
      },
      {
        objective: 'El puente está destruido — cruzá el parkour saltando 🧗',
        update: () => this.player.position.x > 332,
      },
      {
        objective: 'Buscá la botella en la orilla del Búnker y apretá E 🍾',
        update: () => {
          const near = dist(this.bunkerBottle.position.x, this.bunkerBottle.position.z) < BUNKER.readRadius;
          if (!near) this.messageBox.hide();
          return this.bunkerNote.seen && !near;
        },
      },
      {
        objective: 'Resolvé el circuito: prendé la SALIDA en cian para bajar el puente 🧠',
        update: () => this.bunker.solved,
      },
      {
        objective: '¡Puente levadizo abajo! Cruzá hacia la Cala del Naufragio 🏴‍☠️',
        update: () => this.player.position.x > this.world.drawbridgeEndX + 2,
      },
      {
        objective: 'Llegaste a la Cala del Naufragio… ¿escuchás ese ladrido? 🐶',
        update: () => this.player.position.x > 424,
      },
      {
        objective: 'Seguí el ladrido entre los restos y saludá a quien te encontró (E) 🐶',
        update: () => this.shipwreck.talked,
      },
      {
        objective: '¡Nemo encontró un bote! Subite para ir a El Pato Mareado ⛵',
        update: () => this.shipwreck.aboard,
      },
      {
        objective: 'Rumbo a El Pato Mareado, a rescatar a tu pato… ¡continuará! 🦆🏴‍☠️',
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
    this.bottle.rotation.y += dt * 0.6;
    this.bottle.position.y = INTRO.bottle.y + Math.sin(this._t * 1.6) * 0.06;
    this.bunkerBottle.rotation.y += dt * 0.6;
    this.bunkerBottle.position.y = BUNKER.bottle.y + Math.sin(this._t * 1.6 + 1) * 0.06;

    this.interaction.update();          // cercanía + E de todos los NPC
    this.caboRoca.update(dt);           // idle del loro
    this.fishingIsland.update(dt);      // idle de Alejandro
    this.bunker.update(dt);             // parpadeo del circuito
    this.shipwreck.update(dt);          // idle de Nemo (cola que menea)
    this.checkpoints.update();          // respawn en el último checkpoint

    const s = this._step;
    if (!s) return;
    const done = s.update(dt);
    if (typeof s.objective === 'function') this._refreshHud();
    if (done) {
      if (s.onDone) s.onDone();
      this._i++;
      this._refreshHud();
    }
  }
}
