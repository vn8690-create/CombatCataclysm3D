import assert from 'node:assert/strict';
import { AttackTimeline, attackTiming } from '../src/systems/AttackTimeline.js';
import { advanceAttack, beginAttack } from '../src/systems/AttackExecution.js';
import { EffectBudget, EFFECT_LIMITS } from '../src/systems/EffectBudget.js';

const target = { alive: true, x: 1 };
const timing = { windup: .28, strike: .08, recovery: .28 };
const clock = new AttackTimeline(timing);
assert.equal(clock.begin(target), true);
assert.equal(clock.begin(target), false, 'no queued attacks');
assert.equal(clock.advance(.27).contact, false);
assert.equal(clock.phase, 'anticipation');
assert.equal(clock.advance(.01).contact, true);
assert.equal(clock.posePhase, 'strike');
assert.equal(clock.advance(.08).contact, false);
assert.equal(clock.phase, 'recovery');
assert.equal(clock.advance(.28).finished, true);
assert.equal(clock.advance(1).contact, false);
clock.begin(target);
assert.equal(clock.advance(5).contact, true, 'spike delivers one event');
assert.equal(clock.active, false);
assert.equal(clock.posePhase, 'strike', 'spike must render the contact pose with damage');
clock.advance(0);
assert.equal(clock.posePhase, 'strike', 'pause retains contact frame');
assert.equal(clock.advance(.01).contact, false);
assert.equal(clock.posePhase, 'idle');
clock.begin(target); clock.advance(.2); clock.cancel();
assert.equal(clock.advance(1).contact, false, 'interrupt removes pending contact');
assert.equal(clock.target, null);

let hits = 0;
const actor = { alive: true, stunTimer: 0, range: 1.5, attackSpeed: .72, attackCd: 0,
  group: { position: { x: 0 } }, attackTimeline: new AttackTimeline(timing),
  findTarget: () => ({ target: null }), _performAttack: () => hits++ };
beginAttack(actor, target, {});
advanceAttack(actor, 0, {}, [], target);
assert.equal(hits, 0);
target.alive = false;
advanceAttack(actor, .3, {}, [], target);
assert.equal(hits, 0, 'dead target is not hit');
actor.attackTimeline.cancel(); target.alive = true;
beginAttack(actor, target, {}); actor.alive = false;
advanceAttack(actor, 1, {}, [], target);
assert.equal(hits, 0, 'dead attacker cannot deal scheduled damage');
actor.alive = true; actor.attackTimeline.cancel();
beginAttack(actor, target, {}); actor.stunTimer = 1;
advanceAttack(actor, 1, {}, [], target);
assert.equal(hits, 0, 'stunned attacker cannot contact');
const fast = attackTiming({ attackSpeed: 10, personality: 'gym_uncle' });
assert.ok(Object.values(fast).reduce((a, b) => a + b, 0) < .1, 'animation fits attack cadence');

const budget = new EffectBudget();
for (const [kind, limits] of Object.entries(EFFECT_LIMITS)) {
  let accepted = 0;
  for (let i = 0; i < 1000; i++) accepted += budget.acquire(kind) ? 1 : 0;
  assert.equal(accepted, Math.min(limits.burst, limits.maxActive));
  budget.update(0);
  assert.equal(budget.acquire(kind), false, 'pause does not refill');
  for (let i = 0; i < accepted; i++) budget.release(kind);
}
budget.update(2);
assert.equal(budget.acquire('text'), true);
assert.equal(budget.acquire('text'), false, 'global comedy text limit');
budget.reset();
assert.ok(Object.values(budget.active).every(n => n === 0));
console.log('Attack timing / interruption / effect-budget tests passed');
