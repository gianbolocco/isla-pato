import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CAMERA, RENDER, PROPS } from '../config.js';
import { Input } from './Input.js';
import { World } from '../world/World.js';
import { Player } from '../entities/Player.js';
import { makeToonGradient, toonify } from './toon.js';
import { loadProps } from '../world/Props.js';
import { Story } from '../game/Story.js';
import { SailCutscene } from '../game/SailCutscene.js';

// Orquesta escena, renderer, camara en 3ra persona, input y el loop principal.
export class Game {
  constructor(container) {
    this.container = container;

    // --- Renderer ---
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Tone mapping suave para un look más pulido y cálido.
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = RENDER.exposure;
    container.appendChild(this.renderer.domElement);

    // --- Escena y camara ---
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.fov, window.innerWidth / window.innerHeight, 0.1, 500,
    );

    // Estado de la camara orbital
    this.camYaw = Math.PI;   // detras del personaje al empezar
    this.camPitch = 0.35;

    // --- Mundo y jugador ---
    this.world = new World(this.scene);
    this.player = new Player(this.world);
    this.scene.add(this.player.mesh);

    // Look de dibujo (toon) en Belu.
    if (RENDER.toonCharacters) {
      const grad = makeToonGradient(RENDER.toonSteps);
      toonify(this.player.mesh, grad);
    }

    // --- Input (antes de la historia, que lo usa para interactuar con la tecla E) ---
    this.input = new Input(this.renderer.domElement);
    this.prevJump = false;

    // Coordinador de UI/pointer-lock: al abrir un diálogo/teclado se suelta el mouse
    // (para poder clickear) y al cerrarlo se vuelve a capturar. `uiActive` congela a Belu.
    this.uiActive = false;
    this._ui = {
      open: () => { this.uiActive = true; if (document.pointerLockElement) document.exitPointerLock(); },
      close: () => { this.uiActive = false; this.input.requestLock(); },
      active: () => this.uiActive,
    };

    // Cinemática de zarpe (Cala del Naufragio → barco pirata). `cutsceneActive` congela el
    // control normal (cámara/jugador) y deja que SailCutscene maneje cámara y barco.
    this.cutsceneActive = false;
    this.sailCutscene = new SailCutscene(this);

    // --- Historia (checkpoints): botella + mensaje + tablones + loro Juancho + reja ---
    this.story = new Story(this.scene, this.world, this.player, container, this._ui, this.input, this.sailCutscene);

    // Props decorativos (.glb gratis) apoyados en el suelo.
    loadProps(this.scene, this.world, PROPS);

    this._setupPostFX();

    // --- Reloj ---
    this.clock = new THREE.Clock();

    window.addEventListener('resize', () => this._onResize());
    this._reusableForward = new THREE.Vector3();
    this._reusableRight = new THREE.Vector3();
    this._moveDir = new THREE.Vector3();

    // Reusables para la colisión de cámara (evita crear objetos por frame).
    this._camTarget = new THREE.Vector3();
    this._camDir = new THREE.Vector3();
    this._camRay = new THREE.Ray();
    this._camHit = new THREE.Vector3();
  }

  _setupPostFX() {
    // EffectComposer: render normal -> bloom (brillo soñado) -> salida con tone mapping.
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    if (RENDER.bloom) {
      const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
      this.bloom = new UnrealBloomPass(size, RENDER.bloomStrength, RENDER.bloomRadius, RENDER.bloomThreshold);
      this.composer.addPass(this.bloom);
    }
    this.composer.addPass(new OutputPass());
  }

  start() {
    this.renderer.setAnimationLoop(() => this._tick());
  }

  _tick() {
    // dt acotado para evitar saltos gigantes si la pestaña estuvo en segundo plano.
    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Durante la cinemática, SailCutscene maneja cámara + barco; si no, control normal
    // (salvo con una UI abierta: diálogo/teclado, Belu congelada y mouse libre).
    if (this.cutsceneActive) {
      this.sailCutscene.update(dt);
    } else {
      if (!this.uiActive) {
        this._updateCameraLook();
        this._updatePlayer(dt);
      }
      this._updateCameraFollow();
    }
    this.world.update(dt);
    this.story.update(dt);

    this.composer.render();
  }

  _updateCameraLook() {
    const d = this.input.consumeMouseDelta();
    this.camYaw -= d.x * CAMERA.sensitivity;
    // invertY: mouse hacia abajo -> mirar hacia abajo (camara sube, mira al personaje).
    this.camPitch += d.y * CAMERA.sensitivity * (CAMERA.invertY ? -1 : 1);
    this.camPitch = THREE.MathUtils.clamp(this.camPitch, CAMERA.minPitch, CAMERA.maxPitch);
  }

  _updatePlayer(dt) {
    // Direccion de movimiento relativa a la camara (proyectada al plano XZ).
    const axis = this.input.moveAxis();

    this._reusableForward.set(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).normalize();
    // "derecha" = forward × up (mano derecha). Asi D va a la derecha de la pantalla y A a la izquierda.
    this._reusableRight.set(-this._reusableForward.z, 0, this._reusableForward.x);

    this._moveDir
      .set(0, 0, 0)
      .addScaledVector(this._reusableForward, axis.y)
      .addScaledVector(this._reusableRight, axis.x);
    if (this._moveDir.lengthSq() > 0) this._moveDir.normalize();

    const jumpDown = this.input.isDown('Space');
    const jumpPressed = jumpDown && !this.prevJump;
    this.prevJump = jumpDown;

    this.player.update(dt, this._moveDir, this.input.running, jumpPressed, jumpDown);
  }

  _updateCameraFollow() {
    // Objetivo: un punto un poco por encima del personaje.
    const target = this.player.position;
    const cp = Math.cos(this.camPitch);
    const offset = new THREE.Vector3(
      Math.sin(this.camYaw) * cp,
      Math.sin(this.camPitch),
      Math.cos(this.camYaw) * cp,
    ).multiplyScalar(-CAMERA.distance);

    this.camera.position.set(
      target.x + offset.x,
      target.y + CAMERA.height + offset.y,
      target.z + offset.z,
    );

    // Colisión de cámara: si hay una pared (collider) entre Belu y la cámara,
    // acercar la cámara hasta justo antes del obstáculo (clave para estar adentro
    // de la cabaña sin ver a través de las paredes).
    this._camTarget.set(target.x, target.y + CAMERA.height * 0.6, target.z);
    this._camDir.copy(this.camera.position).sub(this._camTarget);
    const wanted = this._camDir.length();
    if (wanted > 0.001) {
      this._camDir.divideScalar(wanted);           // normaliza
      this._camRay.set(this._camTarget, this._camDir);
      let best = wanted;
      for (const c of this.world.getColliders()) {
        if (this._camRay.intersectBox(c, this._camHit)) {
          const d = this._camHit.distanceTo(this._camTarget);
          if (d < best) best = d;
        }
      }
      if (best < wanted) {
        const dist = Math.max(1.2, best - 0.3);    // margen para no clipear
        this.camera.position.copy(this._camTarget).addScaledVector(this._camDir, dist);
      }
    }

    // Tope de piso: la camara nunca baja del suelo (isla) ni del mar.
    const groundBelow = this.world.groundHeightAt(this.camera.position.x, this.camera.position.z);
    const floorY = (groundBelow !== null ? groundBelow : this.world.seaLevel) + 0.6;
    if (this.camera.position.y < floorY) this.camera.position.y = floorY;

    this.camera.lookAt(target.x, target.y + CAMERA.height * 0.6, target.z);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
    if (this.bloom) this.bloom.setSize(window.innerWidth, window.innerHeight);
  }
}
