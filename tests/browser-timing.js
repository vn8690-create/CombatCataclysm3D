import * as THREE from 'three';
import { Unit } from '../src/entities/Unit.js';
import { Enemy } from '../src/entities/Enemy.js';
import { Base } from '../src/entities/Base.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { VFXSystem } from '../src/systems/VFXSystem.js';
import { UNIT_MAP } from '../src/config/units.js';
import { ENEMY_MAP, BOSS_MAP } from '../src/config/enemies.js';
import { defaultStats } from '../src/config/upgrades.js';
import { impactPosition } from '../src/systems/CombatImpact.js';

const check = (ok, message) => { if (!ok) throw Error(message); };
function rig(id = 'gym_uncle', base = false) {
  const scene = new THREE.Scene(), vfx = new VFXSystem(scene);
  const p = new Unit({ scene, vfx, config: UNIT_MAP[id], stats: defaultStats(), x: base ? 8.6 : 0 });
  const e = new Enemy({ scene, vfx, config: { ...ENEMY_MAP.angry_printer, hp: 10000 }, x: 1.4 });
  e.applyKnockback = () => {}; // Stationary target to isolate cadence from movement.
  const w = { units: [p], enemies: base ? [] : [e], vfx, combat: new CombatSystem(scene, vfx),
    playerBase: new Base({ scene, isPlayer: true, x: -10, maxHp: 10000, vfx }),
    enemyBase: new Base({ scene, x: 10, maxHp: 10000, vfx }) };
  let time = 0;
  const trace = [];
  w.onCombatEvent = event => trace.push({ time: +time.toFixed(4), event: event.type,
    target: event.target?.isBase ? 'base' : event.target?.config?.id,
    damage: event.damage, position: event.position?.toArray() });
  const tick = (dt = 1 / 60) => { time += dt; p.update(dt, w); w.combat.update(dt, w); vfx.update(dt); };
  const dispose = () => { p.destroy(); e.destroy(); w.combat.clear(); vfx.clear(); w.playerBase.destroy(); w.enemyBase.destroy(); };
  return { scene, p, e, w, tick, trace, dispose };
}

