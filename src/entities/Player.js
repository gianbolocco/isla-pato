import * as THREE from 'three';
import { PHYSICS, MOVE, JUMP, PLAYER, AVATAR } from '../config.js';
import { BeluModel } from './BeluModel.js';
import { BeluAvatar } from './BeluAvatar.js';

// Controlador cinematico de Belu.
// - Integra gravedad y velocidad manualmente (mejor "feel" que un motor de fisicas).
// - Colision AABB resuelta eje por eje contra las cajas del mundo + suelo en y=0.
// - Salto con coyote-time, jump-buffer, doble salto y salto variable.
//
// `position` es el CENTRO del collider. El modelo se dibuja desde los pies,
// por eso se offsetea media altura hacia abajo.

export class Player {
  constructor(world) {
    this.world = world;

    this.half = new THREE.Vector3(PLAYER.width / 2, PLAYER.height / 2, PLAYER.depth / 2);
    this.position = new THREE.Vector3(PLAYER.spawn.x, PLAYER.spawn.y, PLAYER.spawn.z);
    this.velocity = new THREE.Vector3();

    this.grounded = false;
    this.facing = 0;                 // yaw del modelo (radianes)
    this.checkpoint = null;          // último checkpoint (respawn); si null, usa PLAYER.spawn

    // Temporizadores de salto
    this.timeSinceGrounded = 999;
    this.jumpBufferedFor = 0;
    this.canDoubleJump = false;
    this.jumpHeld = false;

    // Modelo visual: avatar con rig (Ready Player Me) o modelo de primitivas.
    // BeluAvatar cae solo en el de primitivas si el .glb no está disponible.
    this.belu = AVATAR.enabled ? new BeluAvatar() : new BeluModel();
    this.mesh = this.belu.object3d;
    this._syncMesh();
  }

  get feetY() { return this.position.y - this.half.y; }

  // moveDir: THREE.Vector3 en el plano XZ (world space, normalizado o cero).
  // running: bool. jumpPressed: bool (flanco). jumpHeld: bool (mantenido).
  update(dt, moveDir, running, jumpPressed, jumpHeld) {
    this._handleJumpInput(jumpPressed, jumpHeld);
    this._applyHorizontal(dt, moveDir, running);
    this._applyGravity(dt);
    this._resolveJump();
    this._move(dt);
    this._updateFacing(dt, moveDir);

    // Anima el modelo segun la rapidez horizontal.
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    const speed01 = THREE.MathUtils.clamp(horizSpeed / MOVE.runSpeed, 0, 1);
    this.belu.update(dt, speed01);

    this._syncMesh();

    // Red de seguridad: si se hunde en el mar, respawnea en la isla.
    if (this.position.y < this.world.killY) this.respawn();
  }

  _handleJumpInput(jumpPressed, jumpHeld) {
    if (jumpPressed) this.jumpBufferedFor = JUMP.bufferTime;
    this.jumpHeld = jumpHeld;
  }

  _applyHorizontal(dt, moveDir, running) {
    const targetSpeed = running ? MOVE.runSpeed : MOVE.walkSpeed;
    const targetVX = moveDir.x * targetSpeed;
    const targetVZ = moveDir.z * targetSpeed;

    const hasInput = moveDir.lengthSq() > 0.0001;
    let accel;
    if (this.grounded) {
      accel = hasInput ? MOVE.acceleration : MOVE.groundFriction;
    } else {
      accel = MOVE.airAcceleration;
    }

    this.velocity.x = approach(this.velocity.x, targetVX, accel * dt);
    this.velocity.z = approach(this.velocity.z, targetVZ, accel * dt);
  }

  _applyGravity(dt) {
    this.velocity.y += PHYSICS.gravity * dt;
    if (this.velocity.y < PHYSICS.maxFallSpeed) this.velocity.y = PHYSICS.maxFallSpeed;

    // Salto variable: al soltar espacio mientras sube, se corta el impulso.
    if (!this.jumpHeld && this.velocity.y > 0) {
      this.velocity.y *= JUMP.cutMultiplier;
    }
  }

  _resolveJump() {
    // Descuenta timers en _move (usa dt); aca decidimos si saltamos.
    const canGroundJump = this.timeSinceGrounded <= JUMP.coyoteTime;

    if (this.jumpBufferedFor > 0) {
      if (canGroundJump) {
        this.velocity.y = JUMP.velocity;
        this.jumpBufferedFor = 0;
        this.timeSinceGrounded = 999;   // consume el coyote
        this.canDoubleJump = JUMP.doubleJump;
        this.grounded = false;
      } else if (this.canDoubleJump) {
        this.velocity.y = JUMP.doubleJumpVelocity;
        this.jumpBufferedFor = 0;
        this.canDoubleJump = false;
      }
    }
  }

