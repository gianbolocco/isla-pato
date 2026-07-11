import * as THREE from 'three';

// Crea un Mesh a partir de un array plano de posiciones [x,y,z, x,y,z, ...] que
// forman triángulos. opts: colors (vertex-colors), flat (flatShading),
// transparent/opacity (para agua/espuma). Se usa para el terreno y algunos props.
export function meshFrom(arr, color, opts = {}) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
  if (opts.colors) geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(opts.colors), 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, roughness: 1, side: THREE.DoubleSide,
    vertexColors: !!opts.colors, flatShading: !!opts.flat,
    transparent: !!opts.transparent, opacity: opts.opacity ?? 1,
  }));
}
