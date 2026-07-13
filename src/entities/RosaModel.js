import * as THREE from 'three';

// Modelo 3D chibi de Rosa, la gata "esmoquin" de Belu: MAYORMENTE NEGRA con blanco en la
// carita (hocico/barbilla + blaze), el pecho y las patas (mediecitas), según la foto real.
// Orejas negras puntiagudas, ojos verdes, naricita rosa, bigotes y cola negra larga (hacia
// arriba con gancho) que se mece suave. Misma interfaz que los demás personajes.
//
//   - `object3d` : grupo con las patas en y=0, mirando a +Z (el hocico apunta a +Z).
//   - `update(dt, speed01)` : cola que se mece + respiración (idle). `tailPhase` lo usa el
//     manager para acelerar el movimiento de la cola cuando Rosa está contenta.

const COLORS = {
  black: 0x2a2a2f,   // negro (cuerpo, cabeza, cola, orejas)
  white: 0xf4f2ee,   // blanco (pecho, patas, carita)
  nose:  0xdf9aa6,   // naricita rosa
  eye:   0x6fae54,   // ojos verdes
  pupil: 0x1b1b1f,
  pink:  0xe7a9b3,   // interior de orejas
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.0, ...opts });
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
      black: mat(COLORS.black, { roughness: 1 }),
      white: mat(COLORS.white, { roughness: 1 }),
      nose: mat(COLORS.nose, { roughness: 0.7 }),
      eye: mat(COLORS.eye, { roughness: 0.3 }),
      pupil: mat(COLORS.pupil, { roughness: 0.3 }),
      hi: mat(0xffffff, { roughness: 0.25 }),
      pink: mat(COLORS.pink, { roughness: 0.8 }),
      whisker: mat(0xf0f0f0, { roughness: 0.6 }),
    };
    this._mats = M;

    // ---- Cuerpo negro (elipsoide esbelto) + pecho y panza blancos ----
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), M.black);
    body.scale.set(0.86, 0.76, 1.5);
    body.position.set(0, 0.42, -0.04);
    body.castShadow = true;
    this.object3d.add(body);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 14), M.white);
    chest.scale.set(0.82, 0.9, 0.8);
    chest.position.set(0, 0.4, 0.26);
    this.object3d.add(chest);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 14), M.white);
    belly.scale.set(0.7, 0.55, 1.15);
    belly.position.set(0, 0.28, 0.02);
    this.object3d.add(belly);

    // ---- Patas blancas (mediecitas) + patitas ----
    this._buildLeg(M, -0.13, 0.22);
    this._buildLeg(M, 0.13, 0.22);
    this._buildLeg(M, -0.13, -0.3);
    this._buildLeg(M, 0.13, -0.3);

    // ---- Cabeza negra con carita blanca ----
    this.head = new THREE.Group();
    this.head.position.set(0, 0.66, 0.36);
    this.object3d.add(this.head);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), M.black);
    skull.scale.set(1, 0.95, 0.95);
    skull.castShadow = true;
    this.head.add(skull);

    this._buildEars(M);
    this._buildFace(M);

    // ---- Cola negra (cadena de segmentos conectada a la grupa) ----
    this._buildTail(M);

    this.object3d.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  _buildLeg(M, x, z) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.058, 0.34, 10), M.white);
    leg.position.set(x, 0.17, z);
    leg.castShadow = true;
    this.object3d.add(leg);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), M.white);
    paw.scale.set(1, 0.7, 1.15);
    paw.position.set(x, 0.03, z + 0.02);
    this.object3d.add(paw);
  }

  _buildEars(M) {
    // Orejas negras puntiagudas (conos) con interior rosa.
    this.ears = [];
    for (const x of [-0.11, 0.11]) {
      const ear = new THREE.Group();
      ear.add(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 5), M.black));
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
    // Blanco de la carita: hocico + barbilla + un "blaze" que sube entre los ojos.
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 14), M.white);
    muzzle.scale.set(1.0, 0.72, 0.85);
    muzzle.position.set(0, -0.06, 0.17);
    this.head.add(muzzle);
    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 12), M.white);
    chin.scale.set(1, 0.7, 0.9);
    chin.position.set(0, -0.14, 0.12);
    this.head.add(chin);
    const blaze = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 12), M.white);
    blaze.scale.set(0.5, 1.15, 0.5);
    blaze.position.set(0, 0.05, 0.16);
    this.head.add(blaze);

    // Naricita rosa (triangulito) sobre el hocico blanco.
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.05, 4), M.nose);
    nose.rotation.x = Math.PI; nose.position.set(0, -0.02, 0.28);
    this.head.add(nose);

    // Ojos almendrados verdes + pupila vertical + brillo.
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 14), M.eye);
      eye.scale.set(0.95, 1.15, 0.6);
      eye.position.set(side * 0.095, 0.06, 0.15);
      this.head.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), M.pupil);
      pupil.scale.set(0.32, 0.95, 0.6);
      pupil.position.set(side * 0.095, 0.06, 0.175);
      this.head.add(pupil);
      const hi = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), M.hi);
      hi.position.set(side * 0.085, 0.1, 0.19);
      this.head.add(hi);
    }

    // Boquita (justo debajo de la naricita).
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 14, Math.PI), M.pupil);
    mouth.rotation.x = Math.PI; mouth.scale.z = 0.5; mouth.position.set(0, -0.075, 0.27);
    this.head.add(mouth);

    // Bigotes: 3 por lado.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.34, 4), M.whisker);
        w.rotation.z = Math.PI / 2;
        w.rotation.y = side * (0.5 - i * 0.28);
        w.position.set(side * 0.22, -0.05 + i * 0.03, 0.16);
        this.head.add(w);
      }
    }
  }

  _buildTail(M) {
    // Cadena de segmentos anidados: arranca en la grupa, sube inclinada hacia atrás y la
    // punta se engancha adelante (cola felina en alto). Cada segmento cuelga del anterior,
    // así queda SIEMPRE conectada. La animación mece el grupo base (no se despega).
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.4, -0.52);   // en la grupa, detrás del cuerpo
    this.object3d.add(this.tail);

    const N = 7, segLen = 0.15;
    let parent = this.tail;
    for (let i = 0; i < N; i++) {
      const g = new THREE.Group();
      g.position.y = i === 0 ? 0 : segLen;
      // Perfil de la curva: base inclinada atrás → casi recta hacia arriba → gancho al final.
      g.rotation.x = i === 0 ? -0.6 : (i >= N - 2 ? 0.55 : 0.05);
      const r0 = Math.max(0.035, 0.08 - i * 0.008);
      const r1 = Math.max(0.03, 0.08 - (i + 1) * 0.008);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen + 0.03, 8), M.black);
      seg.position.y = segLen / 2;
      seg.castShadow = true;
      g.add(seg);
      parent.add(g);
      parent = g;
    }
  }

  // dt: delta time; speed01: rapidez normalizada (de NPC queda ~0).
  update(dt, speed01 = 0) {
    if (this._baseY === undefined) this._baseY = this.object3d.position.y;

    // Cola: mecida suave del grupo base (queda conectada), más viva si está contenta.
    this.tailPhase += dt * (2.2 + speed01 * 4);
    this.tail.rotation.z = Math.sin(this.tailPhase) * 0.16;
    this.tail.rotation.y = Math.sin(this.tailPhase * 0.6) * 0.12;

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
