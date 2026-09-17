import { attackDistance } from './FormationSystem.js';

const valid = (actor, target) => target?.alive && (target.side
  ? attackDistance(actor, target) : Math.abs(target.x - actor.group.position.x)) <= actor.range + 1e-6;

export function advanceAttack(actor, dt, world, opponents, base) {
  const wasActive = actor.attackTimeline.active;
  const event = actor.attackTimeline.advance(dt);
  if (!wasActive) return false;
  actor.attackCd -= dt;
  if (event.contact && actor.alive && actor.stunTimer <= 0) {
    if (actor.pendingSpecial) {
      actor.pendingSpecial = false;
      actor._doBossSpecial(world);
      world.onCombatEvent?.({ type: 'special-contact', actor });
      return true;
    }
    const target = valid(actor, event.target) ? event.target : actor.findTarget(opponents, base).target;
    if (valid(actor, target)) {
      actor._performAttack(target, world);
      world.onCombatEvent?.({ type: actor.attackType === 'ranged' ? 'release' : 'contact', actor, target });
    }
  }
  return true;
}

export function beginAttack(actor, target, world) {
  if (!actor.attackTimeline.begin(target)) return;
  // Keep the configured interval between attack starts, rather than adding a
  // windup to every cooldown. Discard backlog on a long frame, never queue hits.
  actor.attackCd = Math.max(actor.attackCd, -.05) + 1 / actor.attackSpeed;
  world.onCombatEvent?.({ type: 'attack-start', actor, target });
}
