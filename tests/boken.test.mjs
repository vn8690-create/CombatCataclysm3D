import assert from 'node:assert/strict';
import { BOKEN_ROUTES } from '../src/config/bokenRoutes.js';
import { BokenSystem } from '../src/systems/BokenSystem.js';

const boken = new BokenSystem(BOKEN_ROUTES);
assert.equal(boken.currentRouteId, 'japan_tokyo_intro');
assert.equal(boken.currentNodeId, 'tokyo_gate');
assert.equal(boken.startRoute('japan_tokyo_intro'), true);
assert.equal(boken.getCurrentNode().type, 'story');

assert.equal(boken.moveTo('salaryman_crossing'), true);
assert.equal(boken.availableNextNodes().length, 2);
assert.equal(boken.moveTo('tokyo_clear'), false, 'cannot skip directly to a non-adjacent node');

assert.equal(boken.moveTo('konbini_detour'), true);
let result = boken.resolveCurrentNode();
assert.equal(result.ok, true);
assert.equal(boken.recruitedCharacters.has('office_cat'), true);

assert.equal(boken.moveTo('printer_brawl'), true);
result = boken.resolveCurrentNode({ win: false });
assert.equal(result.ok, false, 'battle node must be won before it is resolved');
result = boken.resolveCurrentNode({ win: true });
assert.equal(result.ok, true);

assert.equal(boken.moveTo('last_train'), true);
assert.equal(boken.resolveCurrentNode({ win: true }).ok, true);
assert.equal(boken.moveTo('tokyo_clear'), true);
result = boken.resolveCurrentNode();
assert.equal(result.routeCompleted, true);

const saved = boken.serialize();
const restored = new BokenSystem(BOKEN_ROUTES, saved);
assert.equal(restored.currentNodeId, 'tokyo_clear');
assert.equal(restored.completedRoutes.has('japan_tokyo_intro'), true);
assert.equal(restored.recruitedCharacters.has('office_cat'), true);

console.log('BokenSystem tests passed');
