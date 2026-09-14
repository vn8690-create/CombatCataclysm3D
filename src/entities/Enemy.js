// Enemy combatant. Walks left, attacks player units/base.
// Supports specials: split, steal, fly, summon (boss), enrage (boss), aoe (boss).
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';

function buildEnemyMesh(config) {
  const mat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.6, metalness: 0.1 });
  const accentMat = new THREE.MeshStandardMaterial({ color: config.accent, roughness: 0.5, metalness: 0.2 });
  const group = new THREE.Group();
  let body;
  switch (config.modelType) {
    case 'box': body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.7), mat); break;
    case 'capsule': body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.8, 4, 8), mat); break;
    case 'sphere': body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat); break;
    case 'cylinder': body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.1, 12), mat); break;
    case 'cone': body = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.3, 8), mat); break;
    default: body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.7), mat);
  }
  body.position.y = 0.7;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), eyeMat);
  eyeL.position.set(0.18, 0.95, 0.45);
  group.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = -0.18;
  group.add(eyeR);

  if (config.isBoss) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.7, 5), accentMat);
    crown.position.y = 1.7;
    group.add(crown);
  }

  group.scale.setScalar(config.scale || 1);
  return { group, body, mat, accentMat };
}

export class Enemy {
  constructor(opts) {
    this.scene = opts.scene;
    this.vfx = opts.vfx;
    this.config = opts.config;
    this.x = opts.x;
    this.side = 'enemy';
    this.isBoss = !!this.config.isBoss;

    const hpMul = opts.hpMul || 1;
    const atkMul = opts.atkMul || 1;
    this.maxHp = Math.round(this.config.hp * hpMul);
    this.hp = this.maxHp;
    this.attack = this.config.attack * atkMul;
    this.range = this.config.range;
    this.attackSpeed = this.config.attackSpeed;
    this.moveSpeed = this.config.moveSpeed;
    this.attackType = this.config.attackType;
    this.special = this.config.special;
    this.reward = this.config.reward || 10;

    this.attackCd = 0.5;
    this.alive = true;
    this.stunTimer = 0;
    this.burnTimer = 0;
    this.burnDps = 0;
    this.burnTickT = 0;
    this.knockbackVel = 0;
    this.flyHeight = this.config.flyHeight || 0;
    this.hitReactTimer = 0;
    this.hitReactStrength = 0;
    this.attackAnimTimer = 0;

    this.bossSpecialCd = this.isBoss ? 6.0 : 0;
    this.summonTimer = this.config.summonInterval || 0;
    this.enraged = false;
    this._splitDone = false;
    this.stealCd = 0;

    const built = buildEnemyMesh(this.config);
    this.group = built.group;
    this.body = built.body;
    this.mat = built.mat;
    this.accentMat = built.accentMat;
    this.group.position.set(this.x, this.flyHeight, 0);
    this.scene.add(this.group);

    this._buildBar();
  }

