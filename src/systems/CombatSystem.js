// CombatSystem manages projectiles in flight and applies damage on hit.
import * as THREE from 'three';

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
    this.scene.add(mesh);
    proj.mesh = mesh;

    if (proj.speed > 5) {
      const light = new THREE.PointLight(opts.color, 0.6, 3);
      mesh.add(light);
    }

    this.projectiles.push(proj);
  }

  update(dt, world) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      if (p.delay > 0) {
        p.delay -= dt;
        continue;
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

      const targetPos = p.target.group.position.clone().setY(0.9);
      const dir = targetPos.clone().sub(p.pos);
      const dist = dir.length();
      if (dist < 0.001) {
        this._onHit(p, world);
        this._remove(i);
        continue;
      }
      dir.normalize();
      const step = p.speed * dt;
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
    const targetWasAlive = p.target.alive;
    const targetMaxHp = p.target.maxHp || 100;

    if (p.splashRadius > 0) {
      const targets = p.fromEnemy ? world.units : world.enemies;
      let anyKilled = false;
      for (const t of targets) {
        if (!t.alive) continue;
        const d = t.group.position.distanceTo(p.pos);
        if (d <= p.splashRadius) {
          const falloff = 1 - (d / p.splashRadius) * 0.4;
          const wasAlive = t.alive;
          t.takeDamage(p.damage * falloff, p.owner);
          if (wasAlive && !t.alive) anyKilled = true;
          this._applyStatus(p, t);
        }
      }
      const base = p.fromEnemy ? world.playerBase : world.enemyBase;
      const bd = base.group.position.distanceTo(p.pos);
      if (bd <= p.splashRadius) base.takeDamage(p.damage * 0.5, p.owner);
      if (this.vfx) this.vfx.spawnExplosion(p.pos.clone(), p.color, p.splashRadius);
      if (world.combatFeel) world.combatFeel.impact(anyKilled ? 'ko' : 'heavy');
    } else {
      p.target.takeDamage(p.damage, p.owner);
      const killed = targetWasAlive && !p.target.alive;
      this._applyStatus(p, p.target);
      if (this.vfx) this.vfx.spawnHitSpark(p.pos.clone(), p.color);
      if (world.combatFeel) world.combatFeel.impactFromDamage(p.damage, targetMaxHp, killed);
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
