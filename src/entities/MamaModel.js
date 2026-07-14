import * as THREE from 'three';

// Modelo 3D chibi de la MAMÁ de Belu (Cala del Pescador). Es "Belu pero adulta": mismo
// pelo rubio ondulado y la misma carita tierna, con un look de turista — vestido de verano,
// anteojos de sol en la cabeza y una cartera (guiño al chiste de "acá no hay shoppings").
// Misma interfaz que los demás personajes: `object3d` + `update(dt, speed01)`.
// Origen (y=0) en los pies; crece hacia +Y y mira hacia +Z.

const COLORS = {
  skin:   0xf6dcc4,
  hair:   0xe8c468,   // rubio como Belu
  hairHi: 0xf3d886,
  eye:    0x3b2416,
  brow:   0xc19653,
  cheek:  0xf2b1a6,
  lip:    0xc65b5b,   // labial suave (toque adulto)
  dress:  0xe2795f,   // vestido coral de verano
  dressHi:0xef8f76,
  sandal: 0xb98a5a,
  glass:  0x23262b,   // marco de los anteojos
  lens:   0x3a5566,
  bag:    0xcf5a86,   // cartera fucsia (shopping)
  bagHw:  0xf0d27a,   // herrajes dorados
  pearl:  0xffffff,
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts });
}

export class MamaModel {
  constructor() {
    this.object3d = new THREE.Group();
    this.object3d.name = 'Mama';
    this.object3d.scale.setScalar(1.04);   // apenas más alta que Belu (adulta)
    this.walkPhase = 0;
    this._build();
  }