  _move(dt) {
    // Avanza timers
    this.timeSinceGrounded += dt;
    this.jumpBufferedFor = Math.max(0, this.jumpBufferedFor - dt);

    const colliders = this.world.getColliders();
    const wasGrounded = this.grounded;
    this.grounded = false;

    // Posicion previa (para el limite de pendiente del terreno).
    const prevX = this.position.x;
    const prevZ = this.position.z;

    // Resolucion eje por eje: X, Z, luego Y (el orden Y al final ayuda a detectar suelo).
    this._moveAxis('x', this.velocity.x * dt, colliders);
    this._moveAxis('z', this.velocity.z * dt, colliders);

    // Limite de pendiente: si el terreno adelante sube demasiado empinado (un
    // acantilado entre terrazas), no se puede trepar -> se bloquea el avance y hay
    // que buscar el caminito. Escalones chicos (rocas, bordes) si se suben solos.
    const ahead = this.world.groundHeightAt(this.position.x, this.position.z);
    if (ahead !== null) {
      const horizDist = Math.hypot(this.position.x - prevX, this.position.z - prevZ);
      const allowed = Math.max(MOVE.stepHeight, MOVE.maxClimb * horizDist);
      if (ahead - this.feetY > allowed) {
        this.position.x = prevX;
        this.position.z = prevZ;
      }
    }

    this._moveAxis('y', this.velocity.y * dt, colliders);

    // Suelo del mundo (islas, incluida la altura de la montaña).
    const groundY = this.world.groundHeightAt(this.position.x, this.position.z);
    if (groundY !== null && this.feetY <= groundY && this.velocity.y <= 0) {
      this.position.y = groundY + this.half.y;
      this.velocity.y = 0;
      this.grounded = true;
    }

    if (this.grounded) {
      this.timeSinceGrounded = 0;
      this.canDoubleJump = JUMP.doubleJump;
    }

    // (wasGrounded queda disponible por si luego queremos sonidos de aterrizaje)
    void wasGrounded;
  }

  // Mueve un eje y resuelve colisiones contra las cajas (Box3).
  // Clave: al mover en X/Z, "encogemos" el collider en los OTROS ejes (skin) para
  // que el simple hecho de estar apoyado sobre la cara superior de una plataforma
  // NO cuente como choque horizontal. Asi se puede caminar arriba sin trabarse.
  _moveAxis(axis, delta, colliders) {
    if (delta === 0) return;
    this.position[axis] += delta;

    for (const c of colliders) {
      if (!this._overlaps(c, axis)) continue;

      if (delta > 0) {
        this.position[axis] = c.min[axis] - this.half[axis]; // topamos por el lado min
      } else {
        this.position[axis] = c.max[axis] + this.half[axis]; // topamos por el lado max
        if (axis === 'y') this.grounded = true;              // aterrizamos sobre la plataforma
      }
      if (axis === 'y') this.velocity.y = 0;
    }
  }

  // ¿La caja del jugador solapa el collider `c`? En los ejes distintos al que se
  // mueve, aplicamos un margen (skin) para ignorar contactos de simple roce/apoyo.
  _overlaps(c, moveAxis) {
    const skin = 0.03;
    for (const a of ['x', 'y', 'z']) {
      const s = a === moveAxis ? 0 : skin;
      const pMin = this.position[a] - this.half[a] + s;
      const pMax = this.position[a] + this.half[a] - s;
      if (pMin >= c.max[a] || pMax <= c.min[a]) return false;
    }
    return true;
  }

  _updateFacing(dt, moveDir) {
    if (moveDir.lengthSq() < 0.0001) return;
    const target = Math.atan2(moveDir.x, moveDir.z);
    // interpolacion angular corta hacia el objetivo
    let diff = target - this.facing;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.facing += diff * Math.min(1, MOVE.turnSpeed * dt);
  }

  _syncMesh() {
    // El modelo tiene los pies en y=0, asi que lo bajamos media altura.
    this.mesh.position.set(this.position.x, this.feetY, this.position.z);
    this.mesh.rotation.y = this.facing;
  }

  respawn() {
    if (this.checkpoint) this.position.copy(this.checkpoint);
    else this.position.set(PLAYER.spawn.x, PLAYER.spawn.y, PLAYER.spawn.z);
    this.velocity.set(0, 0, 0);
  }
}

// Mueve `current` hacia `target` como maximo `maxDelta` (sin pasarse).
function approach(current, target, maxDelta) {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return target;
}
