import * as THREE from 'three';
import { stoneMats } from './materials.js';

// Reja (portcullis) de piedra que bloquea el paso al puente hacia la isla 3, flanqueada
// por MUROS DE ROCA (con colisión) para que no se pueda pasar por el costado ni saltando.
// Los barrotes suben al abrir. Devuelve { group, gateCollider, wallColliders, open,
// update, pos }: el World saca `gateCollider` al abrir; los muros quedan siempre.
export function buildGate(x, z) {
  const group = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.6, metalness: 0.4 });
  const rockMats = stoneMats([0x7c8188, 0x8a8f96, 0x6f757b]);
  const stone = rockMats[1];   // pilares/dintel: gris piedra estándar

  const W = 6.5, H = 4.8, T = 0.7;   // ancho(Z), alto(Y), grosor(X) del hueco

  // Pilares de piedra a los costados del hueco.
  for (const s of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(T + 0.5, H + 1.0, 1.2), stone);
    pillar.position.set(x, (H + 1.0) / 2, z + s * (W / 2 + 0.3));
    pillar.castShadow = true; pillar.receiveShadow = true;
    group.add(pillar);
  }
  // Dintel arriba.
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(T + 0.6, 1.0, W + 2.4), stone);
  lintel.position.set(x, H + 0.5, z); lintel.castShadow = true;
  group.add(lintel);

  // Reja (barrotes + travesaños) que sube al abrir.
  const bars = new THREE.Group();
  const n = 8;
  for (let i = 0; i < n; i++) {
    const bz = z - W / 2 + (W / (n - 1)) * i;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, H, 8), iron);
    bar.position.set(x, H / 2, bz);
    bars.add(bar);
  }
  for (const hy of [0.5, H - 0.5]) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, W), iron);
    cross.position.set(x, hy, z);
    bars.add(cross);
  }
  bars.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(bars);

  // Muros de PIEDRA (mampostería) a ambos lados: bloques apilados en hiladas con TRABA
  // (running bond), retranqueados hacia arriba (talud) y con remate de musgo. Cierran el
  // paso hasta el agua y son altos para no saltarlos. Empiezan pasado el pilar (no tapan
  // el hueco). El collider es una caja limpia por muro.
  const wallLen = 20, wallH = 7, wallT = 2.4;
  const moss = new THREE.MeshStandardMaterial({ color: 0x6cab52, roughness: 1, flatShading: true });
  // Piedra "mojada" más oscura para el cimiento que baja al agua.
  const wet = new THREE.MeshStandardMaterial({ color: 0x565d63, roughness: 1, flatShading: true });
  const courses = 6, courseH = wallH / courses;
  const wallColliders = [];
  for (const s of [-1, 1]) {
    const zStart = z + s * (W / 2 + 0.3);           // arranca pasado el pilar
    // Cimiento: un bloque macizo que baja bien por debajo del agua. Sobre la playa queda
    // enterrado (no se ve); donde la orilla cae al mar, rellena el hueco para que el muro
    // NO parezca flotar sobre el agua.
    const found = new THREE.Mesh(new THREE.BoxGeometry(wallT * 0.98, 5, wallLen), wet);
    found.position.set(x, -2.0, zStart + s * (wallLen / 2));   // top ≈ +0.5, base ≈ −4.5
    found.receiveShadow = true;
    group.add(found);
    for (let c = 0; c < courses; c++) {
      const yy = courseH * (c + 0.5);
      const t = wallT * (1 - c * 0.05);             // se afina hacia arriba (talud)
      let zz = 0.3 + (c % 2) * 0.9;                  // traba: hiladas impares corridas
      while (zz < wallLen) {
        const bw = 1.1 + Math.random() * 0.9;       // ancho del bloque (en Z)
        if (zz + bw > wallLen) break;
        const blk = new THREE.Mesh(
          new THREE.BoxGeometry(t, courseH * 0.95, bw * 0.93), rockMats[(c + Math.floor(zz)) % 3]);
        blk.position.set(x + (Math.random() - 0.5) * 0.12, yy, zStart + s * (zz + bw / 2));
        blk.rotation.set((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.05);
        blk.castShadow = true; blk.receiveShadow = true;
        group.add(blk);
        zz += bw + 0.06;
      }
    }
    // Coronación con musgo arriba del muro.
    const cap = new THREE.Mesh(new THREE.BoxGeometry(wallT * 0.7, 0.24, wallLen - 0.6), moss);
    cap.position.set(x, wallH + 0.04, zStart + s * (wallLen / 2));
    cap.receiveShadow = true; group.add(cap);

    wallColliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, wallH / 2, zStart + s * (wallLen / 2)),
      new THREE.Vector3(wallT, wallH, wallLen)));
  }

  // Collider del hueco: alto (hasta el dintel) para no saltarlo con doble salto.
  const gateCollider = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(x, (H + 1.2) / 2, z), new THREE.Vector3(T, H + 1.2, W));

  const state = { opening: false, t: 0 };
  const open = () => { state.opening = true; };
  const update = (dt) => {
    if (!state.opening || state.t >= 1) return;
    state.t = Math.min(1, state.t + dt * 0.5);
    bars.position.y = state.t * (H + 0.5);   // sube y se esconde tras el dintel
  };

  return { group, gateCollider, wallColliders, open, update, pos: { x, z } };
}