  _build() {
    const M = {
      skin: mat(COLORS.skin, { roughness: 0.55 }),
      hair: mat(COLORS.hair, { roughness: 0.7 }),
      hairHi: mat(COLORS.hairHi, { roughness: 0.6 }),
      eye: mat(COLORS.eye, { roughness: 0.4 }),
      brow: mat(COLORS.brow),
      cheek: mat(COLORS.cheek, { roughness: 1 }),
      lip: mat(COLORS.lip, { roughness: 0.5 }),
      dress: mat(COLORS.dress, { roughness: 0.75 }),
      dressHi: mat(COLORS.dressHi, { roughness: 0.75 }),
      sandal: mat(COLORS.sandal),
      glass: mat(COLORS.glass, { roughness: 0.4, metalness: 0.3 }),
      lens: mat(COLORS.lens, { roughness: 0.2, metalness: 0.4 }),
      bag: mat(COLORS.bag, { roughness: 0.6 }),
      bagHw: mat(COLORS.bagHw, { roughness: 0.3, metalness: 0.4 }),
      pearl: mat(COLORS.pearl, { roughness: 0.2, metalness: 0.1 }),
      white: mat(0xffffff, { roughness: 0.25 }),
      pupil: mat(0x140d08, { roughness: 0.35 }),
    };
    this._mats = M;

    // ---- Piernas (desnudas, con sandalias) ----
    this.legL = this._buildLeg(M, -0.16);
    this.legR = this._buildLeg(M, 0.16);
    this.object3d.add(this.legL, this.legR);

    // ---- Falda acampanada del vestido ----
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.52, 0.5, 20), M.dress);
    skirt.position.y = 0.5;
    skirt.castShadow = true;
    this.object3d.add(skirt);
    // Volado del ruedo.
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 22), M.dressHi);
    hem.rotation.x = Math.PI / 2; hem.position.y = 0.27;
    this.object3d.add(hem);

    // ---- Torso: corpiño del vestido ----
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.5, 16), M.dress);
    torso.position.y = 0.95;
    torso.castShadow = true;
    this.object3d.add(torso);
    // Tira del hombro.
    for (const s of [-1, 1]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.06), M.dressHi);
      strap.position.set(s * 0.15, 1.15, -0.02);
      strap.rotation.z = s * 0.1;
      this.object3d.add(strap);
    }

    // ---- Cuello ----
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 12), M.skin);
    neck.position.y = 1.24;
    this.object3d.add(neck);

    // ---- Brazos ----
    this.armL = this._buildArm(M, -0.32, false);
    this.armR = this._buildArm(M, 0.32, true);   // el derecho lleva la cartera
    this.object3d.add(this.armL, this.armR);

    // ---- Cabeza ----
    this.head = new THREE.Group();
    this.head.position.y = 1.6;
    this.object3d.add(this.head);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 20), M.skin);
    this.head.add(skull);

    this._buildHair(M);
    this._buildFace(M);
    this._buildSunglasses(M);
    for (const side of [-1, 1]) {
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), M.pearl);
      pearl.position.set(side * 0.42, -0.22, 0.02);
      this.head.add(pearl);
    }

    this.object3d.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  _buildLeg(M, x) {
    const hip = new THREE.Group();
    hip.position.set(x, 0.5, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.42, 6, 10), M.skin);
    leg.position.y = -0.3;
    hip.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), M.sandal);
    foot.scale.set(1, 0.55, 1.4);
    foot.position.set(0, -0.55, 0.08);
    hip.add(foot);
    return hip;
  }

  _buildArm(M, x, withBag) {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 1.12, 0);
    shoulder.rotation.z = x < 0 ? 0.14 : -0.14;

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), M.skin);
    shoulder.add(cap);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.4, 6, 10), M.skin);
    arm.position.y = -0.28;
    shoulder.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), M.skin);
    hand.position.y = -0.53;
    shoulder.add(hand);

    if (withBag) {
      // Cartera colgada del antebrazo (el chiste del shopping).
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 16), M.bag);
      strap.position.set(0.02, -0.42, 0.12);
      strap.rotation.x = 0.4;
      shoulder.add(strap);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.1), M.bag);
      body.position.set(0.02, -0.56, 0.16);
      shoulder.add(body);
      const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), M.bagHw);
      clasp.position.set(0.02, -0.48, 0.21);
      shoulder.add(clasp);
    }
    return shoulder;
  }

  _buildHair(M) {
    // Casi calcado al de Belu (misma familia), con un rodete/melena un poco más "arreglada".
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.47, 24, 20), M.hair);
    cap.scale.set(1.06, 1.06, 1.06);
    cap.position.set(0, 0.05, -0.14);
    this.head.add(cap);

    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * 0.42;
      const lump = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), i % 2 ? M.hair : M.hairHi);
      lump.position.set(Math.sin(a) * 0.3, 0.33 - Math.abs(a) * 0.05, -0.05 + Math.cos(a) * 0.04);
      lump.scale.set(1, 0.8, 1.1);
      this.head.add(lump);
    }

    for (const side of [-1, 1]) {
      const bang = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), M.hairHi);
      bang.scale.set(1.0, 0.42, 0.4);
      bang.position.set(side * 0.16, 0.31, 0.17);
      bang.rotation.z = side * 0.5;
      this.head.add(bang);

      const lockTop = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.34, 8, 12), M.hair);
      lockTop.position.set(side * 0.38, -0.08, 0.02);
      lockTop.rotation.z = side * 0.12;
      lockTop.scale.set(1, 1, 0.8);
      this.head.add(lockTop);
    }

    const back = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), M.hair);
    back.scale.set(1.12, 1.45, 0.85);
    back.position.set(0, -0.34, -0.2);
    this.head.add(back);
  }

  _buildFace(M) {
    for (const side of [-1, 1]) {
      const EX = side * 0.17, EY = -0.03, EZ = 0.32;

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 18), M.white);
      sclera.scale.set(0.9, 1.25, 0.42);
      sclera.position.set(EX, EY, EZ);
      this.head.add(sclera);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 18), M.eye);
      iris.scale.set(1, 1.15, 0.5);
      iris.position.set(EX, EY - 0.012, EZ + 0.055);
      this.head.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 14), M.pupil);
      pupil.scale.set(1, 1.1, 0.5);
      pupil.position.set(EX, EY - 0.012, EZ + 0.085);
      this.head.add(pupil);

      const hi1 = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), M.white);
      hi1.position.set(EX - side * 0.035, EY + 0.055, EZ + 0.11);
      this.head.add(hi1);

      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.128, 18, 14), M.eye);
      lid.scale.set(0.92, 0.4, 0.45);
      lid.position.set(EX, EY + 0.11, EZ + 0.005);
      this.head.add(lid);

      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.11, 4, 8), M.brow);
      brow.rotation.z = Math.PI / 2 + side * 0.14;
      brow.position.set(EX, EY + 0.21, EZ + 0.04);
      this.head.add(brow);

      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), M.cheek);
      cheek.scale.set(1, 0.72, 0.25);
      cheek.position.set(side * 0.27, -0.16, 0.3);
      this.head.add(cheek);
    }

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), M.skin);
    nose.scale.set(0.8, 0.7, 0.6);
    nose.position.set(0, -0.11, 0.42);
    this.head.add(nose);

    // Sonrisa con labial (toque adulto).
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 16, Math.PI), M.lip);
    smile.rotation.x = Math.PI;
    smile.scale.z = 0.4;
    smile.position.set(0, -0.22, 0.4);
    this.head.add(smile);
  }

  _buildSunglasses(M) {
    // Anteojos de sol apoyados ARRIBA de la cabeza (subidos), como los usa en la playa.
    const g = new THREE.Group();
    g.position.set(0, 0.26, 0.16);
    g.rotation.x = -0.5;   // apoyados hacia atrás sobre el pelo
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), M.lens);
      lens.scale.set(1, 0.78, 0.35);
      lens.position.set(side * 0.17, 0, 0);
      g.add(lens);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 20), M.glass);
      rim.scale.set(1, 0.78, 1);
      rim.position.set(side * 0.17, 0, 0.02);
      g.add(rim);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), M.glass);
    bridge.position.set(0, 0.02, 0.02);
    g.add(bridge);
    this.head.add(g);
  }

  update(dt, speed01 = 0) {
    this.walkPhase += dt * (4 + speed01 * 8);
    const swing = Math.sin(this.walkPhase) * 0.5 * speed01;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.armL.rotation.x = -swing * 0.8;
    this.armR.rotation.x = swing * 0.8;

    const bob = Math.sin(performance.now() * 0.003) * 0.02 * (1 - speed01);
    this.head.position.y = 1.6 + bob;
  }
}
