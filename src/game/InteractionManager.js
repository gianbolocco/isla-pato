// Maneja TODOS los interactuables del juego (loro, reja, Alejandro, etc.) en un solo
// lugar: detecta el más cercano en rango, muestra el cartelito "Apretá E" y dispara la
// interacción al presionar E. Evita repetir la lógica de cercanía/tecla en cada isla.
//
// Un interactuable es: { pos():{x,z}, radius, prompt():string, enabled():bool, onInteract() }.
// Se registra con add(...). No dispara nada mientras haya una UI abierta (ui.active()).

import { audio } from '../core/audio.js';

export class InteractionManager {
  constructor(player, input, prompt, ui) {
    this.player = player;
    this.input = input;
    this.prompt = prompt;
    this.ui = ui;
    this.items = [];
    this._ePrev = false;
  }

  add(item) { this.items.push(item); return item; }

  update() {
    // Con una UI abierta no interactuamos (pero seguimos el estado de E para no
    // re-disparar al cerrar si la tecla sigue apretada).
    if (this.ui.active()) {
      this.prompt.hide();
      this._ePrev = this.input.isDown('KeyE');
      return;
    }

    const pp = this.player.position;
    let best = null, bestD = Infinity;
    for (const it of this.items) {
      if (!it.enabled()) continue;
      const p = it.pos();
      const d = Math.hypot(pp.x - p.x, pp.z - p.z);
      if (d < it.radius && d < bestD) { best = it; bestD = d; }
    }

    const e = this.input.isDown('KeyE');
    const eEdge = e && !this._ePrev;
    this._ePrev = e;

    if (best) {
      this.prompt.show(best.prompt());
      if (eEdge) { audio.interact(); best.onInteract(); }
    } else {
      this.prompt.hide();
    }
  }
}
