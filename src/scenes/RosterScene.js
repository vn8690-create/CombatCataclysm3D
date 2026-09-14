// Character presentation / roster scene.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';
import { UNITS } from '../config/units.js';
import { CANONICAL_DNA } from '../config/canonicalCharacters.js';

const DNA_MAP = Object.freeze(Object.fromEntries(CANONICAL_DNA.map(dna => [dna.id, dna])));

export class RosterScene {
  constructor(game) {
    this.game = game;
    this.selectedId = CANONICAL_DNA[0]?.id || UNITS[0]?.id || null;
  }

  enter() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1020);
    this.scene.fog = new THREE.Fog(0x0c1020, 18, 38);

    const w = window.innerWidth, h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(BALANCE.CAMERA_FOV, w / h, 0.1, 100);
    this.camera.position.set(0, 3.8, 10.8);
    this.camera.lookAt(0, 1.2, 0);

    this.scene.add(new THREE.HemisphereLight(0x9fb5ff, 0x20243a, 0.85));
    const key = new THREE.DirectionalLight(0xffe7c2, 1.2);
    key.position.set(5, 9, 7);
    this.scene.add(key);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.6, 0.35, 32),
      new THREE.MeshStandardMaterial({ color: 0x202a46, roughness: 0.62, metalness: 0.25 })
    );
    platform.position.set(0, 0.18, -2.4);
    this.scene.add(platform);
    this.platform = platform;

    this.previewGroup = new THREE.Group();
    this.previewGroup.position.set(0, 0.35, -2.4);
    this.scene.add(this.previewGroup);

    this._buildUI();
    this._buildPreview();
  }

  _selectedUnit() {
    return UNITS.find(u => u.id === this.selectedId) || UNITS[0] || null;
  }

  _buildPreview() {
    while (this.previewGroup.children.length) {
      const child = this.previewGroup.children.pop();
      child.traverse?.(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }

    const unit = this._selectedUnit();
    if (!unit) return;
    const color = unit.color ?? 0x7da2ff;
    const accent = unit.accent ?? 0xffffff;
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.12 });
    const accentMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.45, metalness: 0.18 });
    let body;
    switch (unit.modelType) {
      case 'sphere': body = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 18), bodyMat); break;
      case 'cylinder': body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 1.8, 18), bodyMat); break;
      case 'cone': body = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.0, 12), bodyMat); break;
      case 'capsule': body = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 1.0, 6, 12), bodyMat); break;
      default: body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.9, 1.2), bodyMat);
    }
    body.position.y = 1.15;
    body.scale.setScalar(unit.scale || 1);
    body.castShadow = true;
    this.previewGroup.add(body);

    const badge = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.08, 8, 24), accentMat);
    badge.position.set(0, 2.55, 0);
    badge.rotation.x = Math.PI / 2;
    this.previewGroup.add(badge);
    this.previewBody = body;
  }

  _buildUI() {
    const unit = this._selectedUnit();
    if (!unit) return;
    const dna = DNA_MAP[unit.id] || null;
    const recruited = this.game.boken?.recruitedCharacters?.has(unit.id);

    const cards = UNITS.map(u => {
      const canonical = !!DNA_MAP[u.id];
      const active = u.id === unit.id;
      return `<button class="btn ${active ? 'primary' : ''}" data-character="${u.id}" style="min-width:142px; text-align:left; padding:12px;">
        <div style="font-size:28px;">${u.icon || '👤'}</div>
        <div style="font-weight:800; margin-top:4px;">${u.name}</div>
        <div style="font-size:10px; opacity:.7; margin-top:4px;">${canonical ? 'CANONICAL DNA' : 'PROTOTYPE'}</div>
      </button>`;
    }).join('');

    const stats = [
      ['HP', Math.round(unit.hp || 0)],
      ['ATK', Math.round(unit.attack || 0)],
      ['RANGE', unit.range ?? 0],
      ['SPEED', unit.moveSpeed ?? 0],
      ['COST', unit.cost ?? 0],
      ['CD', unit.deployCD ?? 0],
    ].map(([k,v]) => `<div style="padding:10px 12px; border-radius:14px; background:rgba(255,255,255,.05); min-width:82px;"><div style="font-size:10px; opacity:.6;">${k}</div><div style="font-size:18px; font-weight:900;">${v}</div></div>`).join('');

    const canonBlock = dna ? `
      <div style="margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px;">
        <div style="padding:14px; border-radius:16px; background:rgba(255,255,255,.04);"><strong>🎭 Personality</strong><div class="subtitle" style="text-align:left; margin-top:6px;">${dna.visual.animationPersonality}</div></div>
        <div style="padding:14px; border-radius:16px; background:rgba(255,255,255,.04);"><strong>💥 Hidden skill</strong><div class="subtitle" style="text-align:left; margin-top:6px;">${dna.combat.hiddenSkill}</div></div>
        <div style="padding:14px; border-radius:16px; background:rgba(255,255,255,.04);"><strong>🧨 Failure behavior</strong><div class="subtitle" style="text-align:left; margin-top:6px;">${dna.comedy.failureBehavior}</div></div>
        <div style="padding:14px; border-radius:16px; background:rgba(255,255,255,.04);"><strong>🔗 Relationships</strong><div class="subtitle" style="text-align:left; margin-top:6px;">${dna.relationships.length ? dna.relationships.map(r => `${r.type} → ${r.target}`).join(' · ') : 'No known drama yet.'}</div></div>
      </div>` : `<div class="subtitle" style="margin-top:16px; text-align:left;">Prototype character. Full Character DNA will be added when this unit graduates into the canonical cast.</div>`;

    this.game.ui.innerHTML = `
      <div class="screen" style="justify-content:flex-start; padding-top:4vh; overflow:auto;">
        <div style="width:min(1180px,94vw);">
          <div style="display:flex; justify-content:space-between; gap:16px; align-items:center; flex-wrap:wrap;">
            <div><div class="subtitle">CHARACTER FACTORY</div><h1 style="font-size:clamp(30px,5vw,58px); margin:4px 0;">ROSTER</h1></div>
            <button class="btn" id="btnRosterBack">← Menu</button>
          </div>

          <div style="display:flex; gap:12px; overflow-x:auto; padding:14px 2px 18px;">${cards}</div>

          <div style="margin-top:8px; padding:20px; border-radius:22px; background:rgba(7,14,28,.78); border:1px solid rgba(120,180,255,.18);">
            <div style="display:flex; justify-content:space-between; gap:18px; flex-wrap:wrap; align-items:flex-start;">
              <div>
                <div style="font-size:48px;">${unit.icon || '👤'}</div>
                <h2 style="margin:4px 0;">${unit.name}</h2>
                <div class="subtitle" style="text-align:left;">${dna ? `${dna.role.toUpperCase()} · ${dna.visual.silhouette}` : `${unit.attackType || 'combat'} · ${unit.special || 'standard'}`}</div>
                ${recruited ? '<div style="margin-top:8px; color:#69e59b; font-weight:800;">✓ Recruited in Bōken</div>' : ''}
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; max-width:520px;">${stats}</div>
            </div>
            ${canonBlock}
          </div>
        </div>
      </div>`;

    document.getElementById('btnRosterBack').onclick = () => this.game.goto('menu');
    this.game.ui.querySelectorAll('[data-character]').forEach(btn => {
      btn.onclick = () => {
        this.selectedId = btn.dataset.character;
        this._buildPreview();
        this._buildUI();
      };
    });
  }

  update(dt) {
    if (this.previewGroup) this.previewGroup.rotation.y += dt * 0.45;
    if (this.previewBody) this.previewBody.position.y = 1.15 + Math.sin(performance.now() * 0.0025) * 0.05;
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
