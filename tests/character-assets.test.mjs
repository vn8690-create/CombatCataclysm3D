import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CharacterFactory } from '../src/systems/CharacterFactory.js';
import { CANONICAL_DNA, GYM_UNCLE_DNA, MANAGER_DNA } from '../src/config/canonicalCharacters.js';
import { UNIT_MAP } from '../src/config/units.js';

let assets = 0;
for (const dna of CANONICAL_DNA) {
  assert.deepEqual(CharacterFactory.validateDNA(dna), []);
  for (const key of ['battleSprite', 'portrait']) {
    if (!dna.visual[key]) continue;
    const bytes = readFileSync(new URL('../' + dna.visual[key].replace(/^\//, ''), import.meta.url));
    if (/\.png$/i.test(dna.visual[key])) {
      assert.equal(bytes.subarray(0,8).toString('hex'), '89504e470d0a1a0a', 'valid PNG signature');
      assert.ok(bytes.readUInt32BE(16)>0 && bytes.readUInt32BE(20)>0, 'positive PNG dimensions');
      assets++; continue;
    }
    const text = bytes.toString('utf8');
    assert.match(text, /<svg\b[^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.match(text, /viewBox="0 0 512 512"/);
    assert.match(text, /<\/svg>\s*$/);
    assert.doesNotMatch(text, /<(script|foreignObject|image)\b|\bon\w+=|(?:href|src)\s*=/i,
      'self-contained static vector art only');
    assets++;
  }
}
assert.equal(assets, 8, 'four battlefield images and four portraits exist');
const gymHashes = {
  battle: 'd5590e929f660fad2fe1a5188cc2bd8b471a163aec1a83ced71d3f688b56afe8',
  portrait: 'fa03b6a0254eb350a9a9fc51348ad4c642eff9e1bf1234a439b8a4d15adbba27',
};
for (const [kind, hash] of Object.entries(gymHashes)) {
  // Normalize checkout line endings only; keep all approved artwork bytes locked.
  const bytes = readFileSync(new URL(`../assets/characters/gym_uncle_${kind}.svg`, import.meta.url));
  assert.equal(createHash('sha256').update(bytes.toString().replace(/\r\n/g, '\n')).digest('hex'), hash);
}
for (const [key, bad] of [['battleSprite','https://example.com/actor.svg'], ['portrait','assets/../secret.svg'],
  ['battleSpriteWidth',0], ['battleSpriteHeight',NaN], ['battleBarY',-1], ['battleBarY',1], ['animationPreset','unknown'],
  ['projectileOrigin',{x:0,y:Infinity}], ['artStatus','final-maybe']]) {
  const dna = { ...MANAGER_DNA, visual: { ...MANAGER_DNA.visual, [key]: bad } };
  assert.throws(() => CharacterFactory.createRuntimeConfig(dna), /Invalid Character DNA/);
}
for (const visual of [null, [], 'bad']) {
  assert.throws(() => CharacterFactory.createRuntimeConfig({ ...MANAGER_DNA, visual }), /Invalid Character DNA/);
}
const legacy = CharacterFactory.createRuntimeConfig({ ...MANAGER_DNA, visual: { icon:'X', color:'#123456' } });
assert.equal(legacy.battleSprite, null);
assert.equal(legacy.animationPreset, 'standard');
assert.deepEqual(legacy.projectileOrigin, {x:0,y:.9});
const defaults = CharacterFactory.createRuntimeConfig({ ...MANAGER_DNA, visual: { battleSprite:'assets/characters/manager_battle.svg' } });
assert.ok(defaults.battleBarY > defaults.battleSpriteHeight);
assert.deepEqual(CharacterFactory.createRuntimeConfig(GYM_UNCLE_DNA).moveSpeed, .62);
const expected = {
  gym_uncle: [170,340,58,1.45,.72,.62,5.8], manager: [220,150,18,4.8,.55,.78,8.5],
  drunk_uncle: [145,285,48,1.35,.82,.92,5.2], supermarket_auntie: [130,205,31,3.25,1.08,1.08,4.7],
};
for (const [id, stats] of Object.entries(expected)) {
  assert.deepEqual(['cost','hp','attack','range','attackSpeed','moveSpeed','deployCD'].map(k => UNIT_MAP[id][k]), stats);
  if (id !== 'gym_uncle') assert.equal(UNIT_MAP[id].artStatus, 'provisional');
}
console.log('Character assets: 8 local SVGs, approved Gym art, metadata, legacy defaults and unchanged stats passed');