  _buildBar() {
    const w = this.isBoss ? 2.4 : 1.0;
    this.barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(w, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x110011, transparent: true, opacity: 0.85 })
    );
    this.barBg.position.y = this.isBoss ? 2.4 : 1.6;
    this.group.add(this.barBg);
    this.barFill = new THREE.Mesh(
      new THREE.PlaneGeometry(w, 0.14),
      new THREE.MeshBasicMaterial({ color: this.isBoss ? 0xff6633 : 0xff8050 })
    );
    this.barFill.position.y = this.barBg.position.y;
    this.barFill.position.z = 0.01;
    this.group.add(this.barFill);
  }

  applyBurn(dps, duration) {
    if (dps <= 0) return;
    this.burnDps = Math.max(this.burnDps, dps);
    this.burnTimer = Math.max(this.burnTimer, duration);
  }

  applyStun(duration) {
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  applyKnockback(force) {
    if (this.isBoss) return;
    this.knockbackVel = Math.abs(force);
  }

  reactToHit(level = 'light') {
    const strength = level === 'heavy' ? 1 : level === 'medium' ? 0.72 : 0.48;
    this.hitReactStrength = Math.max(this.hitReactStrength, strength);
    this.hitReactTimer = Math.max(this.hitReactTimer, 0.12 + strength * 0.04);
  }

  _triggerAttackAnim() {
    this.attackAnimTimer = Math.max(this.attackAnimTimer, this.isBoss ? 0.16 : 0.12);
  }

  _updateJuice(dt) {
    this.hitReactTimer = Math.max(0, this.hitReactTimer - dt);
    this.attackAnimTimer = Math.max(0, this.attackAnimTimer - dt);

    if (this.hitReactTimer > 0) {
      const pulse = Math.sin((this.hitReactTimer / 0.18) * Math.PI);
      const s = this.hitReactStrength * Math.max(0, pulse);
      this.body.scale.set(1 + 0.16 * s, 1 - 0.13 * s, 1 + 0.08 * s);
      return;
    }

    if (this.attackAnimTimer > 0) {
      const duration = this.isBoss ? 0.16 : 0.12;
      const pulse = Math.sin((this.attackAnimTimer / duration) * Math.PI);
      const boost = this.isBoss ? 1.25 : 1;
      this.body.scale.set(1 + 0.10 * pulse * boost, 1 - 0.05 * pulse, 1 + 0.04 * pulse * boost);
      return;
    }

    this.hitReactStrength = 0;
    this.body.scale.set(1, 1, 1);
  }

  takeDamage(amount, source) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.vfx) this.vfx.spawnHitSpark(this.group.position.clone().setY(0.8), 0xffaaaa);
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
    this._updateBar();
  }

  die() {
    this.alive = false;
    if (this.vfx) this.vfx.spawnDeathBurst(this.group.position.clone().setY(0.7), this.config.color);
    if (this.special === 'split' && !this._splitDone && this.config.splitInto) {
      this._splitDone = true;
      if (this.onSplit) {
        for (let i = 0; i < (this.config.splitCount || 2); i++) {
          this.onSplit(this.config.splitInto, this.group.position.x + (i === 0 ? -0.4 : 0.4));
        }
      }
    }
    this.scene.remove(this.group);
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }

  _updateBar() {
    const f = Math.max(0, this.hp / this.maxHp);
    this.barFill.scale.x = f;
    this.barFill.position.x = -(this.barBg.geometry.parameters.width / 2) * (1 - f);
    if (this.isBoss) {
      if (f < 0.4 && !this.enraged && this.config.special === 'enrage') this._triggerEnrage();
    }
  }

  _triggerEnrage() {
    if (this.enraged) return;
    this.enraged = true;
    this.attack *= this.config.enrageAtkMul || 1.5;
    this.moveSpeed *= this.config.enrageSpdMul || 1.3;
    this.mat.color.setHex(0xff3366);
    this.barFill.material.color.setHex(0xff2222);
    if (this.vfx) this.vfx.spawnHitSpark(this.group.position.clone().setY(1.2), 0xff2222);
  }

  findTarget(units, playerBase) {
    let best = null;
    let bestDist = Infinity;
    for (const u of units) {
      if (!u.alive) continue;
      const d = this.group.position.x - u.group.position.x;
      if (u.tauntActive) {
        const dist = Math.abs(d);
        if (dist < BALANCE.TAUNT_RADIUS + 1.0 && dist < bestDist + 100) {
          best = u; bestDist = dist;
          continue;
        }
      }
      if (d > 0 && d < bestDist) {
        bestDist = d; best = u;
      }
    }
    const baseDist = this.group.position.x - playerBase.x;
    if (best && bestDist <= this.range) return { target: best, dist: bestDist };
    if (bestDist <= this.range) return { target: best, dist: bestDist };
    if (baseDist <= this.range) return { target: playerBase, dist: baseDist };
    return { target: null, dist: Math.min(bestDist, baseDist) };
  }

  update(dt, world) {
    if (!this.alive) return;
    this._updateJuice(dt);

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickT -= dt;
      if (this.burnTickT <= 0) {
        this.burnTickT = BALANCE.BURN_TICK;
        this.takeDamage(this.burnDps * BALANCE.BURN_TICK, 'burn');
        if (!this.alive) return;
      }
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return;
    }

    if (this.knockbackVel > 0.01) {
      this.group.position.x += this.knockbackVel * dt;
      this.knockbackVel *= 0.88;
    } else {
      this.knockbackVel = 0;
    }

    if (this.isBoss && this.bossSpecialCd > 0) {
      this.bossSpecialCd -= dt;
      if (this.bossSpecialCd <= 0) {
        this.bossSpecialCd = 7.0;
        this._doBossSpecial(world);
      }
    }

    if (this.special === 'summon' && this.summonTimer > 0) {
      this.summonTimer -= dt;
      if (this.summonTimer <= 0) {
        this.summonTimer = this.config.summonInterval;
        if (this.onSummon) {
          for (let i = 0; i < (this.config.summonCount || 2); i++) {
            this.onSummon(this.config.summonId, this.group.position.x + 0.5 + i * 0.3);
          }
        }
      }
    }

    if (this.stealCd > 0) this.stealCd -= dt;

    const { target, dist } = this.findTarget(world.units, world.playerBase);

    if (target && dist <= this.range) {
      this.attackCd -= dt;
      if (this.attackCd <= 0) {
        this.attackCd = 1 / this.attackSpeed;
        this._performAttack(target, world);
      }
    } else {
      this.group.position.x -= this.moveSpeed * dt;
      this._walkAnim(dt);
    }

    if (this.group.position.x < world.playerBase.x + 1.0) this.group.position.x = world.playerBase.x + 1.0;
    if (this.group.position.x > BALANCE.ENEMY_BASE_X - 1.0) this.group.position.x = BALANCE.ENEMY_BASE_X - 1.0;
  }

  _performAttack(target, world) {
    this._triggerAttackAnim();

    if (this.attackType === 'ranged') {
      world.combat.spawnProjectile({
        from: this.group.position.clone().setY(0.9),
        target,
        speed: this.config.projectileSpeed || 9,
        damage: this.attack,
        color: this.config.projectileColor || 0xff4466,
        owner: this,
        special: this.special === 'aoe' ? 'splash' : null,
        splashRadius: this.config.splashRadius || 0,
        fromEnemy: true,
      });
    } else {
      const wasAlive = target.alive;
      const maxHp = target.maxHp || 100;
      target.takeDamage(this.attack, this);
      const killed = wasAlive && !target.alive;
      const level = world.combatFeel?.impactFromDamage(this.attack, maxHp, killed) || (this.isBoss ? 'heavy' : 'light');
      if (!killed && target.reactToHit) target.reactToHit(level);
      if (this.isBoss && world.combatFeel && !killed) world.combatFeel.impact('heavy');

      if (this.special === 'steal' && this.stealCd <= 0 && target === world.playerBase) {
        this.stealCd = 3.0;
        if (world.economy) {
          const stolen = world.economy.spend(this.config.stealAmount || 20);
          if (stolen > 0 && this.vfx) this.vfx.spawnCoinBurst(world.playerBase.group.position.clone().setY(2.0), stolen);
        }
      }
    }
  }

  _doBossSpecial(world) {
    if (!world.combat) return;
    this._triggerAttackAnim();
    world.combatFeel?.impact('boss');
    const sx = this.group.position.x;
    switch (this.config.bossSpecial) {
      case 'paper_storm': {
        for (let i = 0; i < 5; i++) {
          world.combat.spawnProjectile({
            from: new THREE.Vector3(sx, 1.4, 0),
            target: world.playerBase,
            speed: 8,
            damage: this.attack * 0.7,
            color: 0xffcc33,
            owner: this,
            special: 'splash',
            splashRadius: 1.8,
            fromEnemy: true,
            delay: i * 0.15,
          });
        }
        if (this.vfx) this.vfx.spawnShockwave(this.group.position.clone().setY(1.0), 0xffcc33);
        break;
      }
      case 'tax_breath': {
        for (const u of world.units) {
          if (!u.alive) continue;
          const d = sx - u.group.position.x;
          if (d > 0 && d < 4.0) {
            const dealt = this.attack * 1.2;
            const wasAlive = u.alive;
            const maxHp = u.maxHp || 100;
            u.takeDamage(dealt, this);
            const killed = wasAlive && !u.alive;
            if (!killed) u.reactToHit?.(world.combatFeel?.classifyDamage(dealt, maxHp, false) || 'heavy');
            u.applyBurn && u.applyBurn(20, 2.0);
          }
        }
        if (this.vfx) this.vfx.spawnConeBreath(this.group.position.clone().setY(1.2), 0x88aa44);
        break;
      }
      case 'summon_wave': {
        if (this.onSummon) {
          for (let i = 0; i < 3; i++) this.onSummon(this.config.summonId || 'deadline_demon', sx - 0.5 - i * 0.4);
        }
        if (this.vfx) this.vfx.spawnShockwave(this.group.position.clone().setY(1.0), 0xff4466);
        break;
      }
      case 'algorithm_burst': {
        const targets = world.units.filter(u => u.alive).slice(0, 6);
        if (targets.length === 0) targets.push(world.playerBase);
        targets.forEach((t, i) => {
          world.combat.spawnProjectile({
            from: new THREE.Vector3(sx, 1.4, 0),
            target: t,
            speed: 11,
            damage: this.attack * 0.8,
            color: 0x66aaff,
            owner: this,
            fromEnemy: true,
            delay: i * 0.1,
          });
        });
        if (this.vfx) this.vfx.spawnShockwave(this.group.position.clone().setY(1.0), 0x66aaff);
        break;
      }
    }
  }

  _walkAnim(dt) {
    const t = performance.now() * 0.001 * 6;
    this.body.position.y = 0.7 + Math.abs(Math.sin(t)) * 0.1;
    this.body.rotation.z = Math.sin(t) * 0.06;
  }

  destroy() {
    if (!this.alive) return;
    this.alive = false;
    this.scene.remove(this.group);
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }
}
