import * as THREE from 'three';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...opts });
}

// Loro estilo guacamayo (Juancho) parado sobre una RAMA. Más realista: cuerpo rojo,
// alas azules con banda amarilla, cola larga, parche de cara claro y pico ganchudo.
// Origen (y=0) a la altura de la rama; mira hacia +Z. `userData.head` para el bob.
export function makeParrot() {
  const g = new THREE.Group();
  const red = mat(0xcf2f2a), redD = mat(0xa8241f);
  const blue = mat(0x2f6fd8), yellow = mat(0xe8b21e);
  const beakPale = mat(0xe8e2d0, { roughness: 0.5 }), beakDark = mat(0x2a2320, { roughness: 0.4 });
  const face = mat(0xf3ece0), dark = mat(0x1a1410, { roughness: 0.3 }), white = mat(0xf8f8f8);
  const bark = mat(0x6e4b2a, { flatShading: true }), claw = mat(0x3a352e);

  // Poste de madera que sostiene la rama (así Juancho no queda flotando): baja hasta
  // el piso —la rama queda a ~1.9 sobre el suelo— con un cap arriba y una escuadra de
  // refuerzo. Se entierra un poco para que el bob del loro no lo despegue del suelo.
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.2, 9), bark);
  post.position.set(0.05, -1.05, -0.02); post.castShadow = true; g.add(post);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.13, 9), bark);
  cap.position.set(0.05, 0.03, -0.02); g.add(cap);
  const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.72, 7), bark);
  brace.position.set(0.34, -0.32, 0); brace.rotation.z = 0.8; brace.castShadow = true; g.add(brace);

  // Rama (perca) sobre el poste + ramita.
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.7, 7), bark);
  branch.rotation.z = Math.PI / 2; branch.rotation.y = 0.12; branch.castShadow = true;
  g.add(branch);
  const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.55, 6), bark);
  twig.position.set(-0.5, 0.12, 0.08); twig.rotation.z = 1.0; g.add(twig);

  // Patitas agarrando la rama.
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.14, 6), claw);
    leg.position.set(s * 0.08, 0.1, 0.02); g.add(leg);
  }

  // Cuerpo (rojo, erguido).
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 16), red);
  body.scale.set(1, 1.5, 1.05); body.position.y = 0.5; body.castShadow = true;
  g.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), redD);
  chest.scale.set(0.85, 1.2, 0.5); chest.position.set(0, 0.46, 0.2);
  g.add(chest);

  // Alas plegadas (azul + banda amarilla).
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), blue);
    wing.scale.set(0.42, 1.5, 0.8); wing.position.set(s * 0.26, 0.52, -0.03); wing.castShadow = true;
    g.add(wing);
    const band = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), yellow);
    band.scale.set(0.42, 0.5, 0.8); band.position.set(s * 0.28, 0.28, -0.05);
    g.add(band);
  }

  // Cola larga (guacamayo): plumas rojas + azul, hacia atrás-abajo.
  for (let i = 0; i < 3; i++) {
    const feather = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 0.03), i === 1 ? blue : red);
    feather.position.set((i - 1) * 0.08, 0.12, -0.3); feather.rotation.x = 0.5; feather.castShadow = true;
    g.add(feather);
  }

  // Cabeza.
  const head = new THREE.Group();
  head.position.set(0, 0.92, 0.08);
  g.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 16), red);
  skull.castShadow = true; head.add(skull);
  for (const s of [-1, 1]) {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), face);
    patch.scale.set(0.7, 0.9, 0.5); patch.position.set(s * 0.1, 0.02, 0.16); head.add(patch);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), white);
    eye.scale.z = 0.6; eye.position.set(s * 0.12, 0.05, 0.22); head.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), dark);
    pupil.position.set(s * 0.13, 0.05, 0.26); head.add(pupil);
  }
  // Pico grande curvo: mandíbula superior clara ganchuda + inferior oscura.
  const beakUp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), beakPale);
  beakUp.scale.set(0.75, 0.9, 1.0); beakUp.position.set(0, -0.02, 0.22); head.add(beakUp);
  const hook = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.17, 8), beakPale);
  hook.rotation.x = Math.PI + 0.5; hook.position.set(0, -0.13, 0.29); head.add(hook);
  const beakLow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), beakDark);
  beakLow.scale.set(0.7, 0.5, 0.8); beakLow.position.set(0, -0.13, 0.2); head.add(beakLow);

  g.userData.head = head;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
