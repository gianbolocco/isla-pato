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

// Overlay "click para jugar": se muestra SIEMPRE que deberías tener control (jugando) pero el
// puntero no está capturado. Se evalúa cada frame (no solo en onLockChange) para que reaparezca
// aunque el requestLock haya fallado por no venir de un gesto (ej: al abordar el barco en el
// final, que se dispara desde el loop). Oculto durante intro / UI abierta / cinemáticas.
function updateOverlay() {
  const playing = introDone && !game.uiActive && !game.cutsceneActive && !(game.finale && game.finale.cinematic);
  overlay.classList.toggle('hidden', !playing || game.input.locked);
}

// Minimapa + overlay, cada frame.
const minimap = new Minimap(game.world.getMapData());
(function tick() {
  minimap.update(game.player.position, game.player.facing);
  updateOverlay();
  requestAnimationFrame(tick);
})();

// Al hacer click en el overlay, capturamos el puntero para mirar con el mouse.
overlay.addEventListener('click', () => game.input.requestLock());
game.input.onLockChange = () => updateOverlay();

// HUD simple con la altura alcanzada (util para probar el parkour).
setInterval(() => {
  const y = game.player.position.y.toFixed(1);
  hud.textContent = `altura: ${y} m`;
}, 100);

// 🛠️ Panel de desarrollo (temporal): teletransporte por islas. Se apaga con DEBUG=false.
if (DEBUG) new DevPanel(game);
