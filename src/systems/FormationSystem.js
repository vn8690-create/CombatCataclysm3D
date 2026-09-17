// Shallow-depth formations; combat ranges remain measured along the lane (X).
// No Three.js dependency: the same solver is exercised by simulation tests.
import { BALANCE } from '../config/balance.js';

export const grounded = u => u.alive && u.special !== 'fly' && !(u.flyHeight > 0) && !u.dashing;
export const formationRole = u => u.config?.dna?.role === 'support' || u.special === 'support'
  ? 'back' : u.attackType === 'ranged' ? 'mid' : 'front';
const radius = u => Math.max(.35, .55 * (u.config?.scale || 1));
const pos = u => u.group.position;

// Large bodies meet at their surface instead of forcing small melee inside a
// boss mesh. Ordinary and ranged reach, base reach, damage and cooldowns stay as-is.
export const attackDistance = (u, target) => Math.max(0,
  Math.abs(pos(target).x - pos(u).x) - Math.max(0, radius(u) + radius(target) + .02 - u.range));

export class FormationSystem {
  constructor() {
    this.members = new Map();
    this.nextId = 1;
    this.depths = [0, -1.8, 1.8].map(z => Math.max(-BALANCE.LANE_WIDTH / 2 + .8, Math.min(BALANCE.LANE_WIDTH / 2 - .8, z)));
  }

  register(u) {
    if (this.members.has(u)) return this.members.get(u);
    const allies = [...this.members.keys()].filter(a => a.alive && a.side === u.side);
    const role = formationRole(u);
    const preferred = role === 'back' ? [2, 0, 1] : role === 'mid' ? [1, 2, 0] : [0, 1, 2];
    const score = lane => allies.reduce((sum, a) => sum + (this.members.get(a).lane === lane ? 1 / (1 + Math.abs(pos(a).x - pos(u).x)) : 0), 0);
    const lane = preferred.reduce((best, n) => score(n) < score(best) ? n : best);
    const entry = { id: this.nextId++, lane, role, blocked: 0 };
    this.members.set(u, entry);
    // Spawn directly in an available depth slot; subsequent changes interpolate.
    if (grounded(u)) pos(u).z = this.depths[lane];
    return entry;
  }

  prepare(dt, world) {
    for (const u of [...world.units, ...world.enemies]) this.register(u);
    // A full row of stationary ranged allies must open a column for incoming
    // melee. Backliners consolidate into another column (with X queue spacing)
    // instead of requiring the melee to find an already-empty lane.
    for (const [front, slot] of this.members) {
      if (!grounded(front) || slot.role !== 'front') continue;
      const dir = front.side === 'player' ? 1 : -1;
      for (const [ally, other] of this.members) {
        const ahead = (pos(ally).x - pos(front).x) * dir;
        if (!grounded(ally) || ally.side !== front.side || other.role === 'front' ||
            other.lane !== slot.lane || ahead <= 0 || ahead > 2.5) continue;
        const lane = this.depths.findIndex((z, index) => index !== slot.lane &&
          [...this.members].every(([u, state]) => u === front || !grounded(u) ||
            u.side !== front.side || state.role !== 'front' || state.lane !== index ||
            Math.abs(pos(u).x - pos(ally).x) > 3));
        if (lane >= 0) other.lane = lane;
      }
    }
    for (const [u, state] of this.members) {
      if (!u.alive) { this.members.delete(u); continue; }
      if (!grounded(u)) continue;
      // A stopped backliner must not permanently trap a melee reinforcement.
      if (state.blocked > .35) {
        const free = this.depths.findIndex(z => [...this.members.keys()].every(a =>
          a === u || !grounded(a) || a.side !== u.side ||
          Math.abs(pos(a).x - pos(u).x) > radius(a) + radius(u) + .6 ||
          Math.abs(pos(a).z - z) > radius(a) + radius(u) + .1));
        if (free >= 0) state.lane = free;
      }
      const target = this.depths[state.lane];
      pos(u).z += (target - pos(u).z) * (1 - Math.exp(-8 * dt));
      state.blocked = Math.max(0, state.blocked - dt * .25);
    }
    this.separateAllies();
  }

  move(u, delta, dt = 0) {
    if (!Number.isFinite(delta)) return;
    if (!grounded(u)) { pos(u).x += delta; return; }
    const start = pos(u).x;
    const sign = Math.sign(delta);
    let travel = Math.abs(delta);
    for (const a of this.members.keys()) {
      if (a === u || !grounded(a)) continue;
      const ahead = (pos(a).x - start) * sign;
      if (ahead < 0) continue; // crossed targets are handled by nearest targeting
      let gap;
      if (a.side !== u.side) {
        // Opposing ground fronts block the entire shallow lane, even at large dt.
        gap = radius(u) + radius(a);
      } else {
        const dz = Math.abs(pos(a).z - pos(u).z);
        const sum = radius(u) + radius(a) + .08;
        if (dz >= sum) continue;
        gap = Math.sqrt(sum * sum - dz * dz);
      }
      travel = Math.min(travel, Math.max(0, ahead - gap));
    }
    pos(u).x += sign * travel;
    const state = this.members.get(u);
    if (state && travel + .001 < Math.abs(delta)) state.blocked += dt;
  }

  separateAllies() {
    // Front-to-back projection only pushes a rear ally homeward; never through
    // the opposing frontline. Persistent IDs break coincident-spawn ties.
    for (const side of ['player', 'enemy']) {
      const dir = side === 'player' ? 1 : -1;
      const list = [...this.members.keys()].filter(u => grounded(u) && u.side === side)
        .sort((a, b) => (pos(b).x - pos(a).x) * dir || this.members.get(a).id - this.members.get(b).id);
      for (let i = 0; i < list.length; i++) {
        const rear = list[i];
        for (let j = 0; j < i; j++) {
          const front = list[j];
          const sum = radius(rear) + radius(front) + .08;
          const dz = Math.abs(pos(rear).z - pos(front).z);
          if (dz >= sum) continue;
          const gap = Math.sqrt(sum * sum - dz * dz);
          const overlap = gap - (pos(front).x - pos(rear).x) * dir;
          if (overlap > 0) pos(rear).x -= dir * overlap;
        }
      }
    }
  }
}
