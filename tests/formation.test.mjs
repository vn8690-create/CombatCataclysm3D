import assert from 'node:assert/strict';
import { FormationSystem, formationRole, attackDistance } from '../src/systems/FormationSystem.js';

const actor = (side, x, options = {}) => ({ side, alive: true, range: 1.3,
  attackType: 'melee', config: { scale: 1 }, group: { position: { x, y: 0, z: 0 } }, ...options });
const setup = (units, enemies) => {
  const formation = new FormationSystem();
  const world = { units, enemies };
  formation.prepare(1 / 60, world);
  return { formation, world };
};

// Same-slot opponents stop at contact, including large dt.
for (const dt of [1 / 60, .05, .5, 10]) {
  const p = actor('player', -3), e = actor('enemy', 3);
  const { formation: f, world } = setup([p], [e]);
  for (let i = 0; i < 400; i++) {
    f.prepare(dt, world);
    f.move(p, 2 * dt, dt); f.move(e, -2 * dt, dt);
    assert.ok(p.group.position.x < e.group.position.x, 'same-slot ground opponents must never cross');
  }
  assert.ok(attackDistance(p, e) <= p.range + 1e-6);
}

// Depth now matters to melee truth: adjacent lanes are not free phantom hits.
const depthA = actor('player', 0);
const depthB = actor('enemy', .2);
depthA.group.position.z = -2.2;
depthB.group.position.z = 2.2;
assert.ok(attackDistance(depthA, depthB) > depthA.range);

// Five bounded engagement slots are deterministic for a small frontline.
const ps = Array.from({ length: 5 }, () => actor('player', -3));
const es = Array.from({ length: 5 }, () => actor('enemy', 3));
const { formation: f, world } = setup(ps, es);
assert.equal(new Set(ps.map(p => p.group.position.z)).size, 5);
assert.ok([...ps, ...es].every(u => Math.abs(u.group.position.z) <= 2.35));

// Rear melee must flank a stationary friendly melee instead of freezing forever.
const lead = actor('player', 0);
const rear = actor('player', -2.5);
const flank = setup([lead, rear], []);
for (let i = 0; i < 120; i++) {
  flank.formation.prepare(.05, flank.world);
  flank.formation.move(rear, .1, .05);
}
assert.ok(rear.group.position.x > lead.group.position.x + 1,
  'rear melee should use a free depth slot and make meaningful forward progress');
assert.ok(Math.abs(rear.group.position.z - lead.group.position.z) > .9,
  'rear melee should visibly fan out around the friendly blocker');

// Mirror the same guarantee for enemy reinforcements.
const enemyLead = actor('enemy', 0);
const enemyRear = actor('enemy', 2.5);
const enemyFlank = setup([], [enemyLead, enemyRear]);
for (let i = 0; i < 120; i++) {
  enemyFlank.formation.prepare(.05, enemyFlank.world);
  enemyFlank.formation.move(enemyRear, -.1, .05);
}
assert.ok(enemyRear.group.position.x < enemyLead.group.position.x - 1,
  'enemy rear melee should flank symmetrically');

// Ranged/support blockers can also be bypassed.
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
assert.ok(melee.group.position.x > ranged.group.position.x + 2);

// Saturation fallback: five occupied front slots make a stable second-row queue.
// It may wait, but must not oscillate lanes, overlap allies, or tunnel through them.
const wall = Array.from({ length: 5 }, () => actor('player', 0));
const reinforcement = actor('player', -2.5);
const crowded = setup([...wall, reinforcement], []);
let laneChanges = 0;
let lastZ = reinforcement.group.position.z;
for (let i = 0; i < 160; i++) {
  crowded.formation.prepare(.05, crowded.world);
  crowded.formation.move(reinforcement, .1, .05);
  if (Math.abs(reinforcement.group.position.z - lastZ) > .35) laneChanges++;
  lastZ = reinforcement.group.position.z;
  const army = [...wall, reinforcement];
  for (let a = 0; a < army.length; a++) for (let b = a + 1; b < army.length; b++) {
    const pa = army[a].group.position, pb = army[b].group.position;
    assert.ok(Math.hypot(pa.x - pb.x, pa.z - pb.z) >= 1.05 - 1e-6,
      'saturated queue must remain physically separated');
  }
}
assert.ok(laneChanges < 12, 'saturated reinforcement must not ping-pong forever');
assert.ok(reinforcement.group.position.x < .1, 'full frontline uses a bounded second-row queue');

// Death releases slots and queued units can advance.
wall[2].alive = false;
for (let i = 0; i < 80; i++) {
  crowded.formation.prepare(.05, crowded.world);
  crowded.formation.move(reinforcement, .1, .05);
}
assert.ok(reinforcement.group.position.x > .5, 'opening a front slot releases the queue');

// Intentional flying/dash bypass; knockback retreats; bosses stay grounded.
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

console.log('Formation regression tests passed (5-slot flanking, saturation queue, depth-aware contact, symmetry, release, flying/dash, boss, knockback)');
