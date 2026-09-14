import assert from 'node:assert/strict';
import { ComedyDirector } from '../src/systems/ComedyDirector.js';

const impacts = [];
const starts = [];
const ends = [];
const camera = {
  fov: 50,
  projectionUpdates: 0,
  updateProjectionMatrix() { this.projectionUpdates++; },
};
const combatFeel = { impact(level) { impacts.push(level); } };

const director = new ComedyDirector({
  camera,
  combatFeel,
  onBeatStart: beat => starts.push(beat.id),
  onBeatEnd: beat => ends.push(beat.id),
});

assert.equal(director.requestBeat({ id: 'manager-cannon', title: 'MANAGER CANNON', priority: 'major', duration: 0.5, slowMotion: 0.5 }), true);
assert.equal(director.active.id, 'manager-cannon');
assert.equal(director.simulationScale(), 0.5);
assert.equal(impacts.at(-1), 'heavy');
assert.equal(director.requestBeat({ id: 'manager-cannon', title: 'duplicate' }), false, 'same beat should be suppressed while recent');

director.update(0.2);
assert.ok(camera.fov < 50, 'active spotlight beat should temporarily zoom the camera');

assert.equal(director.requestBeat({ id: 'wrong-syringe', title: 'WRONG SYRINGE', priority: 'major', duration: 0.4 }), true);
assert.equal(director.queue.length, 1, 'second major beat should queue instead of overlapping');

assert.equal(director.requestBeat({ id: 'legendary-drunk', title: 'LEGENDARY DRUNK', priority: 'legendary', duration: 0.3 }), true);
assert.equal(director.active.id, 'legendary-drunk', 'legendary beat may interrupt a lower-priority beat');
assert.equal(impacts.at(-1), 'boss');

director.update(1);
assert.equal(camera.fov, 50, 'camera should recover after the beat');
assert.ok(starts.includes('manager-cannon'));
assert.ok(starts.includes('legendary-drunk'));
assert.ok(ends.includes('manager-cannon'));
assert.ok(ends.includes('legendary-drunk'));

director.clear();
assert.equal(director.active, null);
assert.equal(director.queue.length, 0);

console.log('ComedyDirector tests passed');
