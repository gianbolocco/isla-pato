import * as THREE from 'three';

// Jaula de barrotes con puerta que se abre, para tener a Gian preso en el barco pirata (final).
// `buildCage()` → { group, open(), update(dt) }. La puerta (lado +Z) gira al llamar open().

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts });
}

export function buildCage() {
  const g = new THREE.Group();
  const metal = mat(0x44454c, { metalness: 0.4 });
  const wood = mat(0x5b3f26, { roughness: 1 });
  const W = 2.3, D = 2.3, H = 2.9;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.16, D), wood);
  floor.position.y = 0.08; g.add(floor);

  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, H, 8), metal);
    post.position.set(sx * W / 2, H / 2, sz * D / 2); g.add(post);
  }
  // Aros superior + barrotes del techo.
  for (const [sx, sz, w, d] of [[0, 1, W, 0.07], [0, -1, W, 0.07], [1, 0, 0.07, D], [-1, 0, 0.07, D]]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, d), metal);
    rail.position.set(sx * W / 2, H, sz * D / 2); g.add(rail);
  }
  for (let i = -2; i <= 2; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, W, 6), metal);
    b.rotation.z = Math.PI / 2; b.position.set(0, H, i * D / 5); g.add(b);
  }
  // Barrotes verticales de 3 lados (atrás −Z, izquierda −X, derecha +X).
  const vbar = (x, z) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, H, 6), metal);
    b.position.set(x, H / 2, z); g.add(b);
  };
  for (let i = -1; i <= 1; i++) { vbar(i * W / 3, -D / 2); vbar(-W / 2, i * D / 3); vbar(W / 2, i * D / 3); }

  // Puerta (lado +Z), con bisagra en la esquina delantera-izquierda.
  const door = new THREE.Group();
  door.position.set(-W / 2, 0, D / 2);
  for (let i = 0; i <= 3; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, H, 6), metal);
    b.position.set(i * (W / 3), H / 2, 0); door.add(b);
  }
  const dtop = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, 0.06), metal);
  dtop.position.set(W / 2, H, 0); door.add(dtop);
  const lock = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(0xcaa25c, { metalness: 0.4 }));
  lock.position.set(W, H / 2, 0); door.add(lock);
  g.add(door);

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  let opening = false, ang = 0;
  return {
    group: g,
    open() { opening = true; },
    update(dt) { if (opening && ang > -2.2) { ang -= dt * 3; door.rotation.y = Math.max(-2.2, ang); } },
  };
}
