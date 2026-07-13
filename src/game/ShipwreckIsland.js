import * as THREE from 'three';
import { NemoModel } from '../entities/NemoModel.js';
import { playLines } from './conversation.js';
import { ShipPartsField } from './ShipPartsField.js';
import { NAUFRAGIO } from '../config.js';

// Misión de la Isla 5 (Cala del Naufragio): Belu reencuentra a NEMO, junta MATERIALES por la
// isla (madera/tela/soga/brea) y después REPARA el barco encallado en 4 ESTACIONES (parchar el
// casco → cubierta+timón → vela → calafatear+botar). Al botar, el barco se desliza al agua;
// después Belu EMBARCA. Expone: talked, allCollected, tally, stationLabel, launched, aboard.

export class ShipwreckIsland {
  constructor(scene, world, player, container, messageBox, dialogue, ui, interaction) {
    this.world = world;
    this.player = player;
    this.messageBox = messageBox;
    this.dialogue = dialogue;
    this.ui = ui;

    this.talked = false;
    this.aboard = false;
    this._station = 0;         // estación de reparación actual
    this._launchClicked = false;

    const N = world.naufragio;

    // Nemo cerca de la llegada, mirando a la orilla oeste.
    const gy = world.groundHeightAt(N.nemo.x, N.nemo.z) ?? 0;
    this.nemo = new NemoModel();
    this.nemo.object3d.position.set(N.nemo.x, gy, N.nemo.z);
    this.nemo.object3d.rotation.y = -Math.PI / 2;
    scene.add(this.nemo.object3d);

    this.parts = new ShipPartsField(scene, world);

    // Marcadores brillantes de las estaciones (visibles sólo en la estación actual).
    this._markers = N.stations.map((st) => {
      const m = this._makeMarker();
      m.position.set(st.x, (world.groundHeightAt(st.x, st.z) ?? 0) + st.y, st.z);
      m.userData.baseY = m.position.y;
      m.visible = false;
      scene.add(m);
      return m;
    });
    this._t = 0;

    // 1) Saludar a Nemo → arranca la misión (aparecen los materiales).
    interaction.add({
      pos: () => N.nemo,
      radius: NAUFRAGIO.nemo.talkRadius,
      prompt: () => `Apretá <b>E</b> para saludar a ${NAUFRAGIO.nemoName} 🐶`,
      enabled: () => !this.talked,
      onInteract: () => this._greetNemo(),
    });

    // 2) Estaciones de reparación (secuenciales; requieren todos los materiales juntados).
    N.stations.forEach((st, i) => {
      interaction.add({
        pos: () => ({ x: st.x, z: st.z }),
        radius: NAUFRAGIO.stationRadius,
        prompt: () => st.label,
        enabled: () => this.parts.allCollected && this._station === i && !this._launchClicked,
        onInteract: () => this._doStation(i, st),
      });
    });

    // 3) Embarcar: barco a flote y todavía no zarpaste.
    interaction.add({
      pos: () => N.ship,
      radius: NAUFRAGIO.boardRadius,
      prompt: () => 'Apretá <b>E</b> para embarcar ⚓',
      enabled: () => this.world.shipwreckLaunched && !this.aboard,
      onInteract: () => this._board(),
    });
  }

  get allCollected() { return this.parts.allCollected; }
  get launched() { return this.world.shipwreckLaunched; }
  get stationsDone() { return this._launchClicked; }
  // Etiqueta de la estación actual (para el objetivo del HUD).
  get stationLabel() {
    if (this._launchClicked) return this.world.shipwreckLaunched ? '' : 'El barco se desliza al agua… 🌊';
    const st = this.world.naufragio.stations[this._station];
    return st ? st.label : '';
  }
  // Texto del progreso de materiales para el HUD (🪵2/4 🧵0/2 …).
  tally() {
    return NAUFRAGIO.materials.map((m) => `${m.emoji}${this.parts.countOf(m.kind)}/${m.count}`).join('  ');
  }

  update(dt) {
    this._t += dt;
    this.nemo.update(dt);
    if (this.talked) this.nemo.wagPhase += dt * 4;
    this.parts.update(dt, this.player.position);
    // Marcador de la estación actual: visible + flotando/girando.
    for (let i = 0; i < this._markers.length; i++) {
      const on = this.parts.allCollected && i === this._station && !this._launchClicked;
      const m = this._markers[i];
      m.visible = on;
      if (on) { m.rotation.y += dt * 2; m.position.y = m.userData.baseY + Math.sin(this._t * 3) * 0.15; }
    }
  }

  _greetNemo() {
    playLines(this.dialogue, this.ui, NAUFRAGIO.nemoName, NAUFRAGIO.reunion, () => {
      this.talked = true;
      this.parts.spawn(this.world.naufragio.materialItems);   // aparecen los materiales
    });
  }

  _doStation(i, st) {
    for (const order of st.installs) this.world.installShipPart(order);
    if (st.launch) { this.world.launchShipwreck(); this._launchClicked = true; }
    this._station = i + 1;
  }

  _board() {
    this.aboard = true;
    this.messageBox.show(NAUFRAGIO.boardTitle, NAUFRAGIO.boardMessage);
  }

  _makeMarker() {
    const g = new THREE.Group();
    const mat = (c, e) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: 2.2, flatShading: true });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), mat(0xffffff, 0x39d0ff));
    gem.position.y = 0.4; g.add(gem);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 20), mat(0xbfeeff, 0x39d0ff));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.1; g.add(ring);
    g.userData.baseY = 0;   // se fija al posicionar (ver abajo)
    return g;
  }
}
