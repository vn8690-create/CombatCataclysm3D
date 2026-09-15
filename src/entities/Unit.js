// Player-deployed combatant. Walks right, attacks enemies in range.
import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';

function buildBodyMesh(config) {
  const mat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.55, metalness: 0.15 });
  const accentMat = new THREE.MeshStandardMaterial({ color: config.accent, roughness: 0.5, metalness: 0.2 });
  const group = new THREE.Group();
  let body;
  switch (config.modelType) {
    case 'capsule': body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.8, 4, 8), mat); body.position.y = 0.85; break;
    case 'sphere': body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat); body.position.y = 0.7; break;
    case 'cylinder': body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.1, 12), mat); body.position.y = 0.7; break;
    case 'cone': body = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.3, 8), mat); body.position.y = 0.75; break;
    default: body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.7), mat); body.position.y = 0.6;
  }
  body.castShadow = true; body.receiveShadow = true; group.add(body);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), accentMat); eyeL.position.set(0.18, 0.85, 0.42); group.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = -0.18; group.add(eyeR);
  if (config.special) { const mark = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), accentMat); mark.position.y = 1.35; group.add(mark); }
  group.scale.setScalar(config.scale || 1);
  return { group, body, mat, accentMat };
}

export class Unit {
  constructor(opts) {
    this.scene=opts.scene; this.vfx=opts.vfx; this.config=opts.config; this.stats=opts.stats; this.x=opts.x; this.side='player';
    this.maxHp=Math.round(this.config.hp*this.stats.hpMul); this.hp=this.maxHp; this.attack=this.config.attack*this.stats.attackMul;
    this.range=this.config.range; this.attackSpeed=this.config.attackSpeed; this.moveSpeed=this.config.moveSpeed; this.attackType=this.config.attackType;
    this.special=this.config.special; this.burnDamage=(this.config.burnDamage||0)*this.stats.burnMul;
    this.attackCd=0; this.alive=true; this.stunTimer=0; this.burnTimer=0; this.burnDps=0; this.burnTickT=0; this.knockbackVel=0;
    this.dashCd=0; this.dashing=false; this.dashTimer=0; this.tauntActive=this.special==='taunt'; this.hitReactTimer=0; this.hitReactStrength=0;
    this.attackAnimTimer=0; this.animClock=Math.random()*10; this.personality=this.config.characterDNA?.id||this.config.id;
    const built=buildBodyMesh(this.config); this.group=built.group; this.body=built.body; this.baseBodyY=built.body.position.y; this.mat=built.mat; this.accentMat=built.accentMat;
    this.group.position.set(this.x,0,0); this.scene.add(this.group); this._buildBar();
  }
  _buildBar(){this.barBg=new THREE.Mesh(new THREE.PlaneGeometry(1,.14),new THREE.MeshBasicMaterial({color:0x110011,transparent:true,opacity:.85}));this.barBg.position.y=1.7;this.group.add(this.barBg);this.barFill=new THREE.Mesh(new THREE.PlaneGeometry(1,.14),new THREE.MeshBasicMaterial({color:0x50d070}));this.barFill.position.set(0,1.7,.01);this.group.add(this.barFill);}
  applyBurn(dps,duration){if(dps<=0)return;this.burnDps=Math.max(this.burnDps,dps);this.burnTimer=Math.max(this.burnTimer,duration);}
  applyStun(duration){this.stunTimer=Math.max(this.stunTimer,duration);}
  applyKnockback(force){this.knockbackVel=-Math.abs(force);}
  reactToHit(level='light'){const s=level==='heavy'?1:level==='medium'?.72:.48;this.hitReactStrength=Math.max(this.hitReactStrength,s);this.hitReactTimer=Math.max(this.hitReactTimer,.12+s*.04);}
  _triggerAttackAnim(){this.attackAnimTimer=Math.max(this.attackAnimTimer,this.personality==='gym_uncle'?.24:.14);}
  _updateJuice(dt){this.hitReactTimer=Math.max(0,this.hitReactTimer-dt);this.attackAnimTimer=Math.max(0,this.attackAnimTimer-dt);if(this.hitReactTimer>0){const p=Math.sin((this.hitReactTimer/.18)*Math.PI),s=this.hitReactStrength*Math.max(0,p);this.body.scale.set(1+.16*s,1-.13*s,1+.08*s);return;}if(this.attackAnimTimer>0){const duration=this.personality==='gym_uncle'?.24:.14,p=Math.sin((this.attackAnimTimer/duration)*Math.PI);if(this.personality==='gym_uncle'){this.body.rotation.z=-.28*p;this.body.scale.set(1+.18*p,1-.1*p,1+.08*p);}else if(this.personality==='manager'){this.body.rotation.z=.16*p;this.body.scale.set(1+.05*p,1+.09*p,1);}else this.body.scale.set(1+.1*p,1-.05*p,1+.04*p);return;}this.hitReactStrength=0;this.body.scale.set(1,1,1);}
  takeDamage(amount){if(!this.alive)return;this.hp-=amount;if(this.vfx)this.vfx.spawnHitSpark(this.group.position.clone().setY(.8),0xffcc66);if(this.hp<=0){this.hp=0;this.die();}this._updateBar();}
  die(){this.alive=false;if(this.vfx)this.vfx.spawnDeathBurst(this.group.position.clone().setY(.7),this.config.color);this.scene.remove(this.group);this.group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}
  _updateBar(){const f=Math.max(0,this.hp/this.maxHp);this.barFill.scale.x=f;this.barFill.position.x=-.5*(1-f);const c=this.barFill.material.color;f<.35?c.setHex(0xff5050):c.setHex(0x50d070);}
  findTarget(enemies,enemyBase){let best=null,bestDist=Infinity;for(const e of enemies){if(!e.alive)continue;const d=e.group.position.x-this.group.position.x;if(d>0&&d<bestDist){bestDist=d;best=e;}}const baseDist=enemyBase.x-this.group.position.x;if(best&&bestDist<=this.range)return{target:best,dist:bestDist};if(baseDist<=this.range)return{target:enemyBase,dist:baseDist};return{target:null,dist:Math.min(bestDist,baseDist)};}
  update(dt,world){if(!this.alive)return;this.animClock+=dt;this._updateJuice(dt);if(this.burnTimer>0){this.burnTimer-=dt;this.burnTickT-=dt;if(this.burnTickT<=0){this.burnTickT=BALANCE.BURN_TICK;this.takeDamage(this.burnDps*BALANCE.BURN_TICK);if(!this.alive)return;}}if(this.stunTimer>0){this.stunTimer-=dt;this._idle(dt);return;}if(this.knockbackVel<-.01){this.group.position.x+=this.knockbackVel*dt;this.knockbackVel*=Math.pow(.88,dt*60);}else this.knockbackVel=0;
    if(this.special==='dash'&&!this.dashing&&this.dashCd<=0){const e=world.enemies.find(e=>e.alive&&(e.group.position.x-this.group.position.x)>0&&(e.group.position.x-this.group.position.x)<BALANCE.DASH_RANGE+1);if(e){this.dashing=true;this.dashTimer=.25;this.dashCd=3;if(this.vfx)this.vfx.spawnDashTrail(this.group.position.clone());}}if(this.dashCd>0)this.dashCd-=dt;
    if(this.dashing){this.dashTimer-=dt;this.group.position.x+=BALANCE.DASH_SPEED*dt;for(const e of world.enemies){if(!e.alive)continue;const d=Math.abs(e.group.position.x-this.group.position.x);if(d<.8&&!(e._dashHitBy&&e._dashHitBy.has(this))){const was=e.alive,max=e.maxHp||100,dealt=this.attack*1.2;e.takeDamage(dealt,this);const killed=was&&!e.alive,level=world.combatFeel?.impactFromDamage(dealt,max,killed)||'medium';if(!killed&&e.reactToHit)e.reactToHit(level);if(!e._dashHitBy)e._dashHitBy=new Set();e._dashHitBy.add(this);}}if(this.dashTimer<=0)this.dashing=false;this._walkAnim(dt,true);return;}
    const {target,dist}=this.findTarget(world.enemies,world.enemyBase);if(target&&dist<=this.range){this.attackCd-=dt;if(this.attackCd<=0){this.attackCd=1/this.attackSpeed;this._performAttack(target,world);}this._idle(dt);}else{this.group.position.x+=this.moveSpeed*dt;this._walkAnim(dt,false);}this.group.position.x=Math.min(world.enemyBase.x-1,Math.max(BALANCE.PLAYER_BASE_X+1,this.group.position.x));}
  _performAttack(target,world){this._triggerAttackAnim();if(this.attackType==='ranged')world.combat.spawnProjectile({from:this.group.position.clone().setY(.9),target,speed:this.config.projectileSpeed,damage:this.attack,color:this.config.projectileColor||0xffcc66,owner:this,special:this.special,splashRadius:this.config.splashRadius||0,burnDamage:this.burnDamage,stunDuration:this.special==='stun'?BALANCE.STUN_BASE_DURATION*this.stats.stunMul:0});else{const was=target.alive,max=target.maxHp||100;target.takeDamage(this.attack,this);const killed=was&&!target.alive,level=world.combatFeel?.impactFromDamage(this.attack,max,killed)||'light';if(!killed&&target.reactToHit)target.reactToHit(level);if(this.special==='stun')target.applyStun?.(BALANCE.STUN_BASE_DURATION*this.stats.stunMul);if(this.special==='burn')target.applyBurn?.(this.burnDamage,BALANCE.BURN_DURATION);if(target.applyKnockback&&target.side==='enemy')target.applyKnockback(BALANCE.KNOCKBACK_FORCE);}}
  _walkAnim(dt,fast){const speed=fast?14:(this.personality==='gym_uncle'?13:this.personality==='manager'?5:8),t=this.animClock*speed;if(this.personality==='gym_uncle'){this.body.position.y=this.baseBodyY+Math.abs(Math.sin(t))*.075;this.body.rotation.z=Math.sin(t)*.14;this.body.rotation.x=Math.sin(t*2)*.035;}else if(this.personality==='manager'){this.body.position.y=this.baseBodyY+Math.abs(Math.sin(t))*.025;this.body.rotation.z=Math.sin(t)*.035;}else{this.body.position.y=this.baseBodyY+Math.abs(Math.sin(t))*.12;this.body.rotation.z=Math.sin(t)*.08;}}
  _idle(){const t=this.animClock*(this.personality==='manager'?3:4);this.body.position.y=this.baseBodyY+Math.abs(Math.sin(t))*(this.personality==='gym_uncle'?.025:.04);if(this.attackAnimTimer<=0){if(this.personality==='manager')this.body.rotation.z=Math.sin(t*.7)*.045;else if(this.personality==='gym_uncle')this.body.rotation.z=Math.sin(t*.5)*.025;}}
  destroy(){if(!this.alive)return;this.alive=false;this.scene.remove(this.group);this.group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}
}
