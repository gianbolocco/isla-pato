import * as THREE from 'three';

// Modelo 3D chibi del Capitán Lulu, el villano bobo-adorable: gordito, gorro pirata negro con
// calavera, rubio de pelo corto, barbita, parche en un ojo y naricita colorada (comedia).
// Estilo primitivas como Belu/Gian/Rosa. Mira a +Z.
//
//   - `object3d` : grupo con los pies en y=0.
//   - `update(dt)` : idle (respiración/vaivén) o animación de DERROTA si se lo noqueó.
//   - `knockOut()` : lo manda a volar hacia atrás (−X) y cae de espaldas (cómico, no violento).
//   - `isDown()` : true una vez que quedó tumbado.

const C = {
  coat:  0x7a1f2b,   // casaca bordó
  coatD: 0x5e1621,
  pants: 0x2c2c34,
  boot:  0x1c1c1f,
  skin:  0xf0c49a,
  hair:  0xd9b45a,   // rubio
  beard: 0xc79a4a,
  hat:   0x17171c,   // gorro negro
  gold:  0xcaa25c,
  nose:  0xd8695f,   // naricita colorada
  patch: 0x121216,
  white: 0xf2efe6,
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...opts });
}

export class LuluModel {
  constructor() {
    this.object3d = new THREE.Group();
    this.object3d.name = 'CapitanLulu';
    this._t = 0;
    this._ko = false; this._koT = 0; this._down = false;
    this._build();
  }

  _build() {
    const M = {
      coat: mat(C.coat, { roughness: 1 }), coatD: mat(C.coatD, { roughness: 1 }),
      pants: mat(C.pants, { roughness: 1 }), boot: mat(C.boot, { roughness: 0.8 }),
      skin: mat(C.skin), hair: mat(C.hair, { roughness: 1 }), beard: mat(C.beard, { roughness: 1 }),
      hat: mat(C.hat, { roughness: 0.8 }), gold: mat(C.gold, { metalness: 0.3, roughness: 0.5 }),
      nose: mat(C.nose), patch: mat(C.patch, { roughness: 0.5 }), white: mat(C.white),
    };

    // Piernas cortas + botas.
    for (const x of [-0.22, 0.22]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 10), M.pants);
      leg.position.set(x, 0.3, 0); this.object3d.add(leg);
      const boot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), M.boot);
      boot.scale.set(1, 0.7, 1.4); boot.position.set(x, 0.1, 0.06); this.object3d.add(boot);
    }

    // Panza (casaca) — gordito.
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 16), M.coat);
    belly.scale.set(1, 1.05, 0.95); belly.position.set(0, 1.0, 0); belly.castShadow = true;
    this.object3d.add(belly);
    const lapel = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), M.coatD);
    lapel.scale.set(0.7, 1.0, 0.5); lapel.position.set(0, 1.05, 0.34); this.object3d.add(lapel);
    // Cinturón + hebilla dorada.
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.16, 20), M.boot);
    belt.position.set(0, 0.72, 0); this.object3d.add(belt);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.06), M.gold);
    buckle.position.set(0, 0.72, 0.56); this.object3d.add(buckle);

    // Brazos cortos.
    for (const s of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.6, 10), M.coat);
      arm.position.set(s * 0.6, 1.05, 0); arm.rotation.z = s * 0.5; this.object3d.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M.skin);
      hand.position.set(s * 0.82, 0.78, 0); this.object3d.add(hand);
    }

    // ---- Cabeza ----
    this.head = new THREE.Group();
    this.head.position.set(0, 1.7, 0);
    this.object3d.add(this.head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), M.skin);
    skull.castShadow = true; this.head.add(skull);
    // Pelo rubio corto (casquete) por atrás/costados.
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.44, 18, 14), M.hair);
    hair.scale.set(1, 0.9, 1); hair.position.set(0, 0.08, -0.05); this.head.add(hair);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.43, 16, 12), M.skin);
    face.scale.set(0.9, 0.9, 0.7); face.position.set(0, -0.02, 0.16); this.head.add(face);

    // Barbita rubia.
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), M.beard);
    beard.scale.set(0.9, 0.7, 0.6); beard.position.set(0, -0.28, 0.2); this.head.add(beard);

    // Ojo bueno (derecha) + ceja.
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), mat(0x201a14));
    eye.position.set(0.15, 0.04, 0.37); this.head.add(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.03), M.hair);
    brow.position.set(0.15, 0.13, 0.38); this.head.add(brow);
    // Parche en el otro ojo (izquierda) + correa.
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), M.patch);
    patch.position.set(-0.15, 0.05, 0.38); this.head.add(patch);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.02, 6, 24), M.patch);
    strap.rotation.y = 0.2; strap.position.set(0, 0.08, 0); this.head.add(strap);

    // Naricita colorada + cachetes + boca.
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), M.nose);
    nose.position.set(0, -0.04, 0.42); this.head.add(nose);
    for (const s of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0xe89b8a));
      cheek.position.set(s * 0.24, -0.1, 0.34); this.head.add(cheek);
    }
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 14, Math.PI), mat(0x5a2f28));
    mouth.rotation.x = Math.PI; mouth.position.set(0, -0.16, 0.36); this.head.add(mouth);

    // ---- Gorro pirata negro (bicornio) con calavera ----
    const hat = new THREE.Group();
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.34, 16), M.hat);
    crown.position.y = 0.12; hat.add(crown);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.08, 20), M.hat);
    brim.scale.set(1, 1, 1.5); brim.position.y = -0.02; hat.add(brim);
    const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.11, 14), M.white);
    emblem.position.set(0, 0.14, 0.34); hat.add(emblem);
    hat.position.set(0, 0.42, 0); this.head.add(hat);

    this.object3d.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  knockOut() {
    if (this._ko) return;
    this._ko = true; this._koT = 0;
    this._koFrom = this.object3d.position.clone();
    this._koYaw = this.object3d.rotation.y;
  }

  isDown() { return this._down; }

  update(dt) {
    this._t += dt;
    if (this._ko) {
      // Vuela hacia atrás (−X) en arco y da vueltas; al aterrizar queda de espaldas.
      this._koT = Math.min(1, this._koT + dt * 0.7);
      const p = this._koT;
      this.object3d.position.set(
        this._koFrom.x - p * 4.5,
        this._koFrom.y + Math.sin(Math.PI * p) * 4.5,
        this._koFrom.z + Math.sin(p * 6) * 0.6,
      );
      this.object3d.rotation.set(-p * Math.PI * 2.5, this._koYaw, p * 0.6);
      if (this._koT >= 1) {
        this._down = true;
        this.object3d.rotation.set(-Math.PI / 2, this._koYaw, 0);   // tumbado de espaldas
        this.object3d.position.y = this._koFrom.y;
      }
      return;
    }
    // Idle: respiración + vaivén amenazante.
    this.head.rotation.z = Math.sin(this._t * 1.5) * 0.05;
    this.object3d.position.y = (this._baseY ?? (this._baseY = this.object3d.position.y)) + Math.sin(this._t * 2) * 0.03;
  }
}
