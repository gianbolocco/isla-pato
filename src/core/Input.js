// Gestiona teclado y mouse. Usa pointer-lock para mirar con el mouse como en
// cualquier juego 3D en primera/tercera persona.

export class Input {
  constructor(domElement) {
    this.dom = domElement;
    this.keys = new Set();
    this.mouseDX = 0;   // delta acumulado del mouse desde el último consume()
    this.mouseDY = 0;
    this.locked = false;

    // --- teclado ---
    window.addEventListener('keydown', (e) => {
      // evita que Espacio scrollee la página
      if (e.code === 'Space') e.preventDefault();
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    // si la ventana pierde foco, soltamos todas las teclas para no quedar "pegados"
    window.addEventListener('blur', () => this.keys.clear());

    // --- pointer lock ---
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      if (this.onLockChange) this.onLockChange(this.locked);
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
  }

  requestLock() {
    this.dom.requestPointerLock?.();
  }

  // Devuelve y resetea el movimiento acumulado del mouse (para aplicarlo una vez por frame).
  consumeMouseDelta() {
    const d = { x: this.mouseDX, y: this.mouseDY };
    this.mouseDX = 0;
    this.mouseDY = 0;
    return d;
  }

  isDown(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  // Vector de intención de movimiento en el plano (x = derecha, y = adelante), normalizado.
  moveAxis() {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyW', 'ArrowUp')) y += 1;
    if (this.isDown('KeyS', 'ArrowDown')) y -= 1;
    if (this.isDown('KeyD', 'ArrowRight')) x += 1;
    if (this.isDown('KeyA', 'ArrowLeft')) x -= 1;
    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; }
    return { x, y };
  }

  get running() {
    return this.isDown('ShiftLeft', 'ShiftRight');
  }
}
