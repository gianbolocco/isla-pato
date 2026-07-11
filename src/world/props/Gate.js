import * as THREE from 'three';

// Reja (portcullis) de piedra que bloquea el paso al puente hacia la isla 3, flanqueada
// por MUROS DE ROCA (con colisión) para que no se pueda pasar por el costado ni saltando.
// Los barrotes suben al abrir. Devuelve { group, gateCollider, wallColliders, open,
// update, pos }: el World saca `gateCollider` al abrir; los muros quedan siempre.
export function buildGate(x, z) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 1, flatShading: true });
  const iron = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.6, metalness: 0.4 });
  const rockMats = [0x7c8188, 0x8a8f96, 0x6f757b].map((c) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }));

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

  // Muros de roca a ambos lados (cierran el paso hasta el agua; altos para no saltarlos).
  const wallLen = 20, wallH = 7, wallT = 3.2;
  const wallColliders = [];
  for (const s of [-1, 1]) {
    const z0 = z + s * (W / 2);
    for (let i = 0; i < 6; i++) {
      // Rocas corridas HACIA AFUERA del hueco (empiezan pasado el pilar) y más chicas,
      // para no taparlo. Grosor en X moderado para que no invadan el paso.
      const rz = z0 + s * (3.5 + i * (wallLen / 6));
      const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4 + Math.random() * 1.1), rockMats[i % 3]);
      rk.position.set(x + (Math.random() - 0.5) * 1.0, 1.0 + Math.random() * 1.4, rz);
      rk.rotation.set(Math.random(), Math.random(), Math.random());
      rk.scale.y = 1.5 + Math.random() * 0.6;
      rk.castShadow = true; rk.receiveShadow = true;
      group.add(rk);
    }
    wallColliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, wallH / 2, z0 + s * (wallLen / 2)),
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
