import * as THREE from 'three';

// Materiales compartidos para no repetir colores/props por todo el código. Cada factory
// devuelve instancias NUEVAS: así, si una isla quiere tunear su material, lo hace sobre el
// resultado sin afectar a las demás (aislamiento por isla).

// Maderas de tablones: puentes, muelles y plataformas de madera.
export function woodMats() {
  return {
    light: new THREE.MeshStandardMaterial({ color: 0xac7d43, roughness: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x82531f, roughness: 1 }),
    rope: new THREE.MeshStandardMaterial({ color: 0x6b5636, roughness: 1 }),
  };
}

// Trío de piedras facetadas (rocas, plataformas de roca, muros, faro). Se le puede pasar
// otra paleta para variar por isla (ej. la piedra oscura del Búnker).
export function stoneMats(colors = [0x8a8f96, 0x7c8188, 0x9aa0a6]) {
  return colors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }));
}
