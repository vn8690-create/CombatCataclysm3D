import assert from 'node:assert/strict';
import { CANONICAL_UNITS } from '../src/config/canonicalCharacters.js';

const byId=id=>CANONICAL_UNITS.find(u=>u.id===id);
const gym=byId('gym_uncle'),manager=byId('manager'),drunk=byId('drunk_uncle'),doctor=byId('dr_doping'),fisher=byId('fisherman_uncle'),auntie=byId('supermarket_auntie');
assert.equal(CANONICAL_UNITS.length,6,'Character Pack V1 should expose six canonical units');
for(const unit of CANONICAL_UNITS){assert.ok(unit.dna,`${unit.id} must preserve Character DNA`);assert.ok(unit.animationPersonality,`${unit.id} needs animation personality`);assert.ok(unit.failureBehavior,`${unit.id} needs failure behavior`);assert.ok(unit.comedyEvents.length,`${unit.id} needs comedy events`);}
assert.match(gym.animationPersonality,/top-heavy/i);assert.match(manager.animationPersonality,/authoritative|pointing/i);assert.equal(gym.hiddenSkill,'Manager Cannon');assert.equal(manager.hiddenSkill,'Emergency Meeting');
assert.equal(drunk.hiddenSkill,'Legendary Drunk');assert.ok(drunk.comedyEvents.includes('pass_out'));
assert.equal(doctor.failureBehavior.includes('15%'),true);assert.ok(doctor.comedyEvents.includes('wrong_syringe'));
assert.equal(fisher.hiddenSkill,'SASHIMI');assert.ok(fisher.counterHooks.includes('shark'));
assert.equal(auntie.hiddenSkill,'Shopping Bag Charge');assert.ok(auntie.comedyEvents.includes('bag_charge'));
console.log('Character Pack V1 contracts passed');
