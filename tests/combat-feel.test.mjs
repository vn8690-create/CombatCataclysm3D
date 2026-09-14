import assert from 'node:assert/strict';
import { CombatFeelSystem } from '../src/systems/CombatFeelSystem.js';

class Vec3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  clone() { return new Vec3(this.x, this.y, this.z); }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
}

const camera = { position: new Vec3(1, 2, 3) };
const feel = new CombatFeelSystem(camera);

feel.impact('heavy');
assert.ok(feel.hitStopRemaining > 0, 'heavy impact should schedule hit-stop');
assert.ok(feel.shakeRemaining > 0, 'heavy impact should schedule camera shake');

const frozenDt = feel.simulationDt(0.01);
assert.equal(frozenDt, 0, 'small frame should be fully consumed by hit-stop');

feel.impactFromDamage(30, 100, false);
assert.ok(feel.hitStopRemaining >= CombatFeelSystem.PRESETS.heavy.hitStop - 0.011, 'large damage should produce a strong impact tier');

feel.updateCamera(1);
assert.equal(camera.position.x, 1, 'camera should recover to base X');
assert.equal(camera.position.y, 2, 'camera should recover to base Y');
assert.equal(camera.position.z, 3, 'camera should recover to base Z');

feel.impactFromDamage(1, 100, true);
assert.ok(feel.hitStopRemaining >= CombatFeelSystem.PRESETS.ko.hitStop, 'KO should override damage ratio and use KO feedback');

feel.clear();
assert.equal(feel.hitStopRemaining, 0);
assert.equal(feel.shakeRemaining, 0);

console.log('CombatFeelSystem tests passed');
