// Runs in Chromium against actual entities, projectiles and progression code.
import * as THREE from 'three';
import { Unit } from '../src/entities/Unit.js';
import { Enemy } from '../src/entities/Enemy.js';
import { Base } from '../src/entities/Base.js';
import { FormationSystem } from '../src/systems/FormationSystem.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { UNIT_MAP } from '../src/config/units.js';
import { ENEMY_MAP, BOSS_MAP } from '../src/config/enemies.js';
import { defaultStats } from '../src/config/upgrades.js';
import { Game } from '../src/core/Game.js';
import { BattleScene } from '../src/scenes/BattleScene.js';
import { BokenSystem } from '../src/systems/BokenSystem.js';
import { BOKEN_ROUTES } from '../src/config/bokenRoutes.js';

const check = (condition, message) => { if (!condition) throw new Error(message); };
function encounter() {
  const scene = new THREE.Scene();
  const w = { units: [], enemies: [], formation: new FormationSystem(), combat: new CombatSystem(scene, null),
    playerBase: new Base({ scene, isPlayer: true, x: -10, maxHp: 1500 }),
    enemyBase: new Base({ scene, x: 10, maxHp: 1800 }) };
  const unit = (id, x, overrides = {}) => {
    const u = new Unit({ scene, config: { ...UNIT_MAP[id], ...overrides }, stats: defaultStats(), x });
    w.units.push(u); w.formation.register(u); return u;
  };
  const enemy = (id, x, overrides = {}) => {
    const e = new Enemy({ scene, config: { ...(ENEMY_MAP[id] || BOSS_MAP[id]), ...overrides }, x });
    w.enemies.push(e); w.formation.register(e); return e;
  };
  const tick = (dt = 1 / 60) => {
    w.combat.update(dt, w); w.formation.prepare(dt, w);
    w.units.forEach(u => u.update(dt, w)); w.enemies.forEach(e => e.update(dt, w));
  };
  const dispose = () => { w.units.forEach(u => u.destroy()); w.enemies.forEach(e => e.destroy()); w.combat.clear(); w.playerBase.destroy(); w.enemyBase.destroy(); };
  return { w, unit, enemy, tick, dispose };
}

