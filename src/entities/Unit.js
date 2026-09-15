// Player-deployed combatant. Walks right, attacks enemies in range.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';

const BATTLE_TEXTURES = new Map();

function getBattleTexture(url) {
  if (!url) return null;
  if (BATTLE_TEXTURES.has(url)) return BATTLE_TEXTURES.get(url);
  const texture = new THREE.TextureLoader().load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  BATTLE_TEXTURES.set(url, texture);
  return texture;
}

function buildSpriteBody(config) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  const width = config.battleSpriteWidth || 1.55;
  const height = config.battleSpriteHeight || 2.1;
  body.position.y = height * 0.5;

  const spriteMat = new THREE.SpriteMaterial({
    map: getBattleTexture(config.battleSprite),
    color: 0xffffff,
    transparent: true,
    alphaTest: 0.04,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(width, height, 1);
  sprite.center.set(0.5, 0.5);
  body.add(sprite);
  group.add(body);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.52, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.35, 0.58, 1);
  shadow.position.set(0, 0.012, 0);
  group.add(shadow);

  return { group, body, mat: spriteMat, accentMat: spriteMat, isSprite: true };
}

function buildBodyMesh(config) {
  if (config.battleSprite) return buildSpriteBody(config);

  const mat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.55, metalness: 0.15 });
  const accentMat = new THREE.MeshStandardMaterial({ color: config.accent, roughness: 0.5, metalness: 0.2 });
  const group = new THREE.Group();
  let body;

  switch (config.modelType) {
    case 'capsule':
      body = new THREE.Mesh(new THREE.CapsuleGeometry(.45, .8, 4, 8), mat);
      body.position.y = .85;
      break;
    case 'sphere':
      body = new THREE.Mesh(new THREE.SphereGeometry(.55, 16, 12), mat);
      body.position.y = .7;
      break;
    case 'cylinder':
      body = new THREE.Mesh(new THREE.CylinderGeometry(.55, .65, 1.1, 12), mat);
      body.position.y = .7;
      break;
    case 'cone':
      body = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.3, 8), mat);
      body.position.y = .75;
      break;
    default:
      body = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.2, .7), mat);
      body.position.y = .6;
  }

  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), accentMat);
  eyeL.position.set(.18, .85, .42);
  group.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = -.18;
  group.add(eyeR);

  if (config.special) {
    const mark = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), accentMat);
    mark.position.y = 1.35;
    group.add(mark);
  }

  group.scale.setScalar(config.scale || 1);
  return { group, body, mat, accentMat, isSprite: false };
}

function targetPosition(target, fallbackX) {
  if (target?.group?.position) return target.group.position.clone();
  return new THREE.Vector3(Number.isFinite(target?.x) ? target.x : fallbackX, 0.7, 0);
}

export class Unit {
  constructor(opts) {
    this.scene = opts.scene;
    this.vfx = opts.vfx;
    this.config = opts.config;
    this.stats = opts.stats;
    this.x = opts.x;
    this.side = 'player';
    this.maxHp = Math.round(this.config.hp * this.stats.hpMul);
    this.hp = this.maxHp;
    this.attack = this.config.attack * this.stats.attackMul;
    this.range = this.config.range;
    this.attackSpeed = this.config.attackSpeed;
    this.moveSpeed = this.config.moveSpeed;
    this.attackType = this.config.attackType;
    this.special = this.config.special;
    this.burnDamage = (this.config.burnDamage || 0) * this.stats.burnMul;
    this.attackCd = 0;
    this.alive = true;
    this.stunTimer = 0;
    this.burnTimer = 0;
    this.burnDps = 0;
    this.burnTickT = 0;
    this.knockbackVel = 0;
    this.dashCd = 0;
    this.dashing = false;
    this.dashTimer = 0;
    this.tauntActive = this.special === 'taunt';
    this.hitReactTimer = 0;
    this.hitReactDuration = 0;
    this.hitReactStrength = 0;
    this.attackAnimTimer = 0;
    this.attackAnimDuration = 0;
    this.animClock = Math.random() * 10;
    this.walkFxCd = 0;
    this.comicFxCd = 0;
    this.personality = this.config.dna?.id || this.config.id;

    const built = buildBodyMesh(this.config);
    this.group = built.group;
    this.body = built.body;
    this.isSpriteBody = built.isSprite;
    this.baseBodyX = built.body.position.x;
    this.baseBodyY = built.body.position.y;
    this.mat = built.mat;
    this.accentMat = built.accentMat;
    this.group.position.set(this.x, 0, 0);
    this.scene.add(this.group);
    this._buildBar();

    if (this.personality === 'gym_uncle') {
      this.vfx?.spawnDeployPuff(this.group.position.clone(), 0xffd84d);
    }
  }

