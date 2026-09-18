// Character presentation / roster scene.
import * as THREE from 'three';
import { UNITS } from '../config/units.js';
import { CANONICAL_DNA } from '../config/canonicalCharacters.js';
import { Unit } from '../entities/Unit.js';
import { defaultStats } from '../config/upgrades.js';
import { portraitMarkup, bindPortraits } from '../ui/CharacterPortrait.js';

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
    this.camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    this.camera.position.set(0, 1.5, 1.6);
    this.camera.lookAt(0, 1.5, -2.4);

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
    this.previewUnit?.destroy();
    const config = this._selectedUnit();
    if (!config) return;
    this.previewUnit = new Unit({ scene: this.scene, config, stats: defaultStats(), x: 0 });
    this.previewUnit.barBg.visible = this.previewUnit.barFill.visible = false;
    this.previewGroup.add(this.previewUnit.group);
  }

  _buildUI() {
    const unit = this._selectedUnit();
    if (!unit) return;
    const dna = DNA_MAP[unit.id] || null;
    const recruited = this.game.boken?.recruitedCharacters?.has(unit.id);

    const displayUnits = [...UNITS.filter(u => u.battleSprite), ...UNITS.filter(u => !u.battleSprite)];
    const cards = displayUnits.map(u => {
      const canonical = !!DNA_MAP[u.id];
      const active = u.id === unit.id;
      return `<button class="btn ${active ? 'primary' : ''}" data-character="${u.id}" style="min-width:132px; max-width:150px; text-align:left; padding:10px;">
        ${portraitMarkup(u)}
        <div style="font-weight:800; margin-top:4px;">${u.name}</div>
        <div style="font-size:10px; opacity:.7; margin-top:4px;">${u.artStatus === 'provisional' ? 'PROVISIONAL ART' : canonical ? 'CANONICAL DNA' : 'PROTOTYPE'}</div>
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
        <div style="padding:14px; border-radius:16px; background:rgba(255,255,255,.04);"><strong>💥 Skill concept</strong><div class="subtitle" style="text-align:left; margin-top:6px;">${dna.combat.hiddenSkill}</div></div>
        <div style="padding:14px; border-radius:16px; background:rgba(255,255,255,.04);"><strong>🧨 Comedy concept</strong><div class="subtitle" style="text-align:left; margin-top:6px;">${dna.comedy.failureBehavior}</div></div>
        <div style="padding:14px; border-radius:16px; background:rgba(255,255,255,.04);"><strong>🔗 Relationships</strong><div class="subtitle" style="text-align:left; margin-top:6px;">${dna.relationships.length ? dna.relationships.map(r => `${r.type} → ${r.target}`).join(' · ') : 'No known drama yet.'}</div></div>
      </div>` : `<div class="subtitle" style="margin-top:16px; text-align:left;">Prototype character. Full Character DNA will be added when this unit graduates into the canonical cast.</div>`;

    this.game.ui.innerHTML = `
      <div class="screen" style="justify-content:flex-start; padding-top:4vh; overflow:auto; background:none;">
        <div style="width:min(1180px,94vw);">
          <div style="display:flex; justify-content:space-between; gap:16px; align-items:center; flex-wrap:wrap;">
            <div><div class="subtitle">CHARACTER FACTORY</div><h1 style="font-size:clamp(30px,5vw,58px); margin:4px 0;">ROSTER</h1></div>
            <button class="btn" id="btnRosterBack">← Menu</button>
          </div>

          <div style="display:flex; gap:12px; overflow-x:auto; padding:14px 2px 18px;">${cards}</div>

          <div style="margin-top:8px; padding:20px; border-radius:22px; border:1px solid rgba(120,180,255,.18);">
            <div style="display:flex; justify-content:space-between; gap:18px; flex-wrap:wrap; align-items:flex-start;">
              <div>
                <div class="rosterArt" role="img" aria-label="${unit.name} animated battlefield preview"></div>
                <h2 style="margin:4px 0;">${unit.name}</h2>
                ${unit.artStatus === 'provisional' ? '<div style="color:#ffdc88;font-size:12px">Provisional artwork · pending approval</div>' : ''}
                <div class="subtitle" style="text-align:left; margin-top:6px;">${dna ? `${dna.role.toUpperCase()} · ${dna.visual.silhouette}` : `${unit.attackType || 'combat'} · ${unit.special || 'standard'}`}</div>
                ${recruited ? '<div style="margin-top:8px; color:#69e59b; font-weight:800;">✓ Recruited in Bōken</div>' : ''}
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; max-width:520px;">${stats}</div>
            </div>
            ${canonBlock}
          </div>
        </div>
      </div>`;

    bindPortraits(this.game.ui);
    this.previewElement = this.game.ui.querySelector('.rosterArt');
    document.getElementById('btnRosterBack').onclick = () => this.game.goto('menu');
    this.game.ui.querySelectorAll('[data-character]').forEach(btn => {
      btn.onclick = () => {
        const scroll = btn.parentElement.scrollLeft;
        this.selectedId = btn.dataset.character;
        this._buildPreview();
        this._buildUI();
        this.game.ui.querySelector('[data-character]').parentElement.scrollLeft = scroll;
      };
    });
  }

  update(dt) {
    if (!this.previewUnit) return;
    this.previewUnit.animClock += dt;
    this.previewUnit._idle();
    this.previewUnit._updateJuice(dt);
  }

  render(renderer) {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
    renderer.setClearColor(0x0c1020, 1);
    renderer.clear();
    const rect = this.previewElement?.getBoundingClientRect();
    if (rect?.width && rect.bottom > 0 && rect.top < h) {
      this.camera.aspect = rect.width / rect.height;
      this.camera.updateProjectionMatrix();
      renderer.setViewport(rect.left, h - rect.bottom, rect.width, rect.height);
      renderer.setScissor(rect.left, h - rect.bottom, rect.width, rect.height);
      renderer.setScissorTest(true);
      renderer.render(this.scene, this.camera);
    }
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
  }

  onResize(w, h) {
    if (!this.camera) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  exit() {
    this.previewUnit?.destroy();
    this.previewUnit = null;
    if (this.scene) {
      this.scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    this.scene = null;
  }
}
