import assert from 'node:assert/strict';
import { CharacterFactory, parseCharacterColor } from '../src/systems/CharacterFactory.js';
import { RelationshipSystem } from '../src/systems/RelationshipSystem.js';
import { ControlledChaosSystem } from '../src/systems/ControlledChaosSystem.js';
import { GYM_UNCLE_DNA, MANAGER_DNA } from '../src/config/canonicalCharacters.js';

assert.equal(parseCharacterColor('#c75bff'), 0xc75bff);
assert.deepEqual(CharacterFactory.validateDNA(GYM_UNCLE_DNA), []);

const gym = CharacterFactory.createRuntimeConfig(GYM_UNCLE_DNA);
const manager = CharacterFactory.createRuntimeConfig(MANAGER_DNA);
assert.equal(gym.id, 'gym_uncle');
assert.equal(gym.hiddenSkill, 'Manager Cannon');
assert.equal(manager.role, 'support');
assert.ok(gym.relationships.some(r => r.target === 'manager' && r.type === 'hate'));

const relationships = new RelationshipSystem({ random: () => 0, globalCooldown: 4.5 });
relationships.registerCharacter(gym);
relationships.registerCharacter(manager);

const first = relationships.chooseInteraction('gym_uncle', ['manager'], { battleTime: 10, majorComedyActive: false });
assert.ok(first, 'deterministic random=0 should trigger the strongest valid relationship');
assert.equal(first.actorId, 'gym_uncle');
assert.equal(first.targetId, 'manager');
assert.ok(first.harmScale <= 0.12, 'friendly-fire damage must remain tightly capped');

const blocked = relationships.chooseInteraction('gym_uncle', ['manager'], { battleTime: 10.1, majorComedyActive: false });
assert.equal(blocked, null, 'global cooldown should prevent comedy spam');

relationships.update(5, 15);
const blockedByDirector = relationships.chooseInteraction('gym_uncle', ['manager'], { battleTime: 15, majorComedyActive: true });
assert.equal(blockedByDirector, null, 'relationship incidents should not fight a major Comedy Director beat');

relationships.update(5, 20);
const requestedBeats = [];
const controlled = new ControlledChaosSystem({
  relationshipSystem: relationships,
  comedyDirector: { active: null, requestBeat: beat => requestedBeats.push(beat) },
});

const actor = {
  alive: true,
  attack: 100,
  config: gym,
};
const target = {
  alive: true,
  hp: 100,
  attackCd: 0,
  stunTimer: 0,
  config: manager,
  takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.alive = false; },
  applyKnockback(force) { this.lastKnockback = force; },
  reactToHit(level) { this.lastReaction = level; },
};

const event = controlled.tryInteraction(actor, [actor, target], { time: 20 });
assert.ok(event, 'controlled chaos should execute a valid deterministic relationship incident');
assert.ok(target.hp >= 88, 'incident must stay recoverable rather than deleting an ally');
assert.ok((target.lastKnockback || 0) <= 0.7, 'ally knockback must stay capped');
assert.ok(requestedBeats.length <= 1, 'one incident should request at most one comedy beat');

console.log('Character Factory and Controlled Chaos tests passed');