  _buildBar() {
    const barY = this.config.battleBarY || 1.7;
    this.barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1, .14),
      new THREE.MeshBasicMaterial({ color: 0x110011, transparent: true, opacity: .85 })
    );
    this.barBg.position.set(0, barY, .08);
    this.group.add(this.barBg);

    this.barFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1, .14),
      new THREE.MeshBasicMaterial({ color: 0x50d070 })
    );
    this.barFill.position.set(0, barY, .09);
    this.group.add(this.barFill);
  }

  applyBurn(d, dur) {
    if (d <= 0) return;
    this.burnDps = Math.max(this.burnDps, d);
    this.burnTimer = Math.max(this.burnTimer, dur);
  }

  applyStun(d) { this.stunTimer = Math.max(this.stunTimer, d); }
  applyKnockback(f) { this.knockbackVel = -Math.abs(f); }

  reactToHit(l = 'light') {
    const s = l === 'heavy' ? 1 : l === 'medium' ? .72 : .48;
    const duration = this.personality === 'gym_uncle' ? .28 : .12 + s * .04;
    this.hitReactStrength = Math.max(this.hitReactStrength, s);
    this.hitReactTimer = Math.max(this.hitReactTimer, duration);
    this.hitReactDuration = Math.max(this.hitReactDuration, duration);
  }

  _triggerAttackAnim() {
    const duration = this.personality === 'gym_uncle' ? .56 : .14;
    this.attackAnimTimer = Math.max(this.attackAnimTimer, duration);
    this.attackAnimDuration = Math.max(this.attackAnimDuration, duration);
  }

  _resetBodyPose() {
    this.body.position.x = this.baseBodyX;
    this.body.position.y = this.baseBodyY;
    this.body.rotation.x = 0;
    this.body.rotation.z = 0;
    this.body.scale.set(1, 1, 1);
  }

  _updateJuice(dt) {
    this.hitReactTimer = Math.max(0, this.hitReactTimer - dt);
    this.attackAnimTimer = Math.max(0, this.attackAnimTimer - dt);
    this.comicFxCd = Math.max(0, this.comicFxCd - dt);

    if (this.hitReactTimer > 0) {
      const dur = Math.max(.001, this.hitReactDuration);
      const p = 1 - this.hitReactTimer / dur;
      const wave = Math.sin(p * Math.PI);
      const s = this.hitReactStrength * wave;
      this.body.position.x = this.baseBodyX - .08 * s;
      this.body.position.y = this.baseBodyY + .035 * wave;
      this.body.rotation.z = this.personality === 'gym_uncle' ? .16 * wave : .05 * wave;
      this.body.scale.set(1 + .11 * s, 1 - .09 * s, 1);
      return true;
    }

    if (this.attackAnimTimer > 0) {
      const dur = Math.max(.001, this.attackAnimDuration);
      const p = 1 - this.attackAnimTimer / dur;
      if (this.personality === 'gym_uncle') {
        let rot = 0;
        let x = 0;
        let y = 0;
        let sx = 1;
        let sy = 1;

        if (p < .32) {
          const k = p / .32;
          rot = .22 * k;
          x = -.08 * k;
          y = .035 * k;
          sx = 1 - .035 * k;
          sy = 1 + .045 * k;
        } else if (p < .56) {
          const k = (p - .32) / .24;
          rot = .22 + (-.58) * k;
          x = -.08 + .28 * k;
          y = .035 - .12 * k;
          sx = .965 + .14 * k;
          sy = 1.045 - .16 * k;
        } else {
          const k = (p - .56) / .44;
          rot = -.36 * (1 - k);
          x = .20 * (1 - k);
          y = -.085 * (1 - k);
          sx = 1.105 - .105 * k;
          sy = .885 + .115 * k;
        }

        this.body.position.x = this.baseBodyX + x;
        this.body.position.y = this.baseBodyY + y;
        this.body.rotation.z = rot;
        this.body.scale.set(sx, sy, 1);
      } else {
        const wave = Math.sin(p * Math.PI);
        this.body.rotation.z = this.personality === 'manager' ? .16 * wave : -.14 * wave;
        this.body.scale.set(1 + .08 * wave, 1 - .045 * wave, 1);
      }
      return true;
    }

    this.hitReactStrength = 0;
    this.hitReactDuration = 0;
    this.attackAnimDuration = 0;
    return false;
  }

  takeDamage(a) {
    if (!this.alive) return;
    this.hp -= a;
    this.vfx?.spawnHitSpark(this.group.position.clone().setY(.8), 0xffcc66);
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
    this._updateBar();
  }

  die() {
    this.alive = false;
    this.vfx?.spawnDeathBurst(this.group.position.clone().setY(.7), this.config.color);
    if (this.personality === 'gym_uncle') {
      this.vfx?.spawnComicText(this.group.position.clone().setY(.8), 'LEG DAY?!', '#ffb84d');
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
    this.barFill.position.x = -.5 * (1 - f);
    f < .35 ? this.barFill.material.color.setHex(0xff5050) : this.barFill.material.color.setHex(0x50d070);
  }

  findTarget(es, b) {
    let best = null;
    let bd = Infinity;
    for (const e of es) {
      if (!e.alive) continue;
      const d = Math.abs(e.group.position.x - this.group.position.x);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    const base = Math.max(0, b.x - this.group.position.x);
    if (best && bd <= this.range) return { target: best, dist: bd };
    if (base <= this.range) return { target: b, dist: base };
    return { target: null, dist: Math.min(bd, base) };
  }

  update(dt, w) {
    if (!this.alive) return;
    this.animClock += dt;
    const lockedPose = this._updateJuice(dt);

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickT -= dt;
      if (this.burnTickT <= 0) {
        this.burnTickT = BALANCE.BURN_TICK;
        this.takeDamage(this.burnDps * BALANCE.BURN_TICK);
        if (!this.alive) return;
      }
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (!lockedPose) this._idle();
      return;
    }

    if (this.knockbackVel < -.01) {
      this.group.position.x += this.knockbackVel * dt;
      this.knockbackVel *= Math.pow(.88, dt * 60);
    } else {
      this.knockbackVel = 0;
    }

    if (this.special === 'dash' && !this.dashing && this.dashCd <= 0) {
      const e = w.enemies.find(e => e.alive && (e.group.position.x - this.group.position.x) > 0 && (e.group.position.x - this.group.position.x) < BALANCE.DASH_RANGE + 1);
      if (e) {
        this.dashing = true;
        this.dashTimer = .25;
        this.dashCd = 3;
        this.vfx?.spawnDashTrail(this.group.position.clone());
      }
    }

    if (this.dashCd > 0) this.dashCd -= dt;
    if (this.dashing) {
      this.dashTimer -= dt;
      this.group.position.x += BALANCE.DASH_SPEED * dt;
      for (const e of w.enemies) {
        if (!e.alive) continue;
        const d = Math.abs(e.group.position.x - this.group.position.x);
        if (d < .8 && !(e._dashHitBy && e._dashHitBy.has(this))) {
          const was = e.alive;
          const max = e.maxHp || 100;
          const dealt = this.attack * 1.2;
          e.takeDamage(dealt, this);
          const killed = was && !e.alive;
          const level = w.combatFeel?.impactFromDamage(dealt, max, killed) || 'medium';
          if (!killed) e.reactToHit?.(level);
          if (!e._dashHitBy) e._dashHitBy = new Set();
          e._dashHitBy.add(this);
        }
      }
      if (this.dashTimer <= 0) this.dashing = false;
      if (!lockedPose) this._walkAnim(true);
      return;
    }

    const { target, dist } = this.findTarget(w.enemies, w.enemyBase);
    if (target && dist <= this.range) {
      this.attackCd -= dt;
      if (this.attackCd <= 0) {
        this.attackCd = 1 / this.attackSpeed;
        this._performAttack(target, w);
      }
      if (!lockedPose && this.attackAnimTimer <= 0) this._idle();
    } else {
      this.group.position.x += this.moveSpeed * dt;
      if (this.personality === 'gym_uncle') {
        this.walkFxCd -= dt;
        if (this.walkFxCd <= 0) {
          this.walkFxCd = .42;
          this.vfx?.spawnFootDust(this.group.position.clone());
        }
      }
      if (!lockedPose) this._walkAnim(false);
    }

    this.group.position.x = Math.min(w.enemyBase.x - 1, Math.max(BALANCE.PLAYER_BASE_X + 1, this.group.position.x));
  }

  _performAttack(t, w) {
    this._triggerAttackAnim();

    if (this.attackType === 'ranged') {
      w.combat.spawnProjectile({
        from: this.group.position.clone().setY(.9),
        target: t,
        speed: this.config.projectileSpeed,
        damage: this.attack,
        color: this.config.projectileColor || 0xffcc66,
        owner: this,
        special: this.special,
        splashRadius: this.config.splashRadius || 0,
        burnDamage: this.burnDamage,
        stunDuration: this.special === 'stun' ? BALANCE.STUN_BASE_DURATION * this.stats.stunMul : 0,
      });
      return;
    }

    const was = t.alive;
    const max = t.maxHp || 100;
    t.takeDamage(this.attack, this);
    const killed = was && !t.alive;
    const level = w.combatFeel?.impactFromDamage(this.attack, max, killed) || 'light';
    if (!killed) t.reactToHit?.(level);
    if (this.special === 'stun') t.applyStun?.(BALANCE.STUN_BASE_DURATION * this.stats.stunMul);
    if (this.special === 'burn') t.applyBurn?.(this.burnDamage, BALANCE.BURN_DURATION);
    if (t.applyKnockback && t.side === 'enemy') t.applyKnockback(BALANCE.KNOCKBACK_FORCE);

    if (this.personality === 'gym_uncle') {
      const impact = targetPosition(t, this.group.position.x + this.range).setY(.72);
      this.vfx?.spawnGymImpact(impact);
      if (this.comicFxCd <= 0 && Math.random() < .5) {
        this.comicFxCd = 1.4;
        this.vfx?.spawnComicText(impact, Math.random() < .5 ? 'ORA!' : 'BỐP!', '#ffe04d');
      }
    }
  }

  _walkAnim(fast) {
    const speed = fast ? 10 : this.personality === 'gym_uncle' ? 5.2 : this.personality === 'manager' ? 5 : 8;
    const t = this.animClock * speed;

    if (this.personality === 'gym_uncle') {
      this.body.position.x = this.baseBodyX + Math.sin(t * .5) * .015;
      this.body.position.y = this.baseBodyY + Math.abs(Math.sin(t)) * .05;
      this.body.rotation.z = Math.sin(t) * .055;
      this.body.rotation.x = 0;
      this.body.scale.set(1 + Math.abs(Math.sin(t)) * .018, 1 - Math.abs(Math.sin(t)) * .012, 1);
    } else if (this.personality === 'manager') {
      this.body.position.y = this.baseBodyY + Math.abs(Math.sin(t)) * .025;
      this.body.rotation.z = Math.sin(t) * .035;
    } else {
      this.body.position.y = this.baseBodyY + Math.abs(Math.sin(t)) * .12;
      this.body.rotation.z = Math.sin(t) * .08;
    }
  }

  _idle() {
    const t = this.animClock * (this.personality === 'gym_uncle' ? 2.2 : this.personality === 'manager' ? 3 : 4);
    this.body.position.x = this.baseBodyX;
    this.body.position.y = this.baseBodyY + Math.abs(Math.sin(t)) * (this.personality === 'gym_uncle' ? .018 : .04);
    this.body.rotation.x = 0;
    if (this.personality === 'manager') this.body.rotation.z = Math.sin(t * .7) * .045;
    else if (this.personality === 'gym_uncle') this.body.rotation.z = Math.sin(t * .55) * .016;
    else this.body.rotation.z = 0;
    this.body.scale.set(1, 1, 1);
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
