import assert from 'node:assert/strict';
import { FormationSystem, formationRole } from '../src/systems/FormationSystem.js';

const actor = (side, x, options = {}) => ({ side, alive: true, range: 1.3,
  attackType: 'melee', config: { scale: 1 }, group: { position: { x, y: 0, z: 0 } }, ...options });
const setup = (units, enemies) => {
  const formation = new FormationSystem();
  const world = { units, enemies };
  formation.prepare(1 / 60, world);
  return { formation, world };
};

// Swept contact, including a delta large enough to cross the whole battlefield.
for (const dt of [1 / 60, .05, .5, 10]) {
  const p = actor('player', -3), e = actor('enemy', 3);
  const { formation: f, world } = setup([p], [e]);
  for (let i = 0; i < 400; i++) {
    f.prepare(dt, world);
    f.move(p, 2 * dt, dt); f.move(e, -2 * dt, dt);
    assert.ok(p.group.position.x < e.group.position.x, 'ground opponents must never cross');
  }
  assert.ok(e.group.position.x - p.group.position.x <= p.range);
}

// Three stable columns on each side, deterministic and unaltered by array order.
const ps = Array.from({ length: 3 }, () => actor('player', -3));
const es = Array.from({ length: 3 }, () => actor('enemy', 3));
const { formation: f, world } = setup(ps, es);
const lanes = ps.map(p => p.group.position.z);
assert.equal(new Set(lanes).size, 3);
for (let i = 0; i < 200; i++) {
  world.units.reverse(); world.enemies.reverse();
  f.prepare(.05, world);
  for (const p of ps) f.move(p, .1, .05);
  for (const e of es) f.move(e, -.1, .05);
}
assert.deepEqual(ps.map(p => p.group.position.z).sort(), lanes.sort());
for (const p of ps) for (const e of es) assert.ok(p.group.position.x < e.group.position.x);
assert.ok([...ps, ...es].every(u => Math.abs(u.group.position.z) <= 2.2));

// Death releases contact; both armies can advance toward the opposite base.
es.forEach(e => { e.alive = false; });
f.prepare(.05, world);
const before = ps.map(p => p.group.position.x);
ps.forEach(p => f.move(p, 2, 1));
ps.forEach((p, i) => assert.ok(p.group.position.x > before[i]));
const enemy = actor('enemy', 0);
const empty = setup([], [enemy]);
empty.formation.move(enemy, -5, 2.5);
assert.equal(enemy.group.position.x, -5);

// Backline blockers can be bypassed by a reinforcement, without X tunnelling.
const melee = actor('player', -2);
const ranged = actor('player', 0, { attackType: 'ranged', range: 6 });
const support = actor('player', -4, { attackType: 'ranged', range: 4, special: 'support' });
assert.equal(formationRole(melee), 'front');
assert.equal(formationRole(ranged), 'mid');
assert.equal(formationRole(support), 'back');
const mixed = setup([ranged, melee, support], []);
for (let i = 0; i < 100; i++) {
  mixed.formation.prepare(.05, mixed.world);
  mixed.formation.move(melee, .1, .05);
}
assert.ok(melee.group.position.x > ranged.group.position.x + 2, 'melee passes a stationary backliner');

const wall = Array.from({ length: 3 }, () => actor('player', 0, { attackType: 'ranged', range: 6 }));
const reinforcement = actor('player', -3);
const crowded = setup([...wall, reinforcement], []);
for (let i = 0; i < 200; i++) {
  crowded.formation.prepare(.05, crowded.world);
  crowded.formation.move(reinforcement, .1, .05);
  const army = [...wall, reinforcement];
  for (let a = 0; a < army.length; a++) for (let b = a + 1; b < army.length; b++) {
    const pa = army[a].group.position, pb = army[b].group.position;
    assert.ok(Math.hypot(pa.x - pb.x, pa.z - pb.z) >= 1.18 - 1e-6, 'yielding backline stays separated');
  }
}
assert.ok(reinforcement.group.position.x > 3, 'a full ranged row must yield a path to melee');

// Intentional flying/dash bypass; knockback can retreat; bosses remain grounded.
for (const options of [{ special: 'fly', flyHeight: 1.4 }, { dashing: true }]) {
  const p = actor('player', -2, options), e = actor('enemy', 0);
  const { formation } = setup([p], [e]);
  formation.move(p, 5, 1);
  assert.equal(p.group.position.x, 3);
}
const p = actor('player', -1), boss = actor('enemy', 1, { isBoss: true, config: { scale: 2.2 }, range: 1.8 });
const bossTest = setup([p], [boss]);
bossTest.formation.move(p, 10, 1);
assert.ok(p.group.position.x < boss.group.position.x);
const contact = p.group.position.x;
bossTest.formation.move(p, -1, .1);
assert.equal(p.group.position.x, contact - 1);
console.log('Formation regression tests passed (contact, dt spikes, 3v3, roles, release, flying/dash, boss, knockback)');
