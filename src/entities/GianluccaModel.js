import * as THREE from 'three';

// Modelo 3D chibi de Gianlucca (el novio de Belu), en el MISMO estilo tierno que
// BeluModel, segun las fotos de img/: pelo oscuro casi negro con costados cortos y
// volumen arriba (quiff), CEJAS GRUESAS (su sello), barba de pocos dias, remera azul,
// jean oscuro y zapatillas. Un poco mas alto y ancho de hombros que Belu.
//
// Cumple la misma interfaz que BeluModel:
//   - `object3d` : grupo con los pies en y=0, mirando a +Z.
//   - `update(dt, speed01)` : balanceo al caminar + idle-bob (speed01=0 -> quieto).

const COLORS = {
  skin:   0xecc09a,   // piel calida, apenas mas tostada que Belu
  skinSh: 0xd8a279,   // sombra de piel (mejillas/barba base)
  hair:   0x241f1c,   // castano muy oscuro, casi negro
  hairHi: 0x3a322c,   // reflejo del pelo
  brow:   0x1d1815,   // cejas gruesas oscuras
  eye:    0x3b2416,   // marron
  stubble:0xb69072,   // barba de pocos dias (tono apagado)
  cheek:  0xe8a58f,   // rubor sutil
  shirt:  0x35618e,   // remera azul
  shirtSh:0x2b4f75,
  pants:  0x35363f,   // jean oscuro
  shoe:   0xe9e9ec,   // zapatillas claras
  sole:   0x2a2a2e,
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts });
}

export class GianluccaModel {
  constructor() {
    this.object3d = new THREE.Group();
    this.object3d.name = 'Gianlucca';
    // Un pelin mas grande que Belu (los pies quedan en y=0 igual al escalar desde el origen).
    this.object3d.scale.setScalar(1.06);

    this.walkPhase = 0;
    this._build();
  }

