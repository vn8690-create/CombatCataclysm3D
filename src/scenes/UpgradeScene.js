// Upgrade menu scene. Buy permanent upgrades with saved money.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';
import { UPGRADES, costFor } from '../config/upgrades.js';

export class UpgradeScene {
  constructor(game) {
    this.game = game;
  }

  enter() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a14);

    const w = window.innerWidth, h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(BALANCE.CAMERA_FOV, w / h, 0.1, 100);
    this.camera.position.set(0, 3, 10);
    this.camera.lookAt(0, 1, 0);

    const hemi = new THREE.HemisphereLight(0x99aaff, 0x222244, 0.6);
    this.scene.add(hemi);

    this.gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.2),
      new THREE.MeshStandardMaterial({ color: 0xffcc66, roughness: 0.2, metalness: 0.7, emissive: 0x442200 })
    );
    this.gem.position.set(0, 3, -2);
    this.scene.add(this.gem);

    this._buildUI();
  }

  _buildUI() {
    const ui = this.game.ui;
    const save = this.game.save;

    const items = UPGRADES.map(up => {
      const lvl = save.upgrades[up.id] || 0;
      const maxed = lvl >= up.maxLevel;
      const cost = maxed ? 0 : costFor(up, lvl);
      const canBuy = !maxed && (save.money || 0) >= cost;
      return `
        <div class="upgradeItem">
          <div class="info">
            <div class="n">${up.name} <span class="lvl">Lv ${lvl}/${up.maxLevel}</span></div>
            <div class="d">${up.desc}</div>
          </div>
          <button class="btn ${canBuy ? 'success' : ''}" data-up="${up.id}" ${maxed || !canBuy ? 'disabled' : ''}>
            ${maxed ? 'MAX' : `💰 ${cost}`}
          </button>
        </div>
      `;
    }).join('');

    ui.innerHTML = `
      <div class="screen">
        <h2>Upgrades</h2>
        <div class="subtitle">💰 Treasury: <span id="moneyDisp">${save.money || 0}</span> · Permanent boosts</div>
        <div class="upgradeList">${items}</div>
        <div class="row" style="margin-top: 12px;">
          <button class="btn" id="btnBack">Back</button>
          <button class="btn" id="btnResetUp">Reset Upgrades</button>
        </div>
      </div>
    `;

    ui.querySelectorAll('button[data-up]').forEach(btn => {
      btn.onclick = () => this._buy(btn.dataset.up);
    });
    document.getElementById('btnBack').onclick = () => this.game.goto('menu');
    document.getElementById('btnResetUp').onclick = () => {
      if (confirm('Refund all upgrades? Money is NOT refunded.')) {
        save.upgrades = {};
        this.game.persistSave();
        this._buildUI();
      }
    };
  }

  _buy(upgradeId) {
    const up = UPGRADES.find(u => u.id === upgradeId);
    if (!up) return;
    const save = this.game.save;
    const lvl = save.upgrades[up.id] || 0;
    if (lvl >= up.maxLevel) return;
    const cost = costFor(up, lvl);
    if ((save.money || 0) < cost) {
      this.game.showToast('Not enough money');
      return;
    }
    save.money -= cost;
    save.upgrades[up.id] = lvl + 1;
    this.game.persistSave();
    this.game.showToast(`${up.name} → Lv ${lvl + 1}`);
    this._buildUI();
  }

  update(dt) {
    if (this.gem) {
      this.gem.rotation.y += dt * 0.8;
      this.gem.rotation.x += dt * 0.3;
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
