// VFXSystem manages transient particle, comic text and impact effects.
// It deliberately keeps a tiny native emitter/lifetime model so the no-build Three.js
// prototype stays light while following the same data-driven particle ideas used by
// dedicated Three.js particle libraries.
import * as THREE from 'three';
import { EffectBudget } from './EffectBudget.js';

const MAX_PARTICLES = 320;

export class VFXSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.budget = new EffectBudget();
    this._sharedGeo = new THREE.SphereGeometry(0.12, 6, 4);
  }

  _disposeParticle(p) {
    if (!p?.mesh) return;
    this.budget.release(p.kind);
    this.scene.remove(p.mesh);
    if (p.mesh.geometry && p.mesh.geometry !== this._sharedGeo) p.mesh.geometry.dispose();
    if (p.texture) p.texture.dispose();
    if (p.mat) p.mat.dispose();
  }

  _trimPool() {
    while (this.particles.length >= MAX_PARTICLES) {
      const old = this.particles.shift();
      this._disposeParticle(old);
    }
  }

  _spawnParticle(pos, color, life, velocity, scale = 1, gravity = -3) {
    if (!this._sharedGeo || !this.budget.acquire('particle')) return false;
    this._trimPool();
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(this._sharedGeo, mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(scale);
    this.scene.add(mesh);
    this.particles.push({
      mesh, mat, kind: 'particle', baseScale: scale,
      pos: pos.clone(),
      vel: velocity.clone(),
      life, maxLife: life,
      gravity,
    });
    return true;
  }

  spawnHitSpark(pos, color) {
    for (let i = 0; i < 6; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 2);
      this._spawnParticle(pos.clone(), color, 0.4, v, 0.6);
    }
  }

  spawnDeathBurst(pos, color) {
    for (let i = 0; i < 16; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 5 + 1, (Math.random() - 0.5) * 3);
      this._spawnParticle(pos.clone(), color, 0.7, v, 0.9);
    }
    this.spawnShockwave(pos, color, 1.2);
  }

  spawnExplosion(pos, color, radius) {
    const n = Math.min(30, Math.floor(radius * 12));
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * radius * 4, Math.random() * radius * 3, (Math.random() - 0.5) * radius * 2);
      this._spawnParticle(pos.clone(), color, 0.5, v, 1.0);
    }
    this.spawnShockwave(pos, color, radius);
  }

  spawnShockwave(pos, color, radius = 1.5) {
    if (!this._sharedGeo || !this.budget.acquire('ring')) return false;
    this._trimPool();
    const geo = new THREE.RingGeometry(0.1, 0.3, 24);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.copy(pos);
    ring.position.y = 0.1;
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);
    this.particles.push({
      mesh: ring, mat, kind: 'ring',
      pos: pos.clone(),
      vel: new THREE.Vector3(),
      life: 0.4, maxLife: 0.4,
      gravity: 0,
      isRing: true,
      maxRadius: radius * 1.5,
    });
    return true;
  }

  spawnCoinBurst(pos, amount) {
    const n = Math.min(12, Math.max(4, Math.floor(amount / 5)));
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 4 + 2, (Math.random() - 0.5) * 2);
      this._spawnParticle(pos.clone(), 0xffcc33, 0.6, v, 0.5);
    }
  }

  spawnDashTrail(pos) {
    for (let i = 0; i < 4; i++) {
      const v = new THREE.Vector3(-Math.random() * 2, Math.random() * 0.5, 0);
      this._spawnParticle(pos.clone(), 0xffaa44, 0.3, v, 0.4);
    }
  }

  spawnConeBreath(pos, color) {
    for (let i = 0; i < 20; i++) {
      const v = new THREE.Vector3(-Math.random() * 6 - 1, (Math.random() - 0.3) * 3, (Math.random() - 0.5) * 1.5);
      this._spawnParticle(pos.clone(), color, 0.6, v, 0.8);
    }
  }

  spawnFootDust(pos) {
    const base = pos.clone();
    base.y = 0.08;
    for (let i = 0; i < 4; i++) {
      const v = new THREE.Vector3((Math.random() - 0.65) * 1.3, Math.random() * 0.55 + 0.15, (Math.random() - 0.5) * 0.7);
      this._spawnParticle(base.clone(), i % 2 ? 0x8b8790 : 0x676572, 0.32 + Math.random() * 0.12, v, 0.38 + Math.random() * 0.22, -0.8);
    }
  }

  spawnDeployPuff(pos, color = 0xffd84d) {
    const p = pos.clone();
    p.y = 0.35;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.2;
      this._spawnParticle(p.clone(), i % 2 ? color : 0xffffff, 0.38, new THREE.Vector3(Math.cos(a) * speed, Math.random() * 1.3, Math.sin(a) * speed), 0.42, -1.2);
    }
    this.spawnShockwave(p, color, 0.55);
  }

  spawnGymImpact(pos) {
    const p = pos.clone();
    this.spawnHitSpark(p, 0xffd84d);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const speed = 2.3 + Math.random() * 2.4;
      this._spawnParticle(
        p.clone(),
        i % 3 === 0 ? 0xffffff : 0xff9f2d,
        0.3 + Math.random() * 0.18,
        new THREE.Vector3(Math.cos(a) * speed, Math.sin(a) * speed * 0.65 + 1.1, (Math.random() - 0.5) * 1.2),
        0.5 + Math.random() * 0.3,
        -2.2
      );
    }
    this.spawnShockwave(p, 0xffd84d, 0.9);
  }

  spawnComicText(pos, text, color = '#ffd84d') {
    if (!this._sharedGeo || typeof document === 'undefined' || !this.budget.acquire('text')) return false;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) { this.budget.release('text'); return false; }
    this._trimPool();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 54px Segoe UI, Arial, sans-serif';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#10101a';
    ctx.lineWidth = 12;
    ctx.strokeText(text, 128, 48);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(pos);
    sprite.position.y += 0.8;
    sprite.scale.set(1.9, 0.72, 1);
    this.scene.add(sprite);
    this.particles.push({
      mesh: sprite, mat, texture, kind: 'text',
      pos: sprite.position.clone(),
      vel: new THREE.Vector3(0.15, 0.7, 0),
      life: 0.62, maxLife: 0.62,
      gravity: 0,
      isText: true,
      baseScale: new THREE.Vector3(1.9, 0.72, 1),
    });
    return true;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.budget.update(dt);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this._disposeParticle(p);
        this.particles.splice(i, 1);
        continue;
      }

      if (p.isRing) {
        const t = 1 - p.life / p.maxLife;
        const r = p.maxRadius * t;
        p.mesh.scale.setScalar(Math.max(0.1, r));
        p.mat.opacity = (1 - t) * 0.8;
        continue;
      }

      if (p.isText) {
        p.pos.addScaledVector(p.vel, dt);
        p.mesh.position.copy(p.pos);
        const remaining = p.life / p.maxLife;
        const appear = Math.min(1, (1 - remaining) * 8);
        p.mat.opacity = Math.min(1, remaining * 2.2) * appear;
        const pop = 0.88 + Math.sin((1 - remaining) * Math.PI) * 0.18;
        p.mesh.scale.set(p.baseScale.x * pop, p.baseScale.y * pop, 1);
        continue;
      }

      p.vel.y += p.gravity * dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);
      const t = p.life / p.maxLife;
      p.mat.opacity = t;
      p.mesh.scale.setScalar(p.baseScale * (0.6 + 0.4 * t));
    }
  }

  clear() {
    for (const p of this.particles) this._disposeParticle(p);
    this.particles.length = 0;
    this.budget.reset();
    if (this._sharedGeo) {
      this._sharedGeo.dispose();
      this._sharedGeo = null;
    }
  }
}
