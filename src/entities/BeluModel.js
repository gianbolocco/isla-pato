import * as THREE from 'three';

// Modelo 3D chibi de Belu, construido con primitivas segun personajes/modeloBelu.png:
// cabeza grande, pelo rubio ondulado, top negro, pantalon crema ancho, aretes de perla.
// El origen (y=0) esta en los pies; el personaje crece hacia +Y y mira hacia +Z.
//
// Guarda referencias a brazos/piernas para animar el caminado.

const COLORS = {
  skin:   0xf6dcc4,   // durazno claro y suave (como la referencia)
  hair:   0xe8c468,   // rubio dorado
  hairHi: 0xf3d886,
  eye:    0x3b2416,   // marron oscuro
  brow:   0xc19653,
  cheek:  0xf2b1a6,   // rubor suave
  top:    0x242424,   // top negro
  pants:  0xf1ebdd,   // pantalon crema
  shoe:   0xefe7d6,
  pearl:  0xffffff,
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts });
}

export class BeluModel {
  constructor() {
    this.object3d = new THREE.Group();
    this.object3d.name = 'Belu';

    this.walkPhase = 0; // avanza al caminar, para el balanceo
    this._build();
  }

  _build() {
    const M = {
      skin: mat(COLORS.skin, { roughness: 0.55 }),  // piel mas suave (menos aspera)
      hair: mat(COLORS.hair, { roughness: 0.7 }),
      hairHi: mat(COLORS.hairHi, { roughness: 0.6 }),
      eye: mat(COLORS.eye, { roughness: 0.4 }),
      brow: mat(COLORS.brow),
      cheek: mat(COLORS.cheek, { roughness: 1 }),
      top: mat(COLORS.top, { roughness: 0.7 }),
      pants: mat(COLORS.pants),
      shoe: mat(COLORS.shoe),
      pearl: mat(COLORS.pearl, { roughness: 0.2, metalness: 0.1 }),
      white: mat(0xffffff, { roughness: 0.25 }),   // blanco del ojo (esclera)
      pupil: mat(0x140d08, { roughness: 0.35 }),    // pupila casi negra
    };
    this._mats = M;

    // ---- Piernas / pantalon (pivotan desde la cadera para el caminado) ----
    this.legL = this._buildLeg(M, -0.17);
    this.legR = this._buildLeg(M, 0.17);
    this.object3d.add(this.legL, this.legR);

    // ---- Cadera/pelvis: une el torso con las piernas (antes quedaba un hueco) ----
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.22, 0.24, 16), M.pants);
    pelvis.position.y = 0.6;
    pelvis.castShadow = true;
    this.object3d.add(pelvis);

    // ---- Torso: top negro (baja hasta la cadera para quedar unido) ----
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.58, 16), M.top);
    torso.position.y = 0.95;
    torso.castShadow = true;
    this.object3d.add(torso);

    // ---- Cuello ----
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.14, 12), M.skin);
    neck.position.y = 1.26;
    this.object3d.add(neck);

    // ---- Brazos (pivotan desde el hombro) ----
    this.armL = this._buildArm(M, -0.34);
    this.armR = this._buildArm(M, 0.34);
    this.object3d.add(this.armL, this.armR);

    // ---- Cabeza (grande, estilo chibi) ----
    this.head = new THREE.Group();
    this.head.position.y = 1.62;
    this.object3d.add(this.head);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 20), M.skin);
    skull.castShadow = true;
    this.head.add(skull);

    this._buildHair(M);
    this._buildFace(M);
    this._buildEarrings(M);

    // Sombras en todo lo que las proyecte
    this.object3d.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  _buildLeg(M, x) {
    // Grupo con pivote en la cadera (y ~ 0.55) para poder rotarla al caminar.
    const hip = new THREE.Group();
    hip.position.set(x, 0.55, 0);

    // Pantalon wide-leg: se ensancha un poco hacia abajo, pero cada pierna es
    // distinta (antes eran tan anchas que se fundian en un solo bloque).
    const pant = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.185, 0.62, 16), M.pants);
    pant.position.y = -0.31;
    hip.add(pant);

    // Zapato/pie redondeado color crema.
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), M.shoe);
    foot.scale.set(1, 0.65, 1.4);
    foot.position.set(0, -0.55, 0.08);
    hip.add(foot);

    return hip;
  }

  _buildArm(M, x) {
    // Pivote en el hombro.
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 1.12, 0);
    shoulder.rotation.z = x < 0 ? 0.16 : -0.16; // brazos ligeramente caidos hacia afuera

    // Hombro redondeado para una union mas suave con el torso.
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), M.skin);
    shoulder.add(cap);

    // Brazo mas largo para que se vea (antes quedaba como un muñon).
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.4, 6, 10), M.skin);
    arm.position.y = -0.28;
    shoulder.add(arm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), M.skin);
    hand.position.y = -0.53;
    shoulder.add(hand);

    return shoulder;
  }

  _buildHair(M) {
    // Masa principal: cubre corona, nuca y lados. Empujada hacia atras para dejar
    // la cara descubierta.
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.47, 24, 20), M.hair);
    cap.scale.set(1.06, 1.06, 1.06);
    cap.position.set(0, 0.05, -0.14);
    this.head.add(cap);

    // Volumen ondulado arriba: varios bultos suaves dan textura de pelo (no casco liso).
    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * 0.42;
      const lump = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), i % 2 ? M.hair : M.hairHi);
      lump.position.set(Math.sin(a) * 0.3, 0.33 - Math.abs(a) * 0.05, -0.05 + Math.cos(a) * 0.04);
      lump.scale.set(1, 0.8, 1.1);
      this.head.add(lump);
    }

    // Flequillo con raya al medio: dos mitades barridas hacia los lados, planas
    // y altas (en la linea del pelo) para que enmarquen sin abultar la frente.
    for (const side of [-1, 1]) {
      const bang = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), M.hairHi);
      bang.scale.set(1.0, 0.42, 0.4);
      bang.position.set(side * 0.16, 0.31, 0.17);
      bang.rotation.z = side * 0.5;
      this.head.add(bang);
    }

    // Mechones laterales con onda (2 partes por lado) que enmarcan la cara.
    for (const side of [-1, 1]) {
      const lockTop = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.32, 8, 12), M.hair);
      lockTop.position.set(side * 0.38, -0.05, 0.02);
      lockTop.rotation.z = side * 0.12;
      lockTop.scale.set(1, 1, 0.8);
      this.head.add(lockTop);

      const lockWave = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), M.hair);
      lockWave.scale.set(1, 1.45, 0.8);
      lockWave.position.set(side * 0.32, -0.44, 0.0);
      lockWave.rotation.z = side * -0.18;   // onda hacia adentro
      this.head.add(lockWave);
    }

    // Melena trasera larga.
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), M.hair);
    back.scale.set(1.1, 1.38, 0.85);
    back.position.set(0, -0.3, -0.2);
    this.head.add(back);
  }

  _buildFace(M) {
    // Ojos grandes y brillantes estilo chibi (la clave de la ternura): blanco +
    // iris marron grande + pupila + dos brillos + delineado superior. Se arman
    // apilados en Z para que se vean "pintados" sobre la cara.
    for (const side of [-1, 1]) {
      const EX = side * 0.17, EY = -0.03, EZ = 0.32;

      // Blanco del ojo (esclera): ovalo alto y suave.
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 18), M.white);
      sclera.scale.set(0.9, 1.25, 0.42);
      sclera.position.set(EX, EY, EZ);
      this.head.add(sclera);

      // Iris marron grande (ocupa casi todo el alto del ojo).
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 18), M.eye);
      iris.scale.set(1, 1.15, 0.5);
      iris.position.set(EX, EY - 0.012, EZ + 0.055);
      this.head.add(iris);

      // Pupila.
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 14), M.pupil);
      pupil.scale.set(1, 1.1, 0.5);
      pupil.position.set(EX, EY - 0.012, EZ + 0.085);
      this.head.add(pupil);

      // Brillos: uno grande arriba-adentro y otro chico abajo-afuera (mirada dulce).
      const hi1 = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), M.white);
      hi1.position.set(EX - side * 0.035, EY + 0.055, EZ + 0.11);
      this.head.add(hi1);
      const hi2 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), M.white);
      hi2.position.set(EX + side * 0.04, EY - 0.06, EZ + 0.1);
      this.head.add(hi2);

      // Delineado/pestana superior: casquete oscuro fino que corona el ojo.
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.128, 18, 14), M.eye);
      lid.scale.set(0.92, 0.4, 0.45);
      lid.position.set(EX, EY + 0.11, EZ + 0.005);
      this.head.add(lid);

      // Pestanita en la esquina externa (pequeno flick).
      const flick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.014, 0.012), M.eye);
      flick.position.set(EX + side * 0.11, EY + 0.05, EZ + 0.02);
      flick.rotation.z = side * 0.5;
      this.head.add(flick);

      // Ceja suave y arqueada (capsula fina, color pelo).
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.11, 4, 8), M.brow);
      brow.rotation.z = Math.PI / 2 + side * 0.14;
      brow.position.set(EX, EY + 0.21, EZ + 0.04);
      this.head.add(brow);

      // Cachete sonrojado, mas grande y suave.
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), M.cheek);
      cheek.scale.set(1, 0.72, 0.25);
      cheek.position.set(side * 0.27, -0.16, 0.3);
      this.head.add(cheek);
    }

    // Naricita apenas insinuada.
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), M.skin);
    nose.scale.set(0.8, 0.7, 0.6);
    nose.position.set(0, -0.11, 0.42);
    this.head.add(nose);

    // Sonrisa pequena y tierna.
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 16, Math.PI), M.eye);
    smile.rotation.x = Math.PI;
    smile.scale.z = 0.4;
    smile.position.set(0, -0.22, 0.4);
    this.head.add(smile);
  }

  _buildEarrings(M) {
    for (const side of [-1, 1]) {
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), M.pearl);
      pearl.position.set(side * 0.42, -0.22, 0.02);
      this.head.add(pearl);
    }
  }

  // dt: delta time; speed01: rapidez de movimiento normalizada (0 quieto, 1 corriendo).
  update(dt, speed01) {
    // Balanceo de piernas/brazos al caminar.
    this.walkPhase += dt * (4 + speed01 * 8);
    const swing = Math.sin(this.walkPhase) * 0.5 * speed01;

    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.armL.rotation.x = -swing * 0.8;
    this.armR.rotation.x = swing * 0.8;

    // Idle-bob suave de la cabeza cuando esta quieta.
    const bob = Math.sin(performance.now() * 0.003) * 0.02 * (1 - speed01);
    this.head.position.y = 1.62 + bob;
  }
}
