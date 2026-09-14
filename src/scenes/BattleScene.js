// Main battle scene. Sets up the 3D world, manages entities, and runs game loop logic.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';
import { UNITS, UNIT_MAP } from '../config/units.js';
import { ENEMY_MAP, BOSS_MAP } from '../config/enemies.js';
import { STAGE_MAP } from '../config/stages.js';
import { UPGRADES, defaultStats } from '../config/upgrades.js';

import { Base } from '../entities/Base.js';
import { Unit } from '../entities/Unit.js';
import { Enemy } from '../entities/Enemy.js';

import { CombatSystem } from '../systems/CombatSystem.js';
import { WaveManager } from '../systems/WaveManager.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { VFXSystem } from '../systems/VFXSystem.js';
import { DebugSystem } from '../systems/DebugSystem.js';
import { CombatFeelSystem } from '../systems/CombatFeelSystem.js';

export class BattleScene {
  constructor(game, stageId) {
    this.game = game;
    this.stageId = stageId;
    this.stage = STAGE_MAP[stageId] || STAGE_MAP[1];
  }

  enter() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1024);
    this.scene.fog = new THREE.Fog(0x0d1024, 18, 42);

    const w = window.innerWidth, h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(BALANCE.CAMERA_FOV, w / h, 0.1, 100);
    this.camera.position.set(BALANCE.CAMERA_POS.x, BALANCE.CAMERA_POS.y, BALANCE.CAMERA_POS.z);
    this.camera.lookAt(BALANCE.CAMERA_LOOK.x, BALANCE.CAMERA_LOOK.y, BALANCE.CAMERA_LOOK.z);

    const hemi = new THREE.HemisphereLight(0x99aaff, 0x222244, 0.6);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff0cc, 1.1);
    dir.position.set(4, 12, 8);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -16;
    dir.shadow.camera.right = 16;
    dir.shadow.camera.top = 6;
    dir.shadow.camera.bottom = -6;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 30;
    this.scene.add(dir);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(BALANCE.LANE_LENGTH + 8, BALANCE.LANE_WIDTH),
      new THREE.MeshStandardMaterial({ color: 0x1a2038, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    for (let i = -5; i <= 5; i++) {
      const mark = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, BALANCE.LANE_WIDTH - 0.4),
        new THREE.MeshBasicMaterial({ color: 0x2a3050, transparent: true, opacity: 0.6 })
      );
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(i * 2, 0.01, 0);
      this.scene.add(mark);
    }

    for (let i = 0; i < 12; i++) {
      const bh = 1.5 + Math.random() * 2.5;
      const bw = 1.0 + Math.random() * 0.8;
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x141830, roughness: 0.9 })
      );
      b.position.set(-12 + i * 2.2, bh / 2, -3 - Math.random() * 1.5);
      this.scene.add(b);
    }

    this.stats = defaultStats();
    for (const up of UPGRADES) {
      const lvl = this.game.save.upgrades[up.id] || 0;
      if (lvl > 0) up.apply(this.stats, lvl);
    }

    this.playerBase = new Base({
      scene: this.scene, isPlayer: true,
      x: BALANCE.PLAYER_BASE_X,
      maxHp: Math.round(BALANCE.PLAYER_BASE_HP * this.stats.baseHpMul),
      vfx: null,
    });
    this.enemyBase = new Base({
      scene: this.scene, isPlayer: false,
      x: BALANCE.ENEMY_BASE_X,
      maxHp: BALANCE.ENEMY_BASE_HP,
      vfx: null,
    });

    this.vfx = new VFXSystem(this.scene);
    this.playerBase.vfx = this.vfx;
    this.enemyBase.vfx = this.vfx;
    this.combat = new CombatSystem(this.scene, this.vfx);
    this.combatFeel = new CombatFeelSystem(this.camera);
    this.economy = new EconomySystem(this.stats.startMoneyBonus, this.stats.moneyMul);
    this.waveManager = new WaveManager(
      this.scene, this.vfx, this.stageId,
      this.stage.enemyHpMul, this.stage.enemyAtkMul,
      (cfg, x, opts) => this._spawnEnemy(cfg, x, opts)
    );
    this.debug = new DebugSystem(this.game);

    this.units = [];
    this.enemies = [];
    this.deployCd = {};
    for (const u of UNITS) this.deployCd[u.id] = 0;

    this.time = 0;
    this.chaosActive = false;
    this.ended = false;
    this.paused = false;
    this.moneyEarnedThisBattle = 0;

    this._buildHUD();
    this._camBaseX = BALANCE.CAMERA_POS.x;
  }

  _spawnEnemy(config, x, opts = {}) {
    const e = new Enemy({
      scene: this.scene, vfx: this.vfx,
      config, x,
      hpMul: opts.hpMul || 1,
      atkMul: opts.atkMul || 1,
    });
    e.onSplit = (splitId, sx) => {
      const scfg = ENEMY_MAP[splitId];
      if (!scfg) return;
      this._spawnEnemy(scfg, sx, { hpMul: opts.hpMul, atkMul: opts.atkMul });
    };
    e.onSummon = (summonId, sx) => {
      const scfg = ENEMY_MAP[summonId] || BOSS_MAP[summonId];
      if (!scfg) return;
      this._spawnEnemy(scfg, sx, { hpMul: opts.hpMul * 0.6, atkMul: opts.atkMul * 0.8 });
    };
    this.enemies.push(e);
    return e;
  }

  _spawnUnit(unitConfig) {
    if (this.ended) return;
    const cdLeft = this.deployCd[unitConfig.id];
    if (cdLeft > 0) {
      this.game.showToast('Unit on cooldown');
      return;
    }
    if (!this.economy.canAfford(unitConfig.cost)) {
      this.game.showToast('Not enough money');
      return;
    }
    this.economy.spend(unitConfig.cost);
    this.deployCd[unitConfig.id] = Math.max(BALANCE.GLOBAL_DEPLOY_CD_FLOOR, unitConfig.deployCD * this.stats.cdMul);

    const u = new Unit({
      scene: this.scene, vfx: this.vfx,
      config: unitConfig, stats: this.stats,
      x: BALANCE.PLAYER_BASE_X + 1.5,
    });
    this.units.push(u);
  }

  _buildHUD() {
    const ui = this.game.ui;
    ui.innerHTML = `
      <div id="hud">
        <div id="hudTop">
          <div style="display:flex; flex-direction:column; gap:6px;">
            <div class="stat"><div class="label">💰 Money</div><div class="value" id="moneyVal">0</div></div>
            <div class="stat"><div class="label">⏱ Time</div><div class="value" id="timeVal">0s</div></div>
            <button class="btn" id="btnPause" style="font-size: 12px; padding: 6px 12px;">⏸ Pause</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
            <div class="stat"><div class="label">🌊 Wave</div><div class="value" id="waveVal">0</div></div>
            <button class="btn" id="btnQuit" style="font-size: 12px; padding: 6px 12px;">🚪 Quit</button>
          </div>
        </div>
        <div>
          <div id="bases">
            <div class="baseHp"><div class="fill" id="playerHpFill" style="width:100%"></div><div class="lbl" id="playerHpLbl">100%</div></div>
            <div class="baseHp enemy"><div class="fill" id="enemyHpFill" style="width:100%"></div><div class="lbl" id="enemyHpLbl">100%</div></div>
          </div>
          <div id="deployBar">
            ${UNITS.map(u => `
              <div class="deploySlot" data-unit="${u.id}">
                <div class="icon" style="background: linear-gradient(135deg, #${u.color.toString(16).padStart(6,'0')}, #${u.accent.toString(16).padStart(6,'0')});">${u.icon}</div>
                <div class="name">${u.name}</div>
                <div class="cost">💰${u.cost}</div>
                <div class="cd" id="cd_${u.id}"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    ui.querySelectorAll('.deploySlot').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.unit;
        const cfg = UNIT_MAP[id];
        if (cfg) this._spawnUnit(cfg);
      };
    });
    document.getElementById('btnPause').onclick = () => {
      this.paused = !this.paused;
      document.getElementById('btnPause').textContent = this.paused ? '▶ Resume' : '⏸ Pause';
      this.game.showToast(this.paused ? 'Paused' : 'Resumed');
    };
    document.getElementById('btnQuit').onclick = () => {
      if (confirm('Quit battle and return to menu?')) this.game.goto('menu');
    };
  }

  _updateHUD() {
    const moneyEl = document.getElementById('moneyVal');
    if (moneyEl) moneyEl.textContent = Math.floor(this.economy.money);
    const timeEl = document.getElementById('timeVal');
    if (timeEl) timeEl.textContent = this.time.toFixed(0) + 's';
    const waveEl = document.getElementById('waveVal');
    if (waveEl) {
      const remaining = this.waveManager.spawnQueue.length;
      waveEl.textContent = remaining > 0 ? remaining : (this.waveManager.bossAlive ? 'BOSS' : '✓');
    }

    const pF = Math.max(0, this.playerBase.hp / this.playerBase.maxHp);
    const eF = Math.max(0, this.enemyBase.hp / this.enemyBase.maxHp);
    const pFill = document.getElementById('playerHpFill');
    const eFill = document.getElementById('enemyHpFill');
    const pLbl = document.getElementById('playerHpLbl');
    const eLbl = document.getElementById('enemyHpLbl');
    if (pFill) pFill.style.width = (pF * 100) + '%';
    if (eFill) eFill.style.width = (eF * 100) + '%';
    if (pLbl) pLbl.textContent = Math.round(pF * 100) + '%';
    if (eLbl) eLbl.textContent = Math.round(eF * 100) + '%';

    for (const u of UNITS) {
      const slot = document.querySelector(`.deploySlot[data-unit="${u.id}"]`);
      if (!slot) continue;
      const cdLeft = this.deployCd[u.id];
      const affordable = this.economy.canAfford(u.cost);
      slot.classList.toggle('affordable', affordable && cdLeft <= 0);
      slot.classList.toggle('locked', !affordable && cdLeft <= 0);
      const cdEl = document.getElementById('cd_' + u.id);
      if (cdEl) {
        const cdMax = Math.max(BALANCE.GLOBAL_DEPLOY_CD_FLOOR, u.deployCD * this.stats.cdMul);
        const pct = Math.max(0, Math.min(1, cdLeft / cdMax));
        cdEl.style.height = (pct * 100) + '%';
      }
    }
  }

  _checkEndState() {
    if (this.ended) return;
    if (!this.playerBase.alive) {
      this.ended = true;
      setTimeout(() => {
        if (!this.scene) return;
        this.game.finishBattle({ win: false, stageId: this.stageId, moneyEarned: 0 });
      }, 800);
    } else if (!this.enemyBase.alive) {
      this.ended = true;
      const bonus = this.stage.reward || 100;
      this.moneyEarnedThisBattle = bonus;
      setTimeout(() => {
        if (!this.scene) return;
        this.game.finishBattle({ win: true, stageId: this.stageId, moneyEarned: bonus });
      }, 800);
    }
  }

  update(dt) {
    if (this.paused) {
      this.debug.update(dt, this._worldSnapshot());
      return;
    }

    const simDt = this.combatFeel ? this.combatFeel.simulationDt(dt) : dt;
    this.combatFeel?.updateCamera(dt);
    if (simDt <= 0) {
      this.vfx.update(dt);
      this._updateHUD();
      return;
    }

    this.time += simDt;
    if (!this.chaosActive && this.time >= BALANCE.CHAOS_TIME) {
      this.chaosActive = true;
      this.game.showToast('⚠ CHAOS MODE — enemy waves intensify!');
      if (this.vfx) this.vfx.spawnShockwave(new THREE.Vector3(0, 1, 0), 0xff3344, 4);
      this.combatFeel?.impact('heavy');
    }

    this.economy.update(simDt, this.chaosActive);
    for (const id of Object.keys(this.deployCd)) this.deployCd[id] = Math.max(0, this.deployCd[id] - simDt);

    this.waveManager.update(simDt, this.chaosActive);
    this.combat.update(simDt, this._worldSnapshot());

    const world = this._worldSnapshot();
    for (const u of this.units) u.update(simDt, world);
    for (const e of this.enemies) e.update(simDt, world);

    this.units = this.units.filter(u => u.alive);
    const deadEnemies = this.enemies.filter(e => !e.alive);
    for (const de of deadEnemies) {
      if (de._rewardGranted) continue;
      de._rewardGranted = true;
      this.economy.grant(de.reward);
      if (de.isBoss) this.waveManager.onBossDied();
    }
    this.enemies = this.enemies.filter(e => e.alive);

    this.playerBase.update(simDt);
    this.enemyBase.update(simDt);
    this.vfx.update(dt);
    this.debug.update(simDt, world);
    this._updateHUD();
    this._checkEndState();
  }

  _worldSnapshot() {
    return {
      units: this.units,
      enemies: this.enemies,
      playerBase: this.playerBase,
      enemyBase: this.enemyBase,
      combat: this.combat,
      combatFeel: this.combatFeel,
      economy: this.economy,
      vfx: this.vfx,
      waveManager: this.waveManager,
      time: this.time,
      chaosActive: this.chaosActive,
    };
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
    for (const u of this.units) u.destroy();
    for (const e of this.enemies) e.destroy();
    this.units = [];
    this.enemies = [];
    if (this.playerBase) this.playerBase.destroy();
    if (this.enemyBase) this.enemyBase.destroy();
    if (this.combat) this.combat.clear();
    if (this.combatFeel) this.combatFeel.clear();
    if (this.vfx) this.vfx.clear();
    if (this.scene) {
      this.scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    this.scene = null;
  }
}
