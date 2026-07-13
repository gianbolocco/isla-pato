import { Game } from './core/Game.js';
import { Minimap } from './ui/Minimap.js';
import { StartScreen } from './ui/StartScreen.js';
import { DevPanel } from './ui/DevPanel.js';
import { DEBUG } from './config.js';

// Punto de entrada. Crea el juego, muestra el menú + intro narrada, y conecta el overlay
// de "click para jugar".
const container = document.getElementById('app');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');

const game = new Game(container);
game.start();

// Menú + intro: el juego renderiza de fondo pero Belu queda congelada (uiActive) y el
// overlay de "click para jugar" oculto hasta que la intro termine.
game.uiActive = true;
overlay.classList.add('hidden');
let introDone = false;
new StartScreen(document.body, () => {
  introDone = true;
  game.uiActive = false;
  overlay.classList.remove('hidden');   // fallback si el lock no engancha
  game.input.requestLock();             // gesto del usuario (click del botón) → captura mouse
});

// Minimapa con la posicion del jugador.
const minimap = new Minimap(game.world.getMapData());
(function tickMinimap() {
  minimap.update(game.player.position, game.player.facing);
  requestAnimationFrame(tickMinimap);
})();

// Al hacer click en el overlay, capturamos el puntero para mirar con el mouse.
overlay.addEventListener('click', () => game.input.requestLock());

// Mostrar/ocultar el overlay segun el pointer-lock. Durante la intro (introDone=false)
// no se muestra; tampoco con una UI abierta (dialogo/teclado, mouse suelto a proposito).
game.input.onLockChange = (locked) => {
  overlay.classList.toggle('hidden', !introDone || locked || game.uiActive);
};

// HUD simple con la altura alcanzada (util para probar el parkour).
setInterval(() => {
  const y = game.player.position.y.toFixed(1);
  hud.textContent = `altura: ${y} m`;
}, 100);

// 🛠️ Panel de desarrollo (temporal): teletransporte por islas. Se apaga con DEBUG=false.
if (DEBUG) new DevPanel(game);
