import assert from 'node:assert/strict';
import { WORLD_REGIONS } from '../src/config/worldRegions.js';
import { WorldTourSystem } from '../src/systems/WorldTourSystem.js';

const tour = new WorldTourSystem(WORLD_REGIONS);
assert.equal(tour.listRegions().length, 2);
assert.equal(tour.currentRegionId, 'japan');
assert.equal(tour.isUnlocked('japan'), true);
assert.equal(tour.isUnlocked('vietnam'), false);
assert.equal(tour.select('vietnam'), false, 'locked region should not be selectable');

assert.equal(tour.complete('japan', 'vietnam'), true);
assert.equal(tour.isUnlocked('vietnam'), true);
assert.equal(tour.select('vietnam'), true);

const pool = tour.getEncounterPool();
assert.ok(pool.units.includes('beer-uncle'));
assert.ok(pool.enemies.length > 0);
assert.ok(pool.bosses.length > 0);
assert.ok(pool.hazards.length > 0);

const saved = tour.serialize();
const restored = new WorldTourSystem(WORLD_REGIONS, saved);
assert.equal(restored.currentRegionId, 'vietnam');
assert.equal(restored.isUnlocked('vietnam'), true);
assert.equal(restored.completed.has('japan'), true);

console.log('WorldTourSystem tests passed');
