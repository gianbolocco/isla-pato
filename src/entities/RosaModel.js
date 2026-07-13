import * as THREE from 'three';

// Modelo 3D chibi de Rosa, la gata blanca y negra de Belu (bicolor / "esmoquin"): cuerpo
// blanco con manchas negras (lomo, media carita y una oreja), orejas puntiagudas, ojitos
// verdes, naricita rosa, bigotes y cola larga que se mueve (swish, no menea). Estilo tierno
// acorde a Belu/Gianlucca; recibe toon shading desde Game si estuviera activo.
//
// Interfaz común (igual que los demás personajes):
//   - `object3d` : grupo con las patas en y=0, mirando a +Z (el hocico apunta a +Z).
//   - `update(dt, speed01)` : cola que se mueve + respiración suave (idle). `tailPhase` la
//     usa el manager para acelerar el movimiento cuando Rosa está contenta.

const COLORS = {
  fur:   0xf4f2ee,   // blanco
  black: 0x2b2b30,   // manchas negras
  nose:  0xdf9aa6,   // naricita rosa
  eye:   0x6fae54,   // ojos verdes
  pupil: 0x1c1c20,
  pink:  0xe7a9b3,   // interior de orejas
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.0, ...opts });
}

export class RosaModel {
  constructor() {
    this.object3d = new THREE.Group();
    this.object3d.name = 'Rosa';
    this.tailPhase = 0;
    this._earTwitch = 0;
    this._build();
  }

