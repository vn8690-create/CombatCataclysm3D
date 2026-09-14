// Result scene. Shows win/lose and offers retry / next / menu.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';
import { STAGE_MAP, STAGES } from '../config/stages.js';

export class ResultScene {
  constructor(game, result) {
    this.game = game;
    this.result = result;
  }

  enter() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a14);

    const w = window.innerWidth, h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(BALANCE.CAMERA_FOV, w / h, 0.1, 100);
    this.camera.position.set(0, 4, 10);
    this.camera.lookAt(0, 1, 0);

    const hemi = new THREE.HemisphereLight(this.result.win ? 0xffcc88 : 0x8866aa, 0x222244, 0.7);
    this.scene.add(hemi);

    if (this.result.win) {
      this.icon = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 1.6, 6),
        new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0x442200, metalness: 0.8, roughness: 0.2 })
      );
      this.icon.position.set(0, 2.5, -1);
    } else {
      this.icon = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.9, 0),
        new THREE.MeshStandardMaterial({ color: 0x884444, emissive: 0x220000, roughness: 0.6 })
      );
      this.icon.position.set(0, 2.5, -1);
    }
    this.scene.add(this.icon);

    this._buildUI();
  }

  _buildUI() {
    const ui = this.game.ui;
    const r = this.result;
    const stage = STAGE_MAP[r.stageId];
    const nextStage = STAGES.find(s => s.id === r.stageId + 1);
    const nextUnlocked = nextStage && this.game.save.unlockedStages.includes(nextStage.id);

    ui.innerHTML = `
      <div class="screen">
        <h1 style="color: ${r.win ? '#ffcc44' : '#ff5566'}; -webkit-text-fill-color: ${r.win ? '#ffcc44' : '#ff5566'};">
          ${r.win ? 'VICTORY!' : 'DEFEAT'}
        </h1>
        <h2>${stage ? stage.name : 'Stage ' + r.stageId}</h2>
        ${r.win ? `<div class="subtitle">💰 Reward: +${r.moneyEarned} · Treasury: ${this.game.save.money || 0}</div>` : `<div class="subtitle">Your base was destroyed. Try again!</div>`}
        <div class="row" style="margin-top: 16px;">
          <button class="btn primary" id="btnRetry">↻ Retry</button>
          ${r.win && nextStage ? `<button class="btn success" id="btnNext" ${nextUnlocked ? '' : 'disabled'}>Next ▶</button>` : ''}
          <button class="btn" id="btnStages">Stages</button>
          <button class="btn" id="btnUpgrade">Upgrades</button>
          <button class="btn" id="btnMenu">Menu</button>
        </div>
      </div>
    `;

    document.getElementById('btnRetry').onclick = () => this.game.startBattle(r.stageId);
    const btnNext = document.getElementById('btnNext');
    if (btnNext) btnNext.onclick = () => this.game.startBattle(r.stageId + 1);
    document.getElementById('btnStages').onclick = () => this.game.goto('stage_select');
    document.getElementById('btnUpgrade').onclick = () => this.game.goto('upgrade');
    document.getElementById('btnMenu').onclick = () => this.game.goto('menu');
  }

  update(dt) {
    if (this.icon) {
      this.icon.rotation.y += dt * 1.2;
      this.icon.position.y = 2.5 + Math.sin(performance.now() * 0.002) * 0.15;
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
