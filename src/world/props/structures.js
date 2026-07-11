import * as THREE from 'three';

// Estructuras de madera/roca: puentes y plataformas de parkour. Builders puros que
// devuelven { group, colliders, marker } para que el World componga escena/colisiones
// y el minimapa. Reutilizables para el parkour de las próximas islas del viaje.

// Puente entre dos puntos alineados a un eje (X o Z).
export function buildBridge(x1, z1, x2, z2) {
  const group = new THREE.Group();
  const alongX = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
  const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const width = 3.4;

  const light = new THREE.MeshStandardMaterial({ color: 0xac7d43, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x82531f, roughness: 1 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x6b5636, roughness: 1 });

  const step = 0.55;
  const n = Math.floor(len / step);
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const px = x1 + (x2 - x1) * f;
    const pz = z1 + (z2 - z1) * f;
    const size = alongX ? [0.5, 0.12, width] : [width, 0.12, 0.5];
    const plank = new THREE.Mesh(new THREE.BoxGeometry(...size), i % 2 ? light : dark);
    plank.position.set(px, -0.06, pz);
    plank.castShadow = true; plank.receiveShadow = true;
    group.add(plank);
  }
  const posts = Math.max(6, Math.round(len / 4));
  const perp = alongX ? [0, 0, 1] : [1, 0, 0];
  for (let i = 0; i <= posts; i++) {
    const f = i / posts;
    const px = x1 + (x2 - x1) * f;
    const pz = z1 + (z2 - z1) * f;
    for (const sgn of [-1, 1]) {
      const off = sgn * (width / 2 - 0.15);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.15, 8), dark);
      post.position.set(px + perp[0] * off, 0.5, pz + perp[2] * off);
      post.castShadow = true;
      group.add(post);
    }
  }
  for (const sgn of [-1, 1]) {
    const off = sgn * (width / 2 - 0.15);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 6), ropeMat);
    rope.rotation[alongX ? 'z' : 'x'] = Math.PI / 2;
    rope.position.set(cx + perp[0] * off, 0.95, cz + perp[2] * off);
    group.add(rope);
  }
  for (let i = 0; i <= 4; i++) {
    const f = i / 4;
    const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 3.2, 8), dark);
    pile.position.set(x1 + (x2 - x1) * f, -1.7, z1 + (z2 - z1) * f);
    pile.castShadow = true;
    group.add(pile);
  }

  const boxSize = alongX
    ? new THREE.Vector3(len, 0.3, width)
    : new THREE.Vector3(width, 0.3, len);
  const collider = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(cx, -0.15, cz), boxSize);
  return { group, colliders: [collider], bridge: { x1, z1, x2, z2 } };
}