export async function runCombatRegression() {
  const results = [];
  for (const dt of [1 / 60, .5]) {
    const t = encounter(), p = t.unit('office_cat', -3), e = t.enemy('angry_printer', 3);
    for (let i = 0; i < 20 / dt && p.alive && e.alive; i++) {
      t.tick(dt);
      check(p.group.position.x < e.group.position.x, `1v1 crossing at dt=${dt}`);
    }
    check(p.hp < p.maxHp && e.hp < e.maxHp, 'both melee actors must attack');
    t.dispose();
  }
  results.push('1v1 and delta spike: both sides damage without crossing');

  {
    const t = encounter();
    const ps = Array.from({ length: 3 }, () => t.unit('office_cat', -3, { hp: 10000 }));
    const es = Array.from({ length: 3 }, () => t.enemy('angry_printer', 3, { hp: 10000 }));
    const depths = ps.map(p => p.group.position.z);
    for (let i = 0; i < 600; i++) t.tick();
    check(new Set(depths).size === 3, '3v3 requires distinct depths');
    check(ps.every((p, i) => p.group.position.z === depths[i]), '3v3 slots must remain stable');
    check(ps.every(p => p.attackCd > 0) && es.every(e => e.attackCd > 0), 'all six actors must fight');
    check(ps.every(p => p.barBg.parent === p.group && p.barFill.parent === p.group), 'HP bars follow owners');
    t.dispose(); results.push('3v3: all six fight in stable slots with attached HP bars');
  }

  {
    const t = encounter(), front = t.unit('office_cat', -1, { hp: 10000 });
    const ranged = t.unit('karaoke_uncle', -5), support = t.unit('manager', -5);
    const e = t.enemy('angry_printer', 3, { hp: 10000 });
    const hits = new Set();
    const takeDamage = e.takeDamage.bind(e);
    e.takeDamage = (amount, source) => { hits.add(source); takeDamage(amount, source); };
    for (let i = 0; i < 600; i++) t.tick();
    check(ranged.group.position.x < front.group.position.x && support.group.position.x < front.group.position.x, 'backline safety gaps');
    check(hits.has(ranged) && hits.has(support), 'both ranged and support projectiles must land');
    e.die();
    const x = support.group.position.x;
    for (let i = 0; i < 600; i++) t.tick();
    check(support.group.position.x > x && t.w.enemyBase.hp < 1800, 'backline advances and sieges');
    t.dispose(); results.push('melee/ranged/support: safety gaps, real projectiles, advance and siege');
  }

  for (const side of ['player', 'enemy']) {
    const t = encounter();
    if (side === 'player') {
      for (let i = 0; i < 3; i++) t.unit('office_cat', -3, { attack: 300 });
      t.enemy('angry_printer', 1, { hp: 20 });
    } else {
      for (let i = 0; i < 3; i++) t.enemy('angry_printer', 3, { attack: 300 });
      t.unit('office_cat', -1, { hp: 20 });
    }
    const base = side === 'player' ? t.w.enemyBase : t.w.playerBase;
    for (let i = 0; i < 2400 && base.alive; i++) t.tick();
    check(!base.alive && base.hp === 0, `${side}: survivors must destroy base`);
    const army = side === 'player' ? t.w.units : t.w.enemies;
    check(new Set(army.map(u => `${u.group.position.x},${u.group.position.z}`)).size === 3, 'distinct siege positions');
    let result;
    const battle = { ...t.w, ended: false, scene: {}, stageId: 1, stage: { reward: 100 }, game: { finishBattle: r => { result = r; } } };
    BattleScene.prototype._checkEndState.call(battle);
    await new Promise(resolve => setTimeout(resolve, 850));
    check(result?.win === (side === 'player'), 'correct real end-state callback');
    t.dispose(); results.push(`${side} survivors: advance, distinct siege positions, base destruction and correct result`);
  }

  {
    const t = encounter(), p = t.unit('office_cat', .3), e = t.enemy('angry_printer', 0);
    check(e.findTarget(t.w.units, t.w.playerBase).target === p, 'enemy must see crossed target');
    check(p.findTarget(t.w.enemies, t.w.enemyBase).target === e, 'player must see crossed target');
    t.tick(.05); check(p.hp < p.maxHp || e.hp < e.maxHp, 'crossed entities fight');
    const taunt = t.unit('rice_cooker_tank', -.4);
    check(e.findTarget(t.w.units, t.w.playerBase).target === taunt, 'in-range taunt priority');
    t.dispose(); results.push('crossed-target and taunt regressions');
  }

  {
    const t = encounter(), dash = t.unit('scooter_cat', -2), e = t.enemy('angry_printer', 0, { hp: 10000 });
    t.tick(.5);
    check(dash.group.position.x > e.group.position.x && e.hp < e.maxHp, 'swept dash crosses AND hits on a spike');
    const boss = t.enemy('tax_dragon', 6); boss.applyKnockback(8);
    check(boss.knockbackVel === 0, 'boss knockback immunity');
    e.applyKnockback(2); const old = e.group.position.x; t.tick(.05);
    check(e.group.position.x > old, 'enemy knockback still retreats');
    const fly = t.enemy('spam_email_bat', 5); t.tick(.05);
    check(fly.group.position.y === 1.4 && fly.group.position.z === 0, 'flight exempt from ground formation');
    t.dispose(); results.push('dash swept hit, boss immunity, knockback, flying height');
  }

  {
    const t = encounter(), p = t.unit('gym_uncle', -3, { hp: 10000 });
    const boss = t.enemy('tax_dragon', 3, { hp: 10000 });
    for (let i = 0; i < 600; i++) t.tick();
    check(p.hp < p.maxHp && boss.hp < boss.maxHp, 'large boss and small melee both attack at contact');
    check(boss.group.position.x - p.group.position.x >= .55 * (1.22 + 2.2) - .001, 'large grounded bodies do not clip');
    t.dispose(); results.push('Gym versus large boss: surface contact, both attack without body overlap');
  }

  {
    const t = encounter(), gym = t.unit('gym_uncle', -5);
    const x = gym.group.position.x; t.tick(1);
    check(gym.isSpriteBody && gym.mat.map && gym.moveSpeed === .62, 'approved Gym sprite and speed');
    check(Math.abs(gym.group.position.x - x - .62) < 1e-6, 'Gym movement unchanged');
    t.dispose(); results.push('Gym Uncle sprite, texture, and .62 movement speed preserved');
  }

  {
    const boken = new BokenSystem(BOKEN_ROUTES);
    boken.startRoute('japan_tokyo_intro'); boken.resolveCurrentNode();
    boken.moveTo('salaryman_crossing'); boken.resolveCurrentNode();
    boken.moveTo('konbini_detour'); boken.resolveCurrentNode(); boken.moveTo('printer_brawl');
    const save = { unlockedStages: [1], clearedStages: {}, upgrades: {}, money: 50, version: 1 };
    const before = JSON.stringify(save);
    const game = { boken, save, pendingBokenBattle: { routeId: boken.currentRouteId, nodeId: boken.currentNodeId, stageId: 1 }, persistSave() {}, goto() {} };
    Game.prototype.finishBattle.call(game, { win: false, stageId: 1, moneyEarned: 999 });
    check(JSON.stringify(save) === before && !boken.resolvedNodes.has('printer_brawl'), 'defeat must not unlock/reward Boken or campaign');
    results.push('real Game.finishBattle: defeat gives no campaign/Boken unlock or reward');
  }
  return results;
}
