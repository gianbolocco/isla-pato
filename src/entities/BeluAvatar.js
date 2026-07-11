import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AVATAR } from '../config.js';
import { BeluModel } from './BeluModel.js';

// Avatar 3D con rig (pensado para Ready Player Me, pero sirve cualquier .glb
// humanoide con esqueleto tipo Mixamo). Cumple la MISMA interfaz que BeluModel:
//   - `object3d`  : grupo con los pies en y=0, mirando a +Z.
//   - `update(dt, speed01)` : anima según la rapidez normalizada.
//
// Diseño a prueba de fallos: mientras el .glb no cargó (o si falla), muestra el
// modelo de primitivas como fallback, así el juego NUNCA se queda sin personaje.
// Cuando el avatar carga, reemplaza el fallback y arranca la animación esquelética.

export class BeluAvatar {
  constructor() {
    this.object3d = new THREE.Group();
    this.object3d.name = 'BeluAvatar';

    // Nodo interno para aplicar escala / offset / giro sin ensuciar el grupo raíz
    // (el Player rota `object3d` para orientar a Belu; eso queda intacto).
    this.rig = new THREE.Group();
    this.rig.scale.setScalar(AVATAR.scale);
    this.rig.position.y = AVATAR.yOffset;
    this.rig.rotation.y = AVATAR.yawOffset;
    this.object3d.add(this.rig);

    // Fallback visible desde el primer frame (se ve mientras descarga el avatar).
    this._fallback = new BeluModel();
    this.object3d.add(this._fallback.object3d);

    this.mixer = null;
    this.actions = {};      // { idle, walk, run } -> THREE.AnimationAction
    this.current = null;    // acción activa
    this.ready = false;

    this._load();
  }

  async _load() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync(AVATAR.model);
      const avatar = gltf.scene;
      avatar.traverse((o) => {
        if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; }
      });

      // Reemplaza el fallback por el avatar real.
      this.object3d.remove(this._fallback.object3d);
      this._fallback = null;
      this.rig.add(avatar);

      // Mixer + carga de clips de animación (cada uno en su propio .glb).
      this.mixer = new THREE.AnimationMixer(avatar);
      await this._loadAnims(loader);

      this.ready = true;
      // Arranca en idle (o el primero que haya cargado).
      const first = this.actions.idle || this.actions.walk || this.actions.run;
      if (first) { first.play(); this.current = first; }
    } catch (err) {
      // Sin avatar: se queda el fallback de primitivas. Aviso en consola para debug.
      console.warn('[BeluAvatar] No se pudo cargar el avatar, usando modelo de primitivas.', err);
    }
  }

  async _loadAnims(loader) {
    const entries = Object.entries(AVATAR.anims); // [['idle', url], ...]
    const results = await Promise.allSettled(
      entries.map(([, url]) => loader.loadAsync(url)),
    );
    results.forEach((res, i) => {
      const [name] = entries[i];
      if (res.status !== 'fulfilled') {
        console.warn(`[BeluAvatar] Falta la animación "${name}" (${entries[i][1]}).`);
        return;
      }
      const clip = res.value.animations[0];
      if (!clip) return;
      const action = this.mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      this.actions[name] = action;
    });
  }

  // Cruza suavemente hacia la acción `next` (nombre en this.actions).
  _fadeTo(next) {
    const target = this.actions[next];
    if (!target || target === this.current) return;
    target.reset().setEffectiveWeight(1).fadeIn(AVATAR.fadeTime).play();
    if (this.current) this.current.fadeOut(AVATAR.fadeTime);
    this.current = target;
  }

  update(dt, speed01) {
    if (!this.ready) {
      // Todavía cargando: animamos el fallback con el balanceo procedural.
      if (this._fallback) this._fallback.update(dt, speed01);
      return;
    }

    // Elige la animación según la rapidez y cruza hacia ella.
    let want = 'idle';
    if (speed01 >= AVATAR.runThreshold) want = 'run';
    else if (speed01 >= AVATAR.walkThreshold) want = 'walk';
    // Cae a lo que exista si falta el clip ideal.
    if (!this.actions[want]) want = this.actions.idle ? 'idle' : Object.keys(this.actions)[0];
    if (want) this._fadeTo(want);

    if (this.mixer) this.mixer.update(dt);
  }
}
