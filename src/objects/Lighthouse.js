import * as THREE from 'three';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 1, ...opts });
}

// Faro a franjas rojas/blancas con la sala de luz que brilla. Landmark de la isla
// rocosa. Origen en la base (y=0). Incluye una luz puntual cálida.
export function makeLighthouse() {
  const g = new THREE.Group();
  const white = mat(0xf0ece0);
  const red = mat(0xb23b34);

  // Base de roca.
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.4, 1.2, 12),
    mat(0x8a8f96, { flatShading: true }));
  base.position.y = 0.6; base.castShadow = true; base.receiveShadow = true;
  g.add(base);

  // Torre cónica a franjas.
  const H = 9, segs = 6;
  for (let i = 0; i < segs; i++) {
    const r0 = 1.5 - i * 0.13, r1 = 1.5 - (i + 1) * 0.13;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, H / segs, 16), i % 2 ? red : white);
    seg.position.y = 1.1 + (H / segs) * (i + 0.5);
    seg.castShadow = true;
    g.add(seg);
  }
  const topY = 1.1 + H;

  // Galería + baranda.
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.35, 16), mat(0x4a4a4e));
  gallery.position.y = topY + 0.15;
  g.add(gallery);

  // Sala de luz (vidrio que brilla).
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 1.3, 12),
    mat(0xffe6a3, { emissive: 0xffcf5a, emissiveIntensity: 2.0 }));
  lamp.position.y = topY + 1.0;
  g.add(lamp);

  // Techo.
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.1, 12), red);
  roof.position.y = topY + 2.1; roof.castShadow = true;
  g.add(roof);

  // Luz cálida.
  const light = new THREE.PointLight(0xffd98a, 0.9, 34, 2);
  light.position.y = topY + 1.0;
  g.add(light);

  return g;
}
