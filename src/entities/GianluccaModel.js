import * as THREE from 'three';
import { mat, walkAnimation } from './chibi.js';

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
  hair:   0x342a22,   // castano oscuro (no negro puro: así el toon muestra la forma)
  hairHi: 0x6b5a48,   // reflejo del pelo (bien más claro, para que se lea la textura)
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
      stubble: mat(COLORS.stubble, { roughness: 1, transparent: true, opacity: 0.55 }),
      cheek: mat(COLORS.cheek, { roughness: 1 }),
      shirt: mat(COLORS.shirt, { roughness: 0.8 }),
      shirtSh: mat(COLORS.shirtSh, { roughness: 0.8 }),
      pants: mat(COLORS.pants, { roughness: 0.9 }),
      shoe: mat(COLORS.shoe, { roughness: 0.7 }),
      sole: mat(COLORS.sole, { roughness: 0.9 }),
      white: mat(0xffffff, { roughness: 0.25 }),   // blanco del ojo
      pupil: mat(0x140d08, { roughness: 0.35 }),    // pupila
      beadDark: mat(0x2a211b, { roughness: 0.5 }),  // cuentas de madera oscura (collar)
      beadTan: mat(0xb5863f, { roughness: 0.4, metalness: 0.1 }),  // cuenta clara (ojo de tigre)
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
    this.headBaseY = 1.64;
    this.head.position.y = this.headBaseY;
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
    this._buildNecklace(M);

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
    // Pelo LACIO usado un poco despeinado: una capa suave y lisa (SIN bultos ni mechones que
    // sobresalgan), con la frente despejada y un flequillo barrido a un costado. La leve
    // asimetría de las capas da el "despeinado" sin romper que sea lacio.

    // Capa principal (bulk): lisa y aplastada, apoyada arriba/atrás.
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 28, 22), M.hair);
    cap.scale.set(1.02, 0.84, 1.05);
    cap.position.set(0, 0.24, -0.08);
    this.head.add(cap);
    // Segunda capa apenas corrida a un lado: rompe el casco perfecto (despeinado sutil).
    const cap2 = new THREE.Mesh(new THREE.SphereGeometry(0.43, 28, 22), M.hair);
    cap2.scale.set(1.0, 0.74, 1.02);
    cap2.position.set(0.06, 0.3, -0.05);
    this.head.add(cap2);

    // Nuca corta atrás (fade).
    const nape = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 16), M.hair);
    nape.scale.set(0.98, 0.6, 0.72);
    nape.position.set(0, 0.06, -0.2);
    this.head.add(nape);

    // Flequillo lacio que cae al frente y BARRE hacia un costado (deja ver la frente).
    const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 16), M.hair);
    fringe.scale.set(0.95, 0.32, 0.5);
    fringe.position.set(0.06, 0.34, 0.2);
    fringe.rotation.set(0.5, 0.0, -0.18);
    this.head.add(fringe);
    // Sheen/raya del pelo lacio (mechón claro y PLANO barrido al costado; no sobresale).
    const sweep = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 12), M.hairHi);
    sweep.scale.set(0.85, 0.2, 0.55);
    sweep.position.set(0.14, 0.42, 0.08);
    sweep.rotation.set(0.2, 0.0, -0.42);
    this.head.add(sweep);

    // Costados altos (fade): se ven las sienes, no baja como bowl.
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), M.hair);
      side.scale.set(0.45, 0.85, 0.85);
      side.position.set(s * 0.38, 0.2, -0.03);
      this.head.add(side);
    }
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

      // Ceja poblada (su sello) pero más prolija: capsula algo más fina y angulada.
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.12, 5, 10), M.brow);
      brow.rotation.z = Math.PI / 2 + side * 0.18;
      brow.position.set(EX, EY + 0.17, EZ + 0.03);
      this.head.add(brow);
      const browIn = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), M.brow);
      browIn.scale.set(1, 0.75, 0.4);
      browIn.position.set(side * 0.075, EY + 0.155, EZ + 0.03);
      this.head.add(browIn);

      // Sombra de la mejilla (barba de pocos dias, lateral).
      const beard = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), M.stubble);
      beard.scale.set(0.55, 0.7, 0.22);
      beard.position.set(side * 0.26, -0.2, 0.24);
      this.head.add(beard);

      // Patilla: baja desde el pelo por delante de la oreja hasta la barba.
      const sideburn = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.12, 4, 8), M.stubble);
      sideburn.position.set(side * 0.4, -0.04, 0.05);
      this.head.add(sideburn);
    }

    // Sombra de barba en la MANDIBULA: une las mejillas con el menton (barba de pocos dias
    // más marcada, como en la foto). Casquete fino que envuelve el contorno inferior.
    const jawBeard = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), M.stubble);
    jawBeard.scale.set(0.94, 0.52, 0.55);
    jawBeard.position.set(0, -0.26, 0.16);
    this.head.add(jawBeard);

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

  _buildNecklace(M) {
    // Collar de cuentas de madera oscuras con UNA cuenta clara (ojo de tigre) al frente,
    // como en la foto. Cuelga de la base del cuello y cae un poco al frente. Va en el cuerpo
    // (no en la cabeza), así no se mueve con el idle-bob.
    const g = new THREE.Group();
    g.position.set(0, 1.24, 0.04);   // base del cuello / clavícula
    const N = 16;
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2;
      const front = Math.max(0, Math.cos(a));           // 1 al frente (+Z), 0 a los costados/atrás
      const x = Math.sin(a) * 0.17;
      const z = Math.cos(a) * 0.15 + 0.06;
      const y = -0.02 - Math.pow(front, 1.4) * 0.14;    // cae hacia el frente-centro
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 10, 8), k === 0 ? M.beadTan : M.beadDark);  // k=0 = cuenta clara al frente
      bead.position.set(x, y, z);
      g.add(bead);
    }
    this.object3d.add(g);
  }

  // dt: delta time; speed01: rapidez normalizada (0 quieto, 1 corriendo).
  update(dt, speed01) { walkAnimation(this, dt, speed01); }
}
