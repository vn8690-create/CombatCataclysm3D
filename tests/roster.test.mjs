import assert from 'node:assert/strict';
import { UNITS } from '../src/config/units.js';
import { CANONICAL_DNA } from '../src/config/canonicalCharacters.js';

const unitIds = new Set();
for (const unit of UNITS) {
  assert.ok(unit.id, 'every unit needs an id');
  assert.ok(!unitIds.has(unit.id), `duplicate unit id: ${unit.id}`);
  unitIds.add(unit.id);
  assert.ok(unit.name, `unit ${unit.id} needs a name`);
  assert.ok(Number.isFinite(unit.hp) && unit.hp > 0, `unit ${unit.id} needs positive hp`);
}

for (const dna of CANONICAL_DNA) {
  assert.ok(unitIds.has(dna.id), `canonical DNA ${dna.id} should exist in the playable roster`);
  assert.ok(dna.visual?.silhouette, `canonical DNA ${dna.id} needs silhouette identity`);
  assert.ok(dna.visual?.animationPersonality, `canonical DNA ${dna.id} needs animation personality`);
  assert.ok(dna.combat?.hiddenSkill, `canonical DNA ${dna.id} needs a hidden skill`);
  assert.ok(dna.comedy?.failureBehavior, `canonical DNA ${dna.id} needs failure behavior`);
}

console.log('Roster integrity tests passed');