  _build() {
    const M = {
      fur: mat(COLORS.fur, { roughness: 1 }),
      black: mat(COLORS.black, { roughness: 1 }),
      nose: mat(COLORS.nose, { roughness: 0.7 }),
      eye: mat(COLORS.eye, { roughness: 0.3 }),
      pupil: mat(COLORS.pupil, { roughness: 0.3 }),
      white: mat(0xffffff, { roughness: 0.25 }),
      pink: mat(COLORS.pink, { roughness: 0.8 }),
      whisker: mat(0xf0f0f0, { roughness: 0.6 }),
    };
    this._mats = M;

    // ---- Cuerpo: elipsoide esbelto (más felino que el perro) ----
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), M.fur);
    body.scale.set(0.86, 0.74, 1.5);
    body.position.set(0, 0.42, -0.04);
    body.castShadow = true;
    this.object3d.add(body);

    // Mancha negra del lomo (esmoquin).
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.23, 18, 14), M.black);
    back.scale.set(0.82, 0.62, 1.3);
    back.position.set(0, 0.52, -0.1);
    this.object3d.add(back);

    // Pecho blanco que sube al cuello.
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 14), M.fur);
    chest.scale.set(0.9, 0.95, 0.85);
    chest.position.set(0, 0.46, 0.24);
    this.object3d.add(chest);

    // ---- Patas (4 cilindros finos + patita) ----
    this._buildLeg(M, -0.13, 0.22);
    this._buildLeg(M, 0.13, 0.22);
    this._buildLeg(M, -0.13, -0.3);
    this._buildLeg(M, 0.13, -0.3);

    // ---- Cabeza ----
    this.head = new THREE.Group();
    this.head.position.set(0, 0.66, 0.36);
    this.object3d.add(this.head);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), M.fur);
    skull.scale.set(1, 0.95, 0.95);
    skull.castShadow = true;
    this.head.add(skull);

    // Media carita negra (esmoquin): mancha sobre la mitad izquierda/arriba de la cabeza.
    const mask = new THREE.Mesh(new THREE.SphereGeometry(0.205, 18, 14), M.black);
    mask.scale.set(0.62, 0.9, 0.98);
    mask.position.set(-0.12, 0.03, 0.0);
    this.head.add(mask);

    this._buildEars(M);
    this._buildFace(M);

    // ---- Cola larga que se mueve (punta negra) ----
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.5, -0.56);
    this.object3d.add(this.tail);
    const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.36, 8), M.fur);
    seg1.position.set(0, 0.16, 0); seg1.rotation.x = -0.5; this.tail.add(seg1);
    const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.34, 8), M.black);
    seg2.position.set(0, 0.42, 0.05); seg2.rotation.x = -1.1; this.tail.add(seg2);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), M.black);
    tip.position.set(0, 0.56, 0.18); this.tail.add(tip);

    this.object3d.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  _buildLeg(M, x, z) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.058, 0.34, 10), M.fur);
    leg.position.set(x, 0.17, z);
    leg.castShadow = true;
    this.object3d.add(leg);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), M.fur);
    paw.scale.set(1, 0.7, 1.15);
    paw.position.set(x, 0.03, z + 0.02);
    this.object3d.add(paw);
  }

  _buildEars(M) {
    // Orejas puntiagudas (conos) — la izquierda negra, la derecha blanca (bicolor).
    this.ears = [];
    for (const x of [-0.11, 0.11]) {
      const ear = new THREE.Group();
      const outerCone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 5), x < 0 ? M.black : M.fur);
      ear.add(outerCone);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 5), M.pink);
      inner.position.set(0, -0.01, 0.03); ear.add(inner);
      ear.position.set(x, 0.19, 0.02);
      ear.rotation.z = x < 0 ? 0.2 : -0.2;
      ear.rotation.x = -0.12;
      this.head.add(ear);
      this.ears.push(ear);
    }
  }

  _buildFace(M) {
    // Hocico chato felino.
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 14), M.fur);
    muzzle.scale.set(1.0, 0.7, 0.8);
    muzzle.position.set(0, -0.06, 0.17);
    this.head.add(muzzle);

    // Naricita rosa (triangulito).
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.05, 4), M.nose);
    nose.rotation.x = Math.PI; nose.position.set(0, -0.02, 0.27);
    this.head.add(nose);

    // Ojos almendrados verdes + pupila vertical + brillo.
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 14), M.eye);
      eye.scale.set(0.95, 1.15, 0.6);
      eye.position.set(side * 0.09, 0.05, 0.16);
      this.head.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), M.pupil);
      pupil.scale.set(0.32, 0.95, 0.6);
      pupil.position.set(side * 0.09, 0.05, 0.185);
      this.head.add(pupil);
      const hi = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), M.white);
      hi.position.set(side * 0.08, 0.1, 0.2);
      this.head.add(hi);
    }

    // Boquita.
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 14, Math.PI), M.pupil);
    mouth.rotation.x = Math.PI; mouth.scale.z = 0.5; mouth.position.set(0, -0.14, 0.24);
    this.head.add(mouth);

    // Bigotes: 3 por lado, cilindros finos hacia afuera.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.34, 4), M.whisker);
        w.rotation.z = Math.PI / 2;
        w.rotation.y = side * (0.5 - i * 0.28);
        w.position.set(side * 0.24, -0.05 + i * 0.03, 0.18);
        this.head.add(w);
      }
    }
  }

  // dt: delta time; speed01: rapidez normalizada (de NPC queda ~0).
  update(dt, speed01 = 0) {
    if (this._baseY === undefined) this._baseY = this.object3d.position.y;

    // La cola se mueve de lado a lado (swish felino), más rápido si se mueve/está contenta.
    this.tailPhase += dt * (2.6 + speed01 * 5);
    this.tail.rotation.y = Math.sin(this.tailPhase) * 0.6;
    this.tail.rotation.z = Math.sin(this.tailPhase * 0.5) * 0.12;

    // Respiración / cabecita suave (idle) + parpadeo de orejas cada tanto.
    const t = performance.now() * 0.003;
    this.head.rotation.z = Math.sin(t) * 0.02;
    this.object3d.position.y = this._baseY + Math.sin(t * 1.3) * 0.01;
    this._earTwitch += dt;
    if (this._earTwitch > 2.5 + Math.random() * 2 && this.ears) {
      this.ears[Math.floor(Math.random() * this.ears.length)].rotation.x = -0.12 - 0.25;
      this._earTwitch = 0;
    } else if (this.ears) {
      for (const e of this.ears) e.rotation.x += (-0.12 - e.rotation.x) * Math.min(1, dt * 8);
    }
  }
}
