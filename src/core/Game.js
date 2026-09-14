// Game orchestrator. Owns renderer, canvas, clock, current scene, and the UI layer.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';
import { SaveSystem } from './SaveSystem.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { StageSelectScene } from '../scenes/StageSelectScene.js';
import { BattleScene } from '../scenes/BattleScene.js';
import { UpgradeScene } from '../scenes/UpgradeScene.js';
import { ResultScene } from '../scenes/ResultScene.js';
import { BokenScene } from '../scenes/BokenScene.js';
import { RosterScene } from '../scenes/RosterScene.js';
import { BokenSystem } from '../systems/BokenSystem.js';
import { BOKEN_ROUTES } from '../config/bokenRoutes.js';
import { STAGES } from '../config/stages.js';

export class Game {
  constructor(appContainer, uiContainer, debugEl, toastEl) {
    this.app = appContainer;
    this.ui = uiContainer;
    this.debugEl = debugEl;
    this.toastEl = toastEl;

    this.save = SaveSystem.load();
    this.boken = new BokenSystem(BOKEN_ROUTES, this.save.boken);
    if (!this.boken.visitedNodes.size && this.boken.currentNodeId) this.boken.visitedNodes.add(this.boken.currentNodeId);
    this.save.boken = this.boken.serialize();
    SaveSystem.save(this.save);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.app.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.currentScene = null;
    this.lastStageId = null;
    this.lastResult = null;
    this.pendingBokenBattle = null;

    window.addEventListener('resize', () => this.onResize());

    this.debugVisible = false;
    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        this.debugVisible = !this.debugVisible;
        this.debugEl.classList.toggle('visible', this.debugVisible);
      }
    });

    this.paused = false;
  }

  start() {
    this.goto('menu');
    this.loop();
  }

  goto(sceneId, payload = {}) {
    if (this.currentScene) {
      this.currentScene.exit();
      this.currentScene = null;
      this.ui.innerHTML = '';
    }

    let scene;
    switch (sceneId) {
      case 'menu': scene = new MenuScene(this); break;
      case 'stage_select': scene = new StageSelectScene(this); break;
      case 'battle': scene = new BattleScene(this, payload.stageId); break;
      case 'upgrade': scene = new UpgradeScene(this); break;
      case 'result': scene = new ResultScene(this, payload.result); break;
      case 'boken': scene = new BokenScene(this); break;
      case 'roster': scene = new RosterScene(this); break;
      default:
        console.error('Unknown scene id', sceneId);
        return;
    }
    this.currentScene = scene;
    scene.enter();
  }

  showToast(text, duration = 1800) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('visible');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.toastEl.classList.remove('visible'), duration);
  }

  persistSave() {
    if (this.boken) this.save.boken = this.boken.serialize();
    SaveSystem.save(this.save);
  }

  resetProgress() {
    this.save = SaveSystem.reset();
    this.boken = new BokenSystem(BOKEN_ROUTES, null);
    if (this.boken.currentNodeId) this.boken.visitedNodes.add(this.boken.currentNodeId);
    this.save.boken = this.boken.serialize();
    this.pendingBokenBattle = null;
    SaveSystem.save(this.save);
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    if (this.currentScene && this.currentScene.onResize) this.currentScene.onResize(w, h);
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.currentScene) {
      this.currentScene.update(dt);
      this.currentScene.render(this.renderer);
    }
  }

  startBattle(stageId) {
    this.pendingBokenBattle = null;
    this.lastStageId = stageId;
    this.goto('battle', { stageId });
  }

  startBokenBattle(node) {
    if (!node || (node.type !== 'battle' && node.type !== 'boss') || !node.battleStageId) return false;
    this.pendingBokenBattle = {
      routeId: this.boken.currentRouteId,
      nodeId: node.id,
      stageId: node.battleStageId,
    };
    this.lastStageId = node.battleStageId;
    this.goto('battle', { stageId: node.battleStageId });
    return true;
  }

  finishBattle(result) {
    const pendingBoken = this.pendingBokenBattle;
    this.pendingBokenBattle = null;
    this.lastResult = result;

    if (result.win) {
      const maxStageId = STAGES.reduce((max, stage) => Math.max(max, stage.id), 0);
      SaveSystem.markCleared(this.save, result.stageId, maxStageId);
      this.save.money = (this.save.money || 0) + (result.moneyEarned || 0);
    }

    if (pendingBoken && pendingBoken.stageId === result.stageId) {
      const routeStillMatches = this.boken.currentRouteId === pendingBoken.routeId;
      const nodeStillMatches = this.boken.currentNodeId === pendingBoken.nodeId;
      if (routeStillMatches && nodeStillMatches && result.win) this.boken.resolveCurrentNode({ win: true });
      result = { ...result, bokenReturn: true, bokenNodeId: pendingBoken.nodeId };
      this.lastResult = result;
    }

    this.persistSave();
    this.goto('result', { result });
  }
}
