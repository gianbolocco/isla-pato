import * as THREE from 'three';

// Modelo 3D chibi de Nemo, el caniche blanco toy de Belu (segun la foto de referencia).
// Prioridad: que se lea como PERRO (silueta clara con formas suaves), no como nube de
// esferas. Rulos al minimo: solo el copete de la cabeza y la cola-pompón (el sello del
// caniche). Estilo tierno acorde a Belu/Gianlucca; recibe toon shading desde Game.
//
// Interfaz comun:
//   - `object3d` : grupo con las patas en y=0, mirando a +Z (el hocico apunta a +Z).
//   - `update(dt, speed01)` : cola que menea + respiracion suave (idle).

const COLORS = {
  fur:   0xf3f1ec,   // blanco calido
  furSh: 0xe4dfd4,   // sombra suave del pelo
  nose:  0x181513,   // naricita negra
  eye:   0x201812,   // ojos oscuros
  mouth: 0x201812,
  tongue:0xe79b95,   // lengueta rosa
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.0, ...opts });
}

export class NemoModel {
  constructor() {
    this.object3d = new THREE.Group();
    this.object3d.name = 'Nemo';

    this.wagPhase = 0;
    this._build();
  }

  _build() {
    const M = {
      fur: mat(COLORS.fur, { roughness: 1 }),
      furSh: mat(COLORS.furSh, { roughness: 1 }),
      nose: mat(COLORS.nose, { roughness: 0.5 }),
      eye: mat(COLORS.eye, { roughness: 0.3 }),
      white: mat(0xffffff, { roughness: 0.25 }),
      tongue: mat(COLORS.tongue, { roughness: 0.85 }),
    };
    this._mats = M;

    // ---- Cuerpo: un elipsoide alargado (torso claro) ----
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), M.fur);
    body.scale.set(0.92, 0.82, 1.42);
    body.position.set(0, 0.44, -0.05);
    body.castShadow = true;
    this.object3d.add(body);

    // Grupa trasera un poco mas voluminosa (forma de perrito sentadito atras).
    const rump = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), M.fur);
    rump.scale.set(0.95, 0.95, 0.9);
    rump.position.set(0, 0.42, -0.34);
    this.object3d.add(rump);

    // Pecho/hombros que levantan hacia el cuello.
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), M.fur);
    chest.scale.set(0.95, 1.0, 0.9);
    chest.position.set(0, 0.5, 0.2);
    this.object3d.add(chest);

    // ---- Patas (4 cilindros cortos + patita) ----
    this._buildLeg(M, -0.14, 0.2);   // delantera izq
    this._buildLeg(M, 0.14, 0.2);    // delantera der
    this._buildLeg(M, -0.14, -0.32); // trasera izq
    this._buildLeg(M, 0.14, -0.32);  // trasera der

    // ---- Cabeza ----
    this.head = new THREE.Group();
    this.head.position.set(0, 0.7, 0.32);
    this.object3d.add(this.head);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), M.fur);
    skull.scale.set(1, 0.98, 1);
    skull.castShadow = true;
    this.head.add(skull);

    // Copete de caniche: 3 bultitos suaves arriba (unico rulo notorio de la cabeza).
    for (let i = -1; i <= 1; i++) {
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), i === 0 ? M.fur : M.furSh);
      tuft.position.set(i * 0.11, 0.18, 0.02);
      tuft.scale.set(1, 0.85, 1);
      this.head.add(tuft);
    }

    this._buildEars(M);
    this._buildFace(M);

    // ---- Cola: pompón que menea ----
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.52, -0.5);
    this.object3d.add(this.tail);
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.14, 8), M.fur);
    stub.rotation.x = -0.7;
    stub.position.set(0, 0.05, 0);
    this.tail.add(stub);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), M.fur);
    pom.position.set(0, 0.14, -0.05);
    this.tail.add(pom);

    this.object3d.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  _buildLeg(M, x, z) {
    const front = z > 0;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.34, 10), M.fur);
    leg.position.set(x, 0.17, z);
    leg.castShadow = true;
    this.object3d.add(leg);
    // Patita redondeada.
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), M.fur);
    paw.scale.set(1, 0.7, 1.2);
    paw.position.set(x, 0.03, z + (front ? 0.03 : 0.0));
    this.object3d.add(paw);
  }

  _buildEars(M) {
    // Orejas largas y caidas a los costados de la cabeza (elipsoides suaves).
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), M.furSh);
      ear.scale.set(0.62, 1.5, 0.85);
      ear.position.set(side * 0.19, -0.1, -0.01);
      ear.rotation.z = side * 0.28;
      this.head.add(ear);
    }
  }

  _buildFace(M) {
    // Hocico corto y definido hacia adelante (base de la carita).
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 14), M.fur);
    muzzle.scale.set(0.85, 0.72, 1.0);
    muzzle.position.set(0, -0.06, 0.17);
    this.head.add(muzzle);

    // Naricita negra en la punta, con brillo.
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 12), M.nose);
    nose.scale.set(1.1, 0.85, 0.9);
    nose.position.set(0, -0.03, 0.3);
    this.head.add(nose);
    const noseHi = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), M.white);
    noseHi.position.set(-0.02, 0.01, 0.33);
    this.head.add(noseHi);

    // Ojos: botones oscuros bien ubicados al frente de la cara, sobre el hocico.
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 14), M.eye);
      eye.scale.set(0.95, 1.05, 0.75);
      eye.position.set(side * 0.095, 0.06, 0.16);
      this.head.add(eye);

      // Brillo grande (mirada tierna).
      const hi = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), M.white);
      hi.position.set(side * 0.08, 0.1, 0.2);
      this.head.add(hi);
    }

    // Boquita sonriente bajo la nariz.
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 8, 16, Math.PI), M.mouth);
    smile.rotation.x = Math.PI;
    smile.scale.z = 0.5;
    smile.position.set(0, -0.13, 0.26);
    this.head.add(smile);
    // Lengueta asomando.
    const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), M.tongue);
    tongue.scale.set(1, 0.45, 1.1);
    tongue.position.set(0, -0.15, 0.27);
    this.head.add(tongue);
  }

  // dt: delta time; speed01: rapidez normalizada (de NPC queda ~0).
  update(dt, speed01 = 0) {
    // Recuerda la altura donde lo puso el juego (para el bob de respiracion).
    if (this._baseY === undefined) this._baseY = this.object3d.position.y;

    // La colita menea (mas rapido si se mueve).
    this.wagPhase += dt * (9 + speed01 * 8);
    this.tail.rotation.z = Math.sin(this.wagPhase) * 0.5;

    // Respiracion / cabecita suave (idle).
    const t = performance.now() * 0.003;
    this.head.rotation.z = Math.sin(t) * 0.025;
    this.object3d.position.y = this._baseY + Math.sin(t * 1.3) * 0.012;
  }
}
