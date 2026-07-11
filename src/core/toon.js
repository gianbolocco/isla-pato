import * as THREE from 'three';

// Utilidades para el look de dibujo (toon / cel shading).
// - makeToonGradient: mapa de degradado en escalones (la luz se corta en bandas).
// - toonify: convierte los materiales de un objeto a MeshToonMaterial conservando
//   color/opacidad. Se aplica sólo a los personajes para no tocar el mundo.

export function makeToonGradient(steps = 4) {
  const data = new Uint8Array(Math.max(2, steps));
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.round((i / (data.length - 1)) * 255);
  }
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export function toonify(root, gradientMap) {
  root.traverse((o) => {
    const old = o.material;
    if (!o.isMesh || !old || !old.color) return;
    const toon = new THREE.MeshToonMaterial({
      color: old.color.clone(),
      gradientMap,
      transparent: old.transparent,
      opacity: old.opacity,
      map: old.map || null,
    });
    o.material = toon;
  });
}
