import * as THREE from 'three';

// Helpers compartidos por los modelos chibi de personajes (Belu, Gian, Mamá, Alejandro…).
// Evita repetir el material estándar y la animación de caminado en cada archivo.

// Material estándar de los personajes: mate, sin metal (el "feel" chibi). `opts` pisa lo que haga falta.
export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts });
}

// Animación de caminado + idle-bob para los bípedos. El modelo debe exponer:
//   legL, legR, armL, armR (grupos con pivote), head (grupo) y headBaseY (número).
// Lleva su propia fase en `model.walkPhase`. speed01: 0 quieto → 1 corriendo.
export function walkAnimation(model, dt, speed01 = 0) {
  model.walkPhase = (model.walkPhase || 0) + dt * (4 + speed01 * 8);
  const swing = Math.sin(model.walkPhase) * 0.5 * speed01;
  model.legL.rotation.x = swing;
  model.legR.rotation.x = -swing;
  model.armL.rotation.x = -swing * 0.8;
  model.armR.rotation.x = swing * 0.8;

  const bob = Math.sin(performance.now() * 0.003) * 0.02 * (1 - speed01);
  model.head.position.y = model.headBaseY + bob;
}
