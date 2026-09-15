import assert from 'node:assert/strict';
import { CANONICAL_UNITS } from '../src/config/canonicalCharacters.js';

const gym = CANONICAL_UNITS.find(u => u.id === 'gym_uncle');
const manager = CANONICAL_UNITS.find(u => u.id === 'manager');
assert.ok(gym?.dna, 'Gym Uncle must preserve source Character DNA');
assert.ok(manager?.dna, 'Manager must preserve source Character DNA');
assert.match(gym.animationPersonality, /top-heavy/i);
assert.match(manager.animationPersonality, /authoritative|pointing/i);
assert.equal(gym.hiddenSkill, 'Manager Cannon');
assert.equal(manager.hiddenSkill, 'Emergency Meeting');
assert.ok(gym.relationships.some(r => r.target === 'manager'));
assert.ok(manager.relationships.some(r => r.target === 'gym_uncle'));
console.log('Character personality contracts passed');
