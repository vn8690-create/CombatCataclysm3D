// Player-facing Boken / World Comedy Tour scene.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';
import { BOKEN_ROUTES } from '../config/bokenRoutes.js';
import { WORLD_REGION_MAP } from '../config/worldRegions.js';

const NODE_ICONS = Object.freeze({
  story: '📖', encounter: '❓', recruit: '🤝', battle: '⚔️', boss: '👑', reward: '🎁', hidden: '✨',
});

export class BokenScene {
  constructor(game) {
    this.game = game;
  }

  enter() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07111f);
    this.scene.fog = new THREE.Fog(0x07111f, 18, 44);

    const w = window.innerWidth, h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(BALANCE.CAMERA_FOV, w / h, 0.1, 100);
    this.camera.position.set(0, 5.2, 13.5);
    this.camera.lookAt(0, 1.1, 0);

    this.scene.add(new THREE.HemisphereLight(0x88bbff, 0x11182c, 0.85));
    const sun = new THREE.DirectionalLight(0xffe4b5, 1.15);
    sun.position.set(6, 10, 8);
    this.scene.add(sun);

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(3.4, 32, 20),
      new THREE.MeshStandardMaterial({ color: 0x173d63, roughness: 0.72, metalness: 0.08 })
    );
    globe.position.set(0, 1.2, -3.5);
    globe.rotation.z = -0.18;
    this.scene.add(globe);
    this.globe = globe;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.1, 0.045, 8, 80),
      new THREE.MeshBasicMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.48 })
    );
    ring.rotation.x = Math.PI / 2.3;
    ring.position.copy(globe.position);
    this.scene.add(ring);
    this.ring = ring;

    this._buildUI();
  }

  _buildUI() {
    const boken = this.game.boken;
    const currentRoute = boken.getRoute();
    const currentNode = boken.getCurrentNode();

    const routeCards = BOKEN_ROUTES.map(route => {
      const region = WORLD_REGION_MAP[route.regionId];
      const active = route.id === boken.currentRouteId;
      const done = boken.completedRoutes.has(route.id);
      return `
        <button class="btn ${active ? 'primary' : ''}" data-route="${route.id}" style="min-width:210px; text-align:left;">
          <div style="font-size:22px;">${region?.icon || '🌍'} ${region?.name || route.regionId}</div>
          <div style="font-size:12px; opacity:.78; margin-top:4px;">${route.name}</div>
          <div style="font-size:11px; margin-top:6px;">${done ? '✅ Route cleared' : active ? '📍 Current route' : '🧭 Explore'}</div>
        </button>`;
    }).join('');

    const nodeCards = currentRoute ? currentRoute.nodes.map((node, index) => {
      const isCurrent = node.id === boken.currentNodeId;
      const visited = boken.visitedNodes.has(node.id);
      const resolved = boken.resolvedNodes?.has(node.id);
      const available = boken.availableNextNodes().some(n => n.id === node.id);
      const state = isCurrent ? 'CURRENT' : resolved ? 'CLEARED' : visited ? 'VISITED' : available ? 'OPEN' : 'LOCKED';
      const opacity = state === 'LOCKED' ? 0.38 : 1;
      return `
        <div data-node="${node.id}" style="position:relative; min-width:145px; max-width:145px; padding:14px; border-radius:18px; border:2px solid ${isCurrent ? '#ffcf4a' : resolved ? '#54d98c' : available ? '#6fb9ff' : '#35445d'}; background:rgba(8,16,30,.86); opacity:${opacity}; box-shadow:${isCurrent ? '0 0 24px rgba(255,207,74,.32)' : 'none'};">
          <div style="font-size:28px;">${NODE_ICONS[node.type] || '•'}</div>
          <div style="font-weight:800; margin-top:5px;">${node.title}</div>
          <div style="font-size:10px; letter-spacing:.12em; opacity:.65; margin-top:5px;">${node.type.toUpperCase()} · ${state}</div>
          ${index < currentRoute.nodes.length - 1 ? '<div style="position:absolute; right:-20px; top:50%; width:18px; height:2px; background:#52657f;"></div>' : ''}
        </div>`;
    }).join('') : '';

    const action = this._actionMarkup(currentNode);
    const region = currentRoute ? WORLD_REGION_MAP[currentRoute.regionId] : null;
    const recruits = [...boken.recruitedCharacters];

    this.game.ui.innerHTML = `
      <div class="screen" style="justify-content:flex-start; padding-top:4vh; overflow:auto;">
        <div style="width:min(1180px,94vw);">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
            <div>
              <div class="subtitle">WORLD COMEDY TOUR</div>
              <h1 style="font-size:clamp(32px,5vw,64px); margin:4px 0 0;">BŌKEN</h1>
              <div class="subtitle">Explore, recruit weirdos, trigger battles, survive the local nonsense.</div>
            </div>
            <button class="btn" id="btnBokenBack">← Menu</button>
          </div>

          <div class="row" style="justify-content:flex-start; margin-top:18px; flex-wrap:wrap;">${routeCards}</div>

          <div style="margin-top:22px; padding:18px; border-radius:22px; background:rgba(7,14,28,.76); border:1px solid rgba(120,180,255,.18);">
            <div style="display:flex; justify-content:space-between; gap:20px; flex-wrap:wrap; align-items:flex-start;">
              <div>
                <h2 style="margin:0;">${region?.icon || '🌍'} ${currentRoute?.name || 'Choose a route'}</h2>
                <div class="subtitle" style="max-width:760px; text-align:left;">${region?.theme || ''}</div>
              </div>
              <div class="subtitle" style="text-align:right;">Recruited: ${recruits.length ? recruits.join(', ') : 'Nobody yet. Very peaceful.'}</div>
            </div>

            <div style="display:flex; gap:38px; align-items:stretch; overflow-x:auto; padding:24px 6px 16px;">${nodeCards}</div>

            <div id="bokenAction" style="margin-top:14px; padding:16px; border-radius:18px; background:rgba(255,255,255,.04);">${action}</div>
          </div>
        </div>
      </div>`;

    document.getElementById('btnBokenBack').onclick = () => this.game.goto('menu');
    this.game.ui.querySelectorAll('[data-route]').forEach(btn => {
      btn.onclick = () => {
        const routeId = btn.dataset.route;
        if (routeId !== this.game.boken.currentRouteId) {
          this.game.boken.startRoute(routeId);
          this.game.save.boken = this.game.boken.serialize();
          this.game.persistSave();
        }
        this._buildUI();
      };
    });

    const actionBtn = document.getElementById('btnBokenAction');
    if (actionBtn) actionBtn.onclick = () => this._handlePrimaryAction();

    this.game.ui.querySelectorAll('[data-next-node]').forEach(btn => {
      btn.onclick = () => {
        if (this.game.boken.moveTo(btn.dataset.nextNode)) {
          this.game.save.boken = this.game.boken.serialize();
          this.game.persistSave();
          this._buildUI();
        }
      };
    });
  }

  _actionMarkup(node) {
    if (!node) return '<div class="subtitle">Choose a route to begin.</div>';
    const boken = this.game.boken;
    const resolved = boken.resolvedNodes?.has(node.id);

    if ((node.type === 'battle' || node.type === 'boss') && !resolved) {
      return `<div><strong>${node.type === 'boss' ? '👑 Boss encounter' : '⚔️ Battle encounter'}</strong><div class="subtitle" style="text-align:left; margin:6px 0 12px;">Win the battle to unlock the route ahead.</div><button class="btn primary" id="btnBokenAction">Fight Stage ${node.battleStageId}</button></div>`;
    }

    if (!resolved) {
      const labels = { story: 'Read & continue', encounter: 'Investigate', recruit: 'Recruit', reward: 'Claim reward', hidden: 'Reveal' };
      return `<div><strong>${NODE_ICONS[node.type] || '•'} ${node.title}</strong><div class="subtitle" style="text-align:left; margin:6px 0 12px;">Resolve this stop before moving deeper into the route.</div><button class="btn success" id="btnBokenAction">${labels[node.type] || 'Resolve'}</button></div>`;
    }

    const next = boken.availableNextNodes();
    if (!next.length) return '<div><strong>✅ Route complete.</strong><div class="subtitle" style="text-align:left; margin-top:6px;">This district has survived you. Barely.</div></div>';
    return `<div><strong>Choose the next stop</strong><div class="row" style="justify-content:flex-start; margin-top:10px; flex-wrap:wrap;">${next.map(n => `<button class="btn" data-next-node="${n.id}">${NODE_ICONS[n.type] || '•'} ${n.title}</button>`).join('')}</div></div>`;
  }

  _handlePrimaryAction() {
    const node = this.game.boken.getCurrentNode();
    if (!node) return;
    if (node.type === 'battle' || node.type === 'boss') {
      this.game.startBokenBattle(node);
      return;
    }

    const result = this.game.boken.resolveCurrentNode();
    if (result.ok) {
      this.game.save.boken = this.game.boken.serialize();
      this.game.persistSave();
      if (node.type === 'recruit' && node.rewardCharacterId) this.game.showToast(`Recruited: ${node.rewardCharacterId}`);
      else if (node.type === 'reward') this.game.showToast('Route reward claimed');
      else this.game.showToast('Adventure node cleared');
      this._buildUI();
    }
  }

  update(dt) {
    if (this.globe) this.globe.rotation.y += dt * 0.08;
    if (this.ring) this.ring.rotation.z += dt * 0.03;
  }

  render(renderer) { renderer.render(this.scene, this.camera); }

  onResize(w, h) {
    if (!this.camera) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
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
