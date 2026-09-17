// Shared, simulation-clock emission limits. Burst capacity handles a small melee;
// refill and live caps keep sustained crowds readable without allocating then
// evicting effects. Presentation budgets never affect damage or attack cadence.
export const EFFECT_LIMITS = Object.freeze({
  particle: Object.freeze({ burst: 48, perSecond: 64, maxActive: 96 }),
  ring: Object.freeze({ burst: 3, perSecond: 4, maxActive: 4 }),
  text: Object.freeze({ burst: 1, perSecond: 0.8, maxActive: 1 }),
});

export class EffectBudget {
  constructor() { this.reset(); }

  reset() {
    this.tokens = {};
    this.active = {};
    for (const [kind, limit] of Object.entries(EFFECT_LIMITS)) {
      this.tokens[kind] = limit.burst;
      this.active[kind] = 0;
    }
  }

  acquire(kind) {
    const limit = EFFECT_LIMITS[kind];
    if (!limit || this.tokens[kind] + 1e-9 < 1 || this.active[kind] >= limit.maxActive) return false;
    this.tokens[kind] = Math.max(0, this.tokens[kind] - 1);
    this.active[kind]++;
    return true;
  }

  release(kind) {
    if (EFFECT_LIMITS[kind]) this.active[kind] = Math.max(0, this.active[kind] - 1);
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    for (const [kind, limit] of Object.entries(EFFECT_LIMITS)) {
      this.tokens[kind] = Math.min(limit.burst, this.tokens[kind] + dt * limit.perSecond);
    }
  }
}