  _build() {
    const M = {
      skin: mat(COLORS.skin, { roughness: 0.55 }),
      skinSh: mat(COLORS.skinSh, { roughness: 0.7 }),
      hair: mat(COLORS.hair, { roughness: 0.65 }),
      hairHi: mat(COLORS.hairHi, { roughness: 0.55 }),
      brow: mat(COLORS.brow, { roughness: 0.6 }),
      eye: mat(COLORS.eye, { roughness: 0.4 }),
      stubble: mat(COLORS.stubble, { roughness: 1, transparent: true, opacity: 0.5 }),
      cheek: mat(COLORS.cheek, { roughness: 1 }),
      shirt: mat(COLORS.shirt, { roughness: 0.8 }),
      shirtSh: mat(COLORS.shirtSh, { roughness: 0.8 }),
      pants: mat(COLORS.pants, { roughness: 0.9 }),
      shoe: mat(COLORS.shoe, { roughness: 0.7 }),
      sole: mat(COLORS.sole, { roughness: 0.9 }),
      pearl: mat(0xffffff, { roughness: 0.2 }),
      white: mat(0xffffff, { roughness: 0.25 }),   // blanco del ojo
      pupil: mat(0x140d08, { roughness: 0.35 }),    // pupila
    };
    this._mats = M;

    // ---- Piernas (pivotan desde la cadera) ----
    this.legL = this._buildLeg(M, -0.19);
    this.legR = this._buildLeg(M, 0.19);
    this.object3d.add(this.legL, this.legR);

    // ---- Cadera ----
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.24, 16), M.pants);
    pelvis.position.y = 0.6;
    pelvis.castShadow = true;
    this.object3d.add(pelvis);

    // ---- Torso: remera azul (hombros mas anchos que Belu) ----
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.32, 0.6, 16), M.shirt);
    torso.position.y = 0.96;
    torso.castShadow = true;
    this.object3d.add(torso);
    // Pecho apenas marcado.
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), M.shirt);
    chest.scale.set(1, 0.5, 0.7);
    chest.position.y = 1.12;
    this.object3d.add(chest);

    // ---- Cuello (mas grueso) ----
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.14, 12), M.skin);
    neck.position.y = 1.28;
    this.object3d.add(neck);

    // ---- Brazos ----
    this.armL = this._buildArm(M, -0.4);
    this.armR = this._buildArm(M, 0.4);
    this.object3d.add(this.armL, this.armR);

    // ---- Cabeza ----
    this.head = new THREE.Group();
    this.head.position.y = 1.64;
    this.object3d.add(this.head);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 20), M.skin);
    skull.scale.set(1, 1.02, 0.98);
    skull.castShadow = true;
    this.head.add(skull);
    // Mandibula un poco mas marcada (masculina).
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), M.skin);
    jaw.scale.set(1, 0.7, 0.92);
    jaw.position.set(0, -0.16, 0.02);
    this.head.add(jaw);

    this._buildHair(M);
    this._buildFace(M);

    this.object3d.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  _buildLeg(M, x) {
    const hip = new THREE.Group();
    hip.position.set(x, 0.55, 0);

    // Pierna recta de jean (menos ancha que el wide-leg de Belu).
    const pant = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.64, 16), M.pants);
    pant.position.y = -0.32;
    hip.add(pant);

    // Zapatilla: suela oscura + empeine claro.
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.34), M.sole);
    sole.position.set(0, -0.63, 0.06);
    hip.add(sole);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), M.shoe);
    shoe.scale.set(1, 0.7, 1.3);
    shoe.position.set(0, -0.55, 0.07);
    hip.add(shoe);

    return hip;
  }

  _buildArm(M, x) {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 1.14, 0);
    shoulder.rotation.z = x < 0 ? 0.14 : -0.14;

    // Manga corta de la remera (hombro + medio brazo).
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), M.shirt);
    shoulder.add(cap);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.14, 6, 10), M.shirtSh);
    sleeve.position.y = -0.16;
    shoulder.add(sleeve);

    // Antebrazo de piel + mano.
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.093, 0.34, 6, 10), M.skin);
    arm.position.y = -0.4;
    shoulder.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), M.skin);
    hand.position.y = -0.62;
    shoulder.add(hand);

    return shoulder;
  }

  _buildHair(M) {
    // Costados cortos: una capa fina y oscura pegada al craneo (fade), sin bajar
    // tanto como el pelo largo de Belu.
    const sides = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 20), M.hair);
    sides.scale.set(1.04, 0.9, 1.02);
    sides.position.set(0, 0.12, -0.03);
    this.head.add(sides);

    // Tapa el craneo por arriba/atras (deja la cara y las orejas despejadas).
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 20), M.hair);
    cap.scale.set(1.02, 1.0, 1.04);
    cap.position.set(0, 0.2, -0.06);
    this.head.add(cap);

    // Volumen texturizado arriba (mechones despeinados hacia arriba/adelante = quiff).
    for (let i = 0; i < 6; i++) {
      const a = (i - 2.5) * 0.34;
      const lump = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), i % 2 ? M.hair : M.hairHi);
      lump.position.set(Math.sin(a) * 0.28, 0.4 - Math.abs(a) * 0.03, 0.04 + Math.cos(a) * 0.05);
      lump.scale.set(0.9, 1.05, 1);
      this.head.add(lump);
    }
    // Copete al frente, levantado.
    const quiff = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), M.hairHi);
    quiff.scale.set(1.1, 0.7, 0.7);
    quiff.position.set(0, 0.42, 0.24);
    quiff.rotation.x = -0.5;
    this.head.add(quiff);
  }

  _buildFace(M) {
    // Rasgos "pintados" sobre la cara. Ojos grandes y brillantes (tiernos) pero un
    // poco mas entornados que los de Belu, con cejas gruesas encima.
    for (const side of [-1, 1]) {
      const EX = side * 0.17, EY = -0.01, EZ = 0.33;

      // Blanco del ojo.
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 18), M.white);
      sclera.scale.set(0.95, 1.02, 0.42);
      sclera.position.set(EX, EY, EZ);
      this.head.add(sclera);

      // Iris marron grande.
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.088, 20, 18), M.eye);
      iris.scale.set(1, 1.05, 0.5);
      iris.position.set(EX, EY - 0.008, EZ + 0.05);
      this.head.add(iris);

      // Pupila.
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 14), M.pupil);
      pupil.scale.set(1, 1.05, 0.5);
      pupil.position.set(EX, EY - 0.008, EZ + 0.08);
      this.head.add(pupil);

      // Brillos.
      const hi1 = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), M.white);
      hi1.position.set(EX - side * 0.035, EY + 0.05, EZ + 0.1);
      this.head.add(hi1);
      const hi2 = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), M.white);
      hi2.position.set(EX + side * 0.04, EY - 0.05, EZ + 0.095);
      this.head.add(hi2);

      // Parpado superior (mirada un pelin mas seria/masculina).
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), M.eye);
      lid.scale.set(0.95, 0.42, 0.45);
      lid.position.set(EX, EY + 0.09, EZ + 0.005);
      this.head.add(lid);

      // CEJA GRUESA (su sello): mas grande, oscura, poblada, angulada.
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.12, 5, 10), M.brow);
      brow.rotation.z = Math.PI / 2 + side * 0.16;
      brow.position.set(EX, EY + 0.19, EZ + 0.03);
      this.head.add(brow);
      const browIn = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), M.brow);
      browIn.scale.set(1, 0.8, 0.4);
      browIn.position.set(side * 0.085, EY + 0.17, EZ + 0.03);
      this.head.add(browIn);

      // Sombra de la mejilla (barba de pocos dias, lateral).
      const beard = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), M.stubble);
      beard.scale.set(0.55, 0.7, 0.22);
      beard.position.set(side * 0.26, -0.2, 0.24);
      this.head.add(beard);
    }

    // Nariz un poco mas grande.
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), M.skin);
    nose.scale.set(0.8, 0.9, 0.7);
    nose.position.set(0, -0.06, 0.42);
    this.head.add(nose);

    // Barba de pocos dias: sombra sobre el labio superior y el menton.
    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.02), this._mats.stubble);
    mustache.position.set(0, -0.16, 0.38);
    this.head.add(mustache);
    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), this._mats.stubble);
    chin.scale.set(0.8, 0.6, 0.25);
    chin.position.set(0, -0.28, 0.28);
    this.head.add(chin);

    // Sonrisa canchera.
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 16, Math.PI), M.eye);
    smile.rotation.x = Math.PI;
    smile.scale.z = 0.4;
    smile.position.set(0, -0.19, 0.39);
    this.head.add(smile);
  }

  // dt: delta time; speed01: rapidez normalizada (0 quieto, 1 corriendo).
  update(dt, speed01) {
    this.walkPhase += dt * (4 + speed01 * 8);
    const swing = Math.sin(this.walkPhase) * 0.5 * speed01;

    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.armL.rotation.x = -swing * 0.8;
    this.armR.rotation.x = swing * 0.8;

    // Idle-bob suave cuando esta quieto.
    const bob = Math.sin(performance.now() * 0.003) * 0.02 * (1 - speed01);
    this.head.position.y = 1.64 + bob;
  }
}
