// CombatSystem manages projectiles in flight and applies damage on hit.
import * as THREE from 'three';
import { applyImpact, impactPosition } from './CombatImpact.js';

export class CombatSystem {
  constructor(scene, vfx) {
    this.scene = scene;
    this.vfx = vfx;
    this.projectiles = [];
  }

  spawnProjectile(opts) {
    const proj = {
      pos: opts.from.clone(),
      target: opts.target,
      speed: opts.speed,
      damage: opts.damage,
      color: opts.color,
      owner: opts.owner,
      special: opts.special || null,
      splashRadius: opts.splashRadius || 0,
      burnDamage: opts.burnDamage || 0,
      stunDuration: opts.stunDuration || 0,
      fromEnemy: !!opts.fromEnemy,
      delay: opts.delay || 0,
      alive: true,
      mesh: null,
    };

    const geo = new THREE.SphereGeometry(0.18, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color: opts.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(proj.pos);
    mesh.visible = proj.delay <= 0;
    this.scene.add(mesh);
    proj.mesh = mesh;

    this.projectiles.push(proj);
  }

  update(dt, world) {
    if (!(dt > 0) || world.paused) return;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      let travelDt = dt;
      if (p.delay > 0) {
        if (!p.owner?.alive || p.owner.stunTimer > 0) { this._remove(i); continue; }
        const delay = p.delay;
        p.delay = Math.max(0, delay - dt);
        if (p.delay > 0) continue;
        travelDt = dt - delay;
        p.mesh.visible = true;
      }

      if (!p.alive || !p.target || !p.target.alive) {
        const list = p.fromEnemy ? world.units : world.enemies;
        const base = p.fromEnemy ? world.playerBase : world.enemyBase;
        let best = null;
        let bd = Infinity;
        for (const e of list) {
          if (!e.alive) continue;
          const d = e.group.position.distanceTo(p.pos);
          if (d < bd) { bd = d; best = e; }
        }
        if (best) p.target = best;
        else p.target = base;
      }

      if (!p.target?.alive) { this._remove(i); continue; }
      const targetPos = p.target.isPlayer !== undefined ? impactPosition(p.target, p.pos) : p.target.group.position.clone().setY(0.9);
      const dir = targetPos.clone().sub(p.pos);
      const dist = dir.length();
      if (dist < 0.001) {
        this._onHit(p, world);
        this._remove(i);
        continue;
      }
      dir.normalize();
      const step = p.speed * travelDt;
      if (step >= dist) {
        p.pos.copy(targetPos);
        this._onHit(p, world);
        this._remove(i);
      } else {
        p.pos.add(dir.multiplyScalar(step));
        p.mesh.position.copy(p.pos);
      }
    }
  }

  _onHit(p, world) {
    if (!p.target || !p.target.alive) return;

    if (p.splashRadius > 0) {
      const targets = p.fromEnemy ? world.units : world.enemies;
      let anyKilled = false;
      for (const t of targets) {
        if (!t.alive) continue;
        const d = t.group.position.distanceTo(p.pos);
        if (d <= p.splashRadius) {
          const falloff = 1 - (d / p.splashRadius) * 0.4;
          const dealt = p.damage * falloff;
          const killed = applyImpact(t, dealt, p.owner, world, { position: p.pos, camera: false, effects: false });
          if (killed) anyKilled = true;
          this._applyStatus(p, t);
        }
      }
      const base = p.fromEnemy ? world.playerBase : world.enemyBase;
      const bd = base.group.position.distanceTo(p.pos);
      if (p.target === base || bd <= p.splashRadius) applyImpact(base, p.damage * 0.5, p.owner, world, { position: p.pos, camera: false, effects: false });
      if (this.vfx) this.vfx.spawnExplosion(p.pos.clone(), p.color, p.splashRadius);
      if (world.combatFeel) world.combatFeel.impact(p.target === base ? 'base' : anyKilled ? 'ko' : p.owner?.isBoss ? 'boss' : 'heavy');
    } else {
      applyImpact(p.target, p.damage, p.owner, world, { position: p.pos, color: p.color });
      this._applyStatus(p, p.target);
    }
  }

  _applyStatus(p, target) {
    if (!target) return;
    if (p.special === 'burn' && target.applyBurn && p.burnDamage > 0) target.applyBurn(p.burnDamage, 2.5);
    if (p.special === 'stun' && target.applyStun && p.stunDuration > 0) target.applyStun(p.stunDuration);
    if (target.applyKnockback && target.side === (p.fromEnemy ? 'player' : 'enemy')) target.applyKnockback(1.2);
  }

  _remove(i) {
    const p = this.projectiles[i];
    if (p.mesh) {
      this.scene.remove(p.mesh);
      p.mesh.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    this.projectiles.splice(i, 1);
  }

  clear() {
    for (const p of this.projectiles) {
      if (p.mesh) {
        this.scene.remove(p.mesh);
        p.mesh.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
      }
    }
    this.projectiles.length = 0;
  }
}