export async function runTimingRegression() {
  const results = [];
  let evidence;
  {
    const t = rig();
    t.tick(); check(t.p.animationState === 'anticipation' && t.e.hp === 10000, 'Gym starts with no damage');
    t.tick(.27); check(t.e.hp === 10000, 'windup cannot damage');
    t.tick(.01);
    check(t.e.hp === 10000 - t.p.attack && t.p.animationState === 'strike', 'HP drop and strike pose share frame');
    check(t.w.vfx.particles.some(p => p.kind === 'ring'), 'actual contact has impact VFX');
    t.tick(.09); check(t.p.animationState === 'recovery', 'readable recovery');
    for (let i = 0; i < 600; i++) t.tick();
    const starts = t.trace.filter(e => e.event === 'attack-start');
    const impacts = t.trace.filter(e => e.event === 'impact');
    for (let i = 1; i < starts.length; i++) check(Math.abs(starts[i].time - starts[i - 1].time - 1 / .72) < .035, 'configured cadence retained');
    check(impacts.length <= starts.length && impacts.length >= starts.length - 1, 'one hit per attack');
    evidence = t.trace.slice(0, 9);
    t.dispose(); results.push('Gym anticipation/contact/recovery, VFX frame and configured cadence');
  }
  for (const interrupt of ['die', 'destroy', 'stun']) {
    const t = rig(); t.tick();
    interrupt === 'stun' ? t.p.applyStun(1) : t.p[interrupt]();
    t.tick(.5);
    check(t.e.hp === 10000 && !t.p.attackTimeline.active, `${interrupt} cancels pending hit`);
    t.dispose();
  }
  results.push('death, scene-destroy and stun cancel pending contact');
  {
    const t = rig(); t.tick(); t.e.die(); t.tick(.3);
    check(!t.trace.some(e => e.event === 'impact'), 'dead/out-of-range target whiffs');
    t.dispose();
    const q = rig(); q.tick(); q.e.die();
    const replacement = new Enemy({ scene: q.scene, config: ENEMY_MAP.angry_printer, x: 1.3 });
    q.w.enemies.push(replacement); q.tick(.3);
    check(replacement.hp === replacement.maxHp - q.p.attack, 'reacquires only a valid nearby opponent');
    replacement.destroy(); q.dispose(); results.push('target death: whiff or valid in-range reacquisition');
  }
  {
    const t = rig(); t.tick();
    const pose = t.p.body.rotation.z;
    for (let i = 0; i < 20; i++) t.tick(0);
    check(t.e.hp === 10000 && t.p.body.rotation.z === pose, 'zero sim time freezes attack and pose');
    t.tick(4);
    check(t.e.hp === 10000 - t.p.attack && t.p.animationState === 'strike', 'dt spike: single damage and visible strike');
    t.dispose(); results.push('pause/resume and dt-spike single contact');
  }
  {
    const t = rig('karaoke_uncle'); t.tick();
    check(t.w.combat.projectiles.length === 0 && t.e.hp === 10000, 'no projectile before release');
    t.p.update(.1, t.w);
    check(t.w.combat.projectiles.length === 1 && t.e.hp === 10000, 'release precedes collision damage');
    t.w.combat.update(.2, t.w);
    check(t.e.hp === 10000 - t.p.attack, 'projectile hits once at arrival');
    t.w.combat.update(2, t.w); check(t.e.hp === 10000 - t.p.attack, 'no duplicate projectile damage');
    t.w.combat.spawnProjectile({ from: t.p.group.position, target: t.e, owner: t.p, delay: .2, speed: 12, damage: 10, color: 0xffffff });
    check(!t.w.combat.projectiles[0].mesh.visible, 'delayed projectile is not released early');
    t.p.die(); t.w.combat.update(.3, t.w);
    check(t.w.combat.projectiles.length === 0 && t.e.hp === 10000 - t.p.attack, 'unreleased volley cancels on death');
    t.dispose(); results.push('ranged release/arrival and pending volley death cancellation');
  }
  {
    const t = rig('gym_uncle', true); t.p.group.position.z = 1.8;
    t.tick(); t.tick(.28);
    const hit = t.trace.find(e => e.event === 'impact');
    check(t.w.enemyBase.hp === 10000 - t.p.attack && hit.position[0] === 9.18 && hit.position[2] === .72, 'base impact is on facing wall at bounded lane depth');
    check(t.w.enemyBase.tower.material.emissive.getHex() !== 0, 'base flashes at actual damage');
    const mirror = impactPosition(t.w.playerBase, { x: -8, z: -1.8 });
    check(mirror.x === -9.18 && mirror.z === -.72, 'reverse base contact location');
    t.dispose(); results.push('both base wall impact positions and local base reaction');
  }
  {
    const t = rig(); const texture = t.p.mat.map;
    let disposed = false; texture.addEventListener('dispose', () => { disposed = true; });
    t.p.die();
    const next = new Unit({ scene: t.scene, config: UNIT_MAP.gym_uncle, stats: defaultStats(), x: -5 });
    check(!disposed && next.mat.map === texture && next.moveSpeed === .62, 'shared approved texture survives individual death');
    for (let i = 0; i < 100; i++) {
      t.w.vfx.spawnGymImpact(next.group.position); t.w.vfx.spawnComicText(next.group.position, 'ORA!');
    }
    check(t.w.vfx.particles.length <= 101 && t.w.vfx.particles.filter(p => p.isText).length <= 1, 'crowd effect and text caps');
    next.destroy(); t.dispose();
    check(t.w.combat.projectiles.length === 0 && t.w.vfx.particles.length === 0, 'scene effect cleanup');
    results.push('shared sprite lifetime, effect budgets and scene cleanup');
  }
  {
    const t = rig();
    const boss = new Enemy({ scene: t.scene, config: BOSS_MAP.mega_printer, x: 3 });
    boss.bossSpecialCd = 0;
    boss.update(1 / 60, t.w);
    check(t.w.combat.projectiles.length === 0 && boss.pendingSpecial, 'boss skill anticipates without release');
    boss.applyStun(1); boss.update(.5, t.w);
    check(t.w.combat.projectiles.length === 0 && !boss.pendingSpecial, 'stun cancels boss windup');
    boss.stunTimer = 0; boss.bossSpecialCd = 0; boss.update(.01, t.w); boss.update(.2, t.w);
    check(t.w.combat.projectiles.length === 5, 'boss releases volley once at timed contact');
    boss.destroy(); t.dispose(); results.push('boss special windup, stun interruption and single volley');
  }
  {
    // Exercise real pause UI + scene exit, not only zero-dt unit fixtures.
    const game = window.__game;
    game.startBattle(1);
    const battle = game.currentScene;
    battle.waveManager.update = () => {};
    battle.economy.money = 9999;
    battle._spawnUnit(UNIT_MAP.gym_uncle);
    const actor = battle.units[0]; actor.group.position.x = 0;
    const enemy = battle._spawnEnemy({ ...ENEMY_MAP.angry_printer, hp: 10000 }, 1.4);
    battle.update(1 / 60);
    document.getElementById('btnPause').click();
    const elapsed = actor.attackTimeline.elapsed;
    await new Promise(resolve => setTimeout(resolve, 250));
    check(enemy.hp === 10000 && actor.attackTimeline.elapsed === elapsed, 'real paused scene cannot advance contact');
    document.getElementById('btnPause').click();
    await new Promise(resolve => setTimeout(resolve, 450));
    check(enemy.hp === 10000 - actor.attack, 'real resume delivers exactly one contact');
    actor.attackTimeline.cancel(); actor.attackCd = 0;
    battle.update(1 / 60);
    check(actor.attackTimeline.active, 'prepare another pending scene attack');
    game.goto('menu');
    check(!actor.alive && !actor.attackTimeline.active && battle.combat.projectiles.length === 0 && battle.vfx.particles.length === 0,
      'real scene exit cancels pending attacks and clears effects');
    results.push('real scene pause UI, resume and exit with pending attack');
  }
  return { results, trace: evidence };
}
