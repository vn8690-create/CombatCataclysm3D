// Main menu scene.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';
import { STAGE_MAP } from '../config/stages.js';

export class MenuScene {
  constructor(game) {
    this.game = game;
  }

  enter() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a14);
    this.scene.fog = new THREE.Fog(0x0a0a14, 14, 36);

    const w = window.innerWidth, h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(BALANCE.CAMERA_FOV, w / h, 0.1, 100);
    this.camera.position.set(0, 4, 12);
    this.camera.lookAt(0, 1, 0);

    const hemi = new THREE.HemisphereLight(0x8899ff, 0x222244, 0.7);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffeecc, 1.0);
    dir.position.set(5, 10, 6);
    this.scene.add(dir);

    this.cubes = [];
    for (let i = 0; i < 14; i++) {
      const size = 0.6 + Math.random() * 0.8;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.5, 0.55), roughness: 0.5 })
      );
      cube.position.set(-14 + i * 2 + Math.random(), 1 + Math.random() * 2, -3 - Math.random() * 2);
      cube.userData.speed = 0.4 + Math.random() * 0.6;
      cube.userData.bob = Math.random() * Math.PI * 2;
      this.scene.add(cube);
      this.cubes.push(cube);
    }

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 6),
      new THREE.MeshStandardMaterial({ color: 0x181c2e, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.position.z = -1;
    this.scene.add(ground);

    this._buildUI();
  }

  _buildUI() {
    const ui = this.game.ui;
    const boken = this.game.boken;
    const route = boken?.getRoute();
    const node = boken?.getCurrentNode();
    ui.innerHTML = `
      <div class="screen">
        <h1>COMBAT CATACLYSM 3D</h1>
        <div class="subtitle">Comedy-first lane defense · now with a world tour</div>
        <div class="row" style="flex-wrap:wrap;">
          <button class="btn primary" id="btnPlay">Quick Battle</button>
          <button class="btn" id="btnStages">Stage Select</button>
          <button class="btn success" id="btnBoken">🌍 Bōken</button>
          <button class="btn" id="btnUpgrade">Upgrades</button>
        </div>
        <div style="margin-top:16px; padding:14px 18px; border-radius:18px; background:rgba(255,255,255,.04); max-width:620px; text-align:center;">
          <div style="font-weight:800;">Current adventure</div>
          <div class="subtitle" style="margin-top:5px;">${route ? route.name : 'No route selected'}${node ? ` · 📍 ${node.title}` : ''}</div>
        </div>
        <div class="row" style="margin-top: 12px;">
          <button class="btn" id="btnReset">Reset Save</button>
        </div>
        <div class="subtitle" style="margin-top: 18px; max-width: 520px; text-align: center;">
          Battle directly when you want a quick fight, or enter Bōken to travel through comedy regions, recruit characters and unlock encounters.
        </div>
        <div class="subtitle" style="font-size: 11px; color: #667;">Press D to toggle debug panel · Mobile-friendly</div>
      </div>
    `;
    document.getElementById('btnPlay').onclick = () => {
      const unlocked = this.game.save.unlockedStages.filter(id => STAGE_MAP[id]);
      const target = unlocked.length ? unlocked[unlocked.length - 1] : 1;
      this.game.startBattle(target);
    };
    document.getElementById('btnStages').onclick = () => this.game.goto('stage_select');
    document.getElementById('btnBoken').onclick = () => this.game.goto('boken');
    document.getElementById('btnUpgrade').onclick = () => this.game.goto('upgrade');
    document.getElementById('btnReset').onclick = () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        this.game.resetProgress();
        this.game.showToast('Save reset');
        this._buildUI();
      }
    };
  }

  update(dt) {
    for (const c of this.cubes) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 14) c.position.x = -14;
      c.userData.bob += dt * 2;
      c.position.y = 1 + Math.abs(Math.sin(c.userData.bob)) * 0.6;
      c.rotation.y += dt * 0.5;
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
