import * as THREE from 'three';

// Modelo 3D chibi de Alejandro (el papá de Belu), según la foto: pelo corto entrecano
// con entradas, barba corta gris, chaleco inflable azul marino sobre buzo gris con
// capucha, contextura de papá. Sostiene una caña de pescar. Estilo acorde a los demás.
//   - `object3d`: pies en y=0, mira a +Z.
//   - `update(dt)`: idle-bob suave.

const C = {
  skin: 0xe6bb93, skinSh: 0xd0a074,
  hair: 0x59564f, hairD: 0x413e38, beard: 0x8f8c83,
  brow: 0x4a463f, eye: 0x2f2016,
  vest: 0x22314f, vestSh: 0x1a2740,
  hoodie: 0x9a9ea3, hoodieSh: 0x83878c, collar: 0xe8e4da,
  pants: 0x3a3d44, shoe: 0x413d37,
  rod: 0x6e4b2a, reel: 0x2a2a2e, line: 0xf0f0f0,
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts });
}

export class AlejandroModel {
  constructor() {
    this.object3d = new THREE.Group();
    this.object3d.name = 'Alejandro';
    this.object3d.scale.setScalar(1.04);
    this._t = 0;
    this._build();
  }

  _build() {
    const M = {
      skin: mat(C.skin, { roughness: 0.6 }), skinSh: mat(C.skinSh),
      hair: mat(C.hair, { roughness: 0.7 }), hairD: mat(C.hairD, { roughness: 0.7 }),
      beard: mat(C.beard, { roughness: 1 }), brow: mat(C.brow), eye: mat(C.eye, { roughness: 0.4 }),
      vest: mat(C.vest, { roughness: 0.7 }), vestSh: mat(C.vestSh, { roughness: 0.7 }),
      hoodie: mat(C.hoodie, { roughness: 0.9 }), hoodieSh: mat(C.hoodieSh, { roughness: 0.9 }),
      collar: mat(C.collar, { roughness: 0.9 }), pants: mat(C.pants, { roughness: 0.9 }),
      shoe: mat(C.shoe, { roughness: 0.8 }), white: mat(0xffffff, { roughness: 0.25 }),
      pupil: mat(0x140d08, { roughness: 0.35 }),
    };
    this._mats = M;

    // Piernas.
    for (const x of [-0.2, 0.2]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.7, 14), M.pants);
      leg.position.set(x, 0.35, 0); leg.castShadow = true;
      this.object3d.add(leg);
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), M.shoe);
      shoe.scale.set(1, 0.6, 1.4); shoe.position.set(x, 0.06, 0.08);
      this.object3d.add(shoe);
    }

    // Panza / torso: buzo gris (base) + chaleco azul encima (más ancho, acolchado).
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 16), M.hoodie);
    belly.scale.set(1, 1.15, 0.85); belly.position.y = 1.0; belly.castShadow = true;
    this.object3d.add(belly);
    const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.42, 0.66, 18), M.vest);
    vest.position.y = 1.02; vest.castShadow = true;
    this.object3d.add(vest);
    // Costuras del acolchado del chaleco.
    for (const yy of [0.82, 1.02, 1.22]) {
      const seam = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.02, 6, 20), M.vestSh);
      seam.rotation.x = Math.PI / 2; seam.position.y = yy;
      this.object3d.add(seam);
    }
    // Cierre del chaleco.
    const zip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.66, 0.02), M.vestSh);
    zip.position.set(0, 1.02, 0.4); this.object3d.add(zip);

    // Cuello + collar del buzo.
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.14, 12), M.collar);
    collar.position.y = 1.37; this.object3d.add(collar);
    // Capucha caída atrás.
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), M.hoodieSh);
    hood.scale.set(1.1, 0.7, 0.7); hood.position.set(0, 1.34, -0.22);
    this.object3d.add(hood);

    // Brazos (mangas grises del buzo). El derecho sostiene la caña (levantado).
    this.armL = this._buildArm(M, -0.42, 0.15);
    this.armR = this._buildArm(M, 0.42, -0.7);   // levantado adelante para la caña
    this.object3d.add(this.armL, this.armR);

    // Cabeza.
    this.head = new THREE.Group();
    this.head.position.y = 1.7;
    this.object3d.add(this.head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 20), M.skin);
    skull.castShadow = true; this.head.add(skull);
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 16), M.skin);
    jaw.scale.set(1, 0.72, 0.92); jaw.position.set(0, -0.17, 0.02);
    this.head.add(jaw);

    this._buildHair(M);
    this._buildFace(M);
    this._buildRod(M);

    this.object3d.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  _buildArm(M, x, lift) {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 1.2, 0);
    shoulder.rotation.x = lift;                      // levanta el brazo hacia adelante
    shoulder.rotation.z = x < 0 ? 0.12 : -0.12;
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.42, 6, 10), M.hoodie);
    sleeve.position.y = -0.28; shoulder.add(sleeve);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), M.skin);
    hand.position.y = -0.56; shoulder.add(hand);
    shoulder.userData.hand = hand;
    return shoulder;
  }

  _buildHair(M) {
    // Corona entrecana con entradas (deja frente despejada).
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.43, 20, 16), M.hair);
    cap.scale.set(1.02, 0.85, 1.02); cap.position.set(0, 0.16, -0.06);
    this.head.add(cap);
    // Costados/nuca.
    for (const side of [-1, 1]) {
      const temple = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), M.hairD);
      temple.scale.set(0.6, 0.9, 0.9); temple.position.set(side * 0.34, 0.02, -0.05);
      this.head.add(temple);
    }
    const nape = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), M.hairD);
    nape.scale.set(1.05, 0.7, 0.7); nape.position.set(0, -0.02, -0.28);
    this.head.add(nape);
  }

  _buildFace(M) {
    for (const side of [-1, 1]) {
      // Ojos.
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 14), M.white);
      sclera.scale.set(0.95, 1.0, 0.4); sclera.position.set(side * 0.17, -0.02, 0.34);
      this.head.add(sclera);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 12), M.eye);
      iris.scale.set(1, 1, 0.5); iris.position.set(side * 0.17, -0.02, 0.39);
      this.head.add(iris);
      const hi = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), M.white);
      hi.position.set(side * 0.15, 0.03, 0.42); this.head.add(hi);
      // Cejas pobladas entrecanas.
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.035, 0.02), M.brow);
      brow.position.set(side * 0.17, 0.13, 0.37); brow.rotation.z = side * -0.06;
      this.head.add(brow);
      // Patas de gallo (sonrisa marcada) — pequeño toque.
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), M.skinSh);
      cheek.scale.set(1, 0.5, 0.2); cheek.position.set(side * 0.24, -0.12, 0.3);
      this.head.add(cheek);
    }
    // Nariz (más grande).
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), M.skin);
    nose.scale.set(0.9, 0.9, 0.9); nose.position.set(0, -0.06, 0.42);
    this.head.add(nose);
    // Barba/bigote gris (patches aplanados).
    const beardMat = M.beard;
    const jawBeard = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), beardMat);
    jawBeard.scale.set(1, 0.55, 0.95); jawBeard.position.set(0, -0.24, 0.06);
    this.head.add(jawBeard);
    for (const side of [-1, 1]) {
      const side1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), beardMat);
      side1.scale.set(0.5, 0.9, 0.35); side1.position.set(side * 0.28, -0.12, 0.22);
      this.head.add(side1);
    }
    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.03), beardMat);
    mustache.position.set(0, -0.15, 0.39); this.head.add(mustache);
    // Sonrisa.
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16, Math.PI), M.eye);
    smile.rotation.x = Math.PI; smile.scale.z = 0.4; smile.position.set(0, -0.19, 0.38);
    this.head.add(smile);
  }

  _buildRod(M) {
    // La caña se arma en su propio grupo, anclado en la mano derecha (levantada) y
    // apuntando hacia arriba y sobre el agua (+Z). Así el mango queda en la mano y la
    // puntera bien alta, en vez de flotar al costado.
    const g = new THREE.Group();
    g.position.set(0.46, 0.82, 0.42);
    g.rotation.set(0.92, 0, -0.12);
    this.object3d.add(g);
    this._rod = g;

    const rodMat = mat(C.rod, { roughness: 0.55 });
    const darkMat = mat(0x4a3418, { roughness: 0.6 });
    const metalMat = mat(C.reel, { metalness: 0.45, roughness: 0.35 });
    const corkMat = mat(0xcaa06a, { roughness: 1 });

    // Mango de corcho + tapón.
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.36, 12), corkMat);
    grip.position.y = 0.1; g.add(grip);
    const butt = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), darkMat);
    butt.position.y = -0.09; g.add(butt);

    // Caña ahusada (gruesa en el mango → puntera fina).
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.04, 3.3, 10), rodMat);
    rod.position.y = 1.95; rod.castShadow = true; g.add(rod);

    // Carrete debajo del mango, con manija.
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), metalMat);
    reel.rotation.z = Math.PI / 2; reel.position.set(0.02, 0.34, -0.12); g.add(reel);
    const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.08, 12),
      mat(0x9a9aa0, { metalness: 0.4, roughness: 0.4 }));
    spool.rotation.z = Math.PI / 2; spool.position.set(0.02, 0.34, -0.12); g.add(spool);
    const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.11, 0.02), metalMat);
    crankArm.position.set(0.14, 0.34, -0.12); g.add(crankArm);
    const crankKnob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), corkMat);
    crankKnob.position.set(0.14, 0.4, -0.12); g.add(crankKnob);

    // Anillas guía a lo largo de la caña.
    for (const yy of [0.72, 1.3, 1.95, 2.55, 3.1]) {
      const guide = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 6, 12), metalMat);
      guide.rotation.x = Math.PI / 2; guide.position.set(0, yy, -0.03); g.add(guide);
    }

    // Tanza (línea) desde la puntera hasta una boya en el agua. Se dibuja en el espacio
    // del modelo (no del grupo rotado) para que cuelgue natural hacia el agua (+Z).
    const tip = new THREE.Vector3(0.89, 2.99, 3.26);        // puntera (según la rotación del grupo)
    const bob = new THREE.Vector3(0.2, -1.25, 10.5);        // boya flotando en el agua
    const dir = new THREE.Vector3().subVectors(bob, tip);
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, dir.length(), 5), mat(C.line, { roughness: 0.6 }));
    line.position.copy(tip).addScaledVector(dir, 0.5);
    line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    this.object3d.add(line);

    // Boya roja y blanca sobre el agua.
    const bobTop = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(0xd23b34, { roughness: 0.7 }));
    bobTop.position.copy(bob); this.object3d.add(bobTop);
    const bobBot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      mat(0xf4f4f4, { roughness: 0.7 }));
    bobBot.position.copy(bob); this.object3d.add(bobBot);
  }

  update(dt) {
    this._t += dt;
    this.head.position.y = 1.7 + Math.sin(this._t * 1.4) * 0.02;   // idle-bob
  }
}
