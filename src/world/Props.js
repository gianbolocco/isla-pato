import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Cargador de props (objetos decorativos .glb, ej. de Poly Pizza / Kenney / Quaternius).
// Cada prop se define en config (PROPS) y se apoya solo sobre el suelo del mundo.
// Los archivos van en public/models/props/ (ver public/models/README.md).
//
// Es async y a prueba de fallos: si un .glb no está, se avisa por consola y el resto
// del mundo sigue andando. No bloquea el arranque del juego.

export function loadProps(scene, world, props) {
  if (!props || props.length === 0) return;
  const loader = new GLTFLoader();
  const cache = new Map(); // reusar el mismo .glb clonándolo (barato)

  for (const p of props) {
    const get = cache.get(p.model)
      || loader.loadAsync(p.model).then((gltf) => {
        gltf.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        return gltf.scene;
      });
    cache.set(p.model, get);

    get.then((template) => {
      const obj = template.clone(true);
      const gy = world.groundHeightAt(p.x, p.z);
      obj.position.set(p.x, (gy ?? 0) + (p.y || 0), p.z);
      obj.rotation.y = p.rotY ?? Math.random() * Math.PI * 2;
      obj.scale.setScalar(p.scale ?? 1);
      scene.add(obj);
    }).catch((err) => {
      console.warn(`[Props] No se pudo cargar ${p.model}`, err);
    });
  }
}