// Puente ROTO: le falta el tramo del medio (tablones ocultos) y NO tiene collider
// hasta repararlo. Devuelve { group, collider, repair, bridge }. El World agrega el
// group (y el marcador de minimapa) pero recién agrega el collider al llamar repair().
export function buildBrokenBridge(x1, z1, x2, z2) {
  const group = new THREE.Group();
  const alongX = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
  const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const width = 3.4;

  const light = new THREE.MeshStandardMaterial({ color: 0xac7d43, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x82531f, roughness: 1 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x6b5636, roughness: 1 });

  // Tablones: el tercio central arranca invisible (el hueco del puente roto).
  const step = 0.55, n = Math.floor(len / step);
  const gap0 = Math.floor(n * 0.34), gap1 = Math.floor(n * 0.66);
  const missing = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const px = x1 + (x2 - x1) * f, pz = z1 + (z2 - z1) * f;
    const size = alongX ? [0.5, 0.12, width] : [width, 0.12, 0.5];
    const plank = new THREE.Mesh(new THREE.BoxGeometry(...size), i % 2 ? light : dark);
    plank.position.set(px, -0.06, pz);
    plank.castShadow = true; plank.receiveShadow = true;
    if (i >= gap0 && i <= gap1) { plank.visible = false; missing.push(plank); }
    group.add(plank);
  }
  // Postes + soga (presentes, para que se vea que "fue" un puente).
  const posts = Math.max(6, Math.round(len / 4));
  const perp = alongX ? [0, 0, 1] : [1, 0, 0];
  for (let i = 0; i <= posts; i++) {
    const f = i / posts;
    const px = x1 + (x2 - x1) * f, pz = z1 + (z2 - z1) * f;
    for (const sgn of [-1, 1]) {
      const off = sgn * (width / 2 - 0.15);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.15, 8), dark);
      post.position.set(px + perp[0] * off, 0.5, pz + perp[2] * off);
      post.castShadow = true;
      group.add(post);
    }
  }
  for (let i = 0; i <= 4; i++) {
    const f = i / 4;
    const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 3.2, 8), dark);
    pile.position.set(x1 + (x2 - x1) * f, -1.7, z1 + (z2 - z1) * f);
    pile.castShadow = true;
    group.add(pile);
  }

  // Colisión: los dos tramos intactos SON sólidos (no se atraviesa el puente ni se
  // cae por las tablas visibles); el tramo del medio (el hueco) recién obtiene
  // colisión al reparar, así hasta entonces no se puede cruzar.
  const f0 = gap0 / n, f1 = gap1 / n;
  const at = (f) => [x1 + (x2 - x1) * f, z1 + (z2 - z1) * f];
  const deck = (aX, aZ, bX, bZ) => {
    const size = alongX
      ? new THREE.Vector3(Math.abs(bX - aX), 0.3, width)
      : new THREE.Vector3(width, 0.3, Math.abs(bZ - aZ));
    return new THREE.Box3().setFromCenterAndSize(new THREE.Vector3((aX + bX) / 2, -0.15, (aZ + bZ) / 2), size);
  };
  const [gx0, gz0] = at(f0), [gx1, gz1] = at(f1);
  const colliders = [deck(x1, z1, gx0, gz0), deck(gx1, gz1, x2, z2)];   // tramos intactos
  const gapCollider = deck(gx0, gz0, gx1, gz1);                          // el hueco (al reparar)
  const repair = () => { for (const p of missing) p.visible = true; };

  return { group, colliders, gapCollider, repair, bridge: { x1, z1, x2, z2 } };
}

// Plataforma-muelle de madera (postes al agua). seaLevel para el largo de los postes.
export function buildWoodPlatform(x, y, z, w, d, seaLevel) {
  const group = new THREE.Group();
  const light = new THREE.MeshStandardMaterial({ color: 0xac7d43, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x82531f, roughness: 1 });
  const planks = Math.max(3, Math.round(w / 0.5));
  const pw = w / planks;
  for (let i = 0; i < planks; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.92, 0.25, d), i % 2 ? light : dark);
    plank.position.set(x - w / 2 + pw * (i + 0.5), y, z);
    plank.castShadow = true; plank.receiveShadow = true;
    group.add(plank);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const postLen = (y - seaLevel) + 1;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, postLen, 8), dark);
    post.position.set(x + sx * (w / 2 - 0.25), y - postLen / 2, z + sz * (d / 2 - 0.25));
    post.castShadow = true;
    group.add(post);
  }
  const collider = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(w, 0.25, d));
  return { group, colliders: [collider], platform: { x, z } };
}

// Plataforma de roca con cima plana y musgo.
export function buildRockPlatform(x, y, z, r) {
  const group = new THREE.Group();
  const mats = [0x8a8f96, 0x7c8188, 0x9aa0a6].map((c) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const rr = r * 0.6 * Math.random();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r * 0.5 + Math.random() * 0.25), mats[i % 3]);
    rock.position.set(x + Math.cos(a) * rr, y - 0.2 + Math.random() * 0.2, z + Math.sin(a) * rr);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.y = 0.75;
    rock.castShadow = true; rock.receiveShadow = true;
    group.add(rock);
  }
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, 0.5, 12), mats[0]);
  top.position.set(x, y - 0.25, z);
  top.castShadow = true; top.receiveShadow = true;
  group.add(top);
  const moss = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r * 0.82, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: 0x6cab52, roughness: 1 }));
  moss.position.set(x, y + 0.02, z);
  moss.receiveShadow = true;
  group.add(moss);
  const collider = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y - 0.1, z), new THREE.Vector3(r * 1.6, 0.5, r * 1.6));
  return { group, colliders: [collider], platform: { x, z } };
}
