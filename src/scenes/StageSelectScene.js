// Stage select grid scene.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';
import { STAGES } from '../config/stages.js';

export class StageSelectScene {
  constructor(game) {
    this.game = game;
  }

  enter() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a14);
    this.scene.fog = new THREE.Fog(0x0a0a14, 16, 40);

    const w = window.innerWidth, h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(BALANCE.CAMERA_FOV, w / h, 0.1, 100);
    this.camera.position.set(0, 5, 14);
    this.camera.lookAt(0, 1, 0);

    const hemi = new THREE.HemisphereLight(0x99aaff, 0x222244, 0.6);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffeecc, 0.8);
    dir.position.set(4, 8, 6);
    this.scene.add(dir);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 10),
      new THREE.MeshStandardMaterial({ color: 0x121628, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    this.tiles3D = [];
    for (let i = 0; i < STAGES.length; i++) {
      const t = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshStandardMaterial({
          color: STAGES[i].isBossStage ? 0xaa3030 : 0x3a4278,
          emissive: STAGES[i].isBossStage ? 0x441010 : 0x101224,
          roughness: 0.5
        })
      );
      t.position.set(-9 + i * 2, 1.5, -3);
      t.userData.phase = i * 0.3;
      this.scene.add(t);
      this.tiles3D.push(t);
    }

    this._buildUI();
  }

  _buildUI() {
    const ui = this.game.ui;
    const save = this.game.save;
    const tiles = STAGES.map(s => {
      const unlocked = save.unlockedStages.includes(s.id);
      const cleared = !!save.clearedStages[s.id];
      const cls = ['stageTile'];
      if (!unlocked) cls.push('locked');
      if (s.isBossStage) cls.push('boss');
      const star = cleared ? '★' : (unlocked ? '○' : '🔒');
      return `<div class="${cls.join(' ')}" data-stage="${s.id}">
        <div>${s.id}</div>
        <div class="star">${star}</div>
      </div>`;
    }).join('');

    ui.innerHTML = `
      <div class="screen">
        <h2>Stage Select</h2>
        <div class="subtitle">Tap a stage to begin · ★ = cleared · 🔒 = locked</div>
        <div class="stageGrid">${tiles}</div>
        <div class="row" style="margin-top: 12px;">
          <button class="btn" id="btnBack">Back</button>
          <button class="btn success" id="btnUpgrade">Upgrades (💰 ${save.money || 0})</button>
        </div>
      </div>
    `;

    ui.querySelectorAll('.stageTile').forEach(el => {
      el.onclick = () => {
        const sid = parseInt(el.dataset.stage, 10);
        if (!save.unlockedStages.includes(sid)) {
          this.game.showToast('Stage locked');
          return;
        }
        this.game.startBattle(sid);
      };
    });
    document.getElementById('btnBack').onclick = () => this.game.goto('menu');
    document.getElementById('btnUpgrade').onclick = () => this.game.goto('upgrade');
  }

  update(dt) {
    for (const t of this.tiles3D) {
      t.userData.phase += dt;
      t.position.y = 1.5 + Math.sin(t.userData.phase) * 0.15;
      t.rotation.y += dt * 0.4;
    }
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  onResize(w, h) {
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  exit() {
    if (this.scene) {
      this.scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    this.scene = null;
  }
}
