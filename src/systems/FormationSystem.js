// Deterministic shallow-depth engagement slots for 2.5D combat.
// X is battlefield progress; Z is formation depth. No Three.js dependency.
import { BALANCE } from '../config/balance.js';

export const grounded = u => u.alive && u.special !== 'fly' && !(u.flyHeight > 0) && !u.dashing;
export const formationRole = u => u.config?.dna?.role === 'support' || u.special === 'support'
  ? 'back' : u.attackType === 'ranged' ? 'mid' : 'front';
const radius = u => Math.max(.35, .55 * (u.config?.scale || 1));
const pos = u => u.group.position;

const centerDistance = (a, b) => {
  const dx = pos(b).x - pos(a).x;
  const dz = pos(b).z - pos(a).z;
  return Math.hypot(dx, dz);
};

// Range is measured in the 2.5D battlefield plane. This prevents melee units
// from hitting an opponent in another depth slot through friendly bodies.
export const attackDistance = (u, target) => Math.max(0,
  centerDistance(u, target) - Math.max(0, radius(u) + radius(target) + .02 - u.range));

export class FormationSystem {
  constructor() {
    this.members = new Map();
    this.nextId = 1;
    // Five deterministic engagement slots. More than the old three lanes keeps
    // small battles fluid while still preserving a bounded readable frontline.
    this.depths = [-2.2, -1.1, 0, 1.1, 2.2].map(z =>
      Math.max(-BALANCE.LANE_WIDTH / 2 + .65, Math.min(BALANCE.LANE_WIDTH / 2 - .65, z)));
  }

  _preferred(role) {
    return role === 'back' ? [0, 4, 1, 3, 2]
      : role === 'mid' ? [1, 3, 2, 0, 4]
      : [2, 1, 3, 0, 4];
  }

  register(u) {
    if (this.members.has(u)) return this.members.get(u);
    const allies = [...this.members.keys()].filter(a => a.alive && a.side === u.side);
    const role = formationRole(u);
    const preferred = this._preferred(role);
    const score = lane => allies.reduce((sum, a) => {
      const state = this.members.get(a);
      if (state.lane !== lane) return sum;
      return sum + 1 / (1 + Math.abs(pos(a).x - pos(u).x));
    }, 0);
    const lane = preferred.reduce((best, n) => score(n) < score(best) ? n : best);
    const entry = { id: this.nextId++, lane, role, blocked: 0, switchCd: 0 };
    this.members.set(u, entry);
    if (grounded(u)) pos(u).z = this.depths[lane];
    return entry;
  }

  _laneClearance(u, lane, dir) {
    const targetZ = this.depths[lane];
    let clearance = Infinity;
    for (const a of this.members.keys()) {
      if (a === u || !grounded(a)) continue;
      const ahead = (pos(a).x - pos(u).x) * dir;
      if (ahead < -.15) continue;
      const sum = radius(u) + radius(a) + (a.side === u.side ? .08 : .02);
      if (Math.abs(pos(a).z - targetZ) >= sum) continue;
      clearance = Math.min(clearance, ahead);
    }
    return clearance;
  }

  _choosePassingLane(u, state) {
    const dir = u.side === 'player' ? 1 : -1;
    const currentClearance = this._laneClearance(u, state.lane, dir);
    let best = state.lane;
    let bestClearance = currentClearance;
    for (const lane of this._preferred(state.role)) {
      if (lane === state.lane) continue;
      const clearance = this._laneClearance(u, lane, dir);
      if (clearance > bestClearance + .55) {
        best = lane;
        bestClearance = clearance;
      }
    }
    return best;
  }

  prepare(dt, world) {
    for (const u of [...world.units, ...world.enemies]) this.register(u);

    for (const [u, state] of this.members) {
      if (!u.alive) {
        this.members.delete(u);
        continue;
      }
      if (!grounded(u)) continue;

      state.switchCd = Math.max(0, state.switchCd - dt);

      // If a unit has been held up by an ally, reserve a better depth slot.
      // This is symmetric for player/enemy and deliberately bounded to five slots.
      if (state.blocked > .16 && state.switchCd <= 0) {
        const lane = this._choosePassingLane(u, state);
        if (lane !== state.lane) {
          state.lane = lane;
          state.switchCd = .28;
          state.blocked = 0;
        }
      }

      const target = this.depths[state.lane];
      pos(u).z += (target - pos(u).z) * (1 - Math.exp(-10 * dt));
      state.blocked = Math.max(0, state.blocked - dt * .18);
    }

    this.separateAllies();
  }

  move(u, delta, dt = 0) {
    if (!Number.isFinite(delta) || delta === 0) return;
    if (!grounded(u)) {
      pos(u).x += delta;
      return;
    }

    const start = pos(u).x;
    const sign = Math.sign(delta);
    let travel = Math.abs(delta);
    let allyBlocked = false;

    for (const a of this.members.keys()) {
      if (a === u || !grounded(a)) continue;
      const ahead = (pos(a).x - start) * sign;
      if (ahead < 0) continue;

      const dz = Math.abs(pos(a).z - pos(u).z);
      const sum = radius(u) + radius(a) + (a.side === u.side ? .08 : .02);

      // Different depth slots may pass one another. This is the key difference
      // from the old solver, where any opponent blocked the entire battlefield.
      if (dz >= sum) continue;

      const xGap = Math.sqrt(Math.max(0, sum * sum - dz * dz));
      const allowed = Math.max(0, ahead - xGap);
      if (allowed < travel) {
        travel = allowed;
        if (a.side === u.side) allyBlocked = true;
      }
    }

    pos(u).x += sign * travel;

    const state = this.members.get(u);
    if (state && allyBlocked && travel + .001 < Math.abs(delta)) {
      state.blocked += dt;
      // Start sidestepping immediately instead of spending visible time frozen.
      if (state.switchCd <= 0) {
        const lane = this._choosePassingLane(u, state);
        if (lane !== state.lane) {
          state.lane = lane;
          state.switchCd = .28;
        }
      }
    }
  }

  separateAllies() {
    // Resolve residual overlap only within nearby Z. Rear units are moved
    // homeward in X, never pushed through an opposing frontline.
    for (const side of ['player', 'enemy']) {
      const dir = side === 'player' ? 1 : -1;
      const list = [...this.members.keys()]
        .filter(u => grounded(u) && u.side === side)
        .sort((a, b) => (pos(b).x - pos(a).x) * dir || this.members.get(a).id - this.members.get(b).id);

      for (let i = 0; i < list.length; i++) {
        const rear = list[i];
        for (let j = 0; j < i; j++) {
          const front = list[j];
          const sum = radius(rear) + radius(front) + .08;
          const dz = Math.abs(pos(rear).z - pos(front).z);
          if (dz >= sum) continue;
          const gap = Math.sqrt(Math.max(0, sum * sum - dz * dz));
          const overlap = gap - (pos(front).x - pos(rear).x) * dir;
          if (overlap > 0) pos(rear).x -= dir * overlap;
        }
      }
    }
  }
}
