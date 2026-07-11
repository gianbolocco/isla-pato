import { Game } from './core/Game.js';
import { Minimap } from './ui/Minimap.js';

// Punto de entrada. Crea el juego y conecta el overlay de "click para jugar".
const container = document.getElementById('app');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');

const game = new Game(container);
game.start();

// Minimapa con la posicion del jugador.
const minimap = new Minimap(game.world.getMapData());
(function tickMinimap() {
  minimap.update(game.player.position, game.player.facing);
  requestAnimationFrame(tickMinimap);
})();

// Al hacer click en el overlay, capturamos el puntero para mirar con el mouse.
overlay.addEventListener('click', () => game.input.requestLock());

// Mostrar/ocultar el overlay segun el estado del pointer-lock.
game.input.onLockChange = (locked) => {
  overlay.classList.toggle('hidden', locked);
};

// HUD simple con la altura alcanzada (util para probar el parkour).
setInterval(() => {
  const y = game.player.position.y.toFixed(1);
  hud.textContent = `altura: ${y} m`;
}, 100);
