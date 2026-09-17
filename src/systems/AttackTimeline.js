// Simulation time only: no wall timers, queues, or damage hidden in animation.
export class AttackTimeline {
  constructor({ windup, strike, recovery }) {
    Object.assign(this, { windup, strike, recovery });
    this.cancel();
  }
  get duration() { return this.windup + this.strike + this.recovery; }
  get phase() {
    if (!this.active) return 'idle';
    return this.elapsed < this.windup ? 'anticipation' : this.elapsed < this.windup + this.strike ? 'strike' : 'recovery';
  }
  get posePhase() { return this.contactFrame ? 'strike' : this.phase; }
  get visualElapsed() { return this.contactFrame ? this.windup : this.elapsed; }
  begin(target) {
    if (this.active || !target) return false;
    this.target = target; this.elapsed = 0; this.active = true;
    this.contacted = false; this.contactFrame = false;
    return true;
  }
  advance(dt) {
    const event = { contact: false, target: this.target, finished: false };
    if (!(dt > 0) || !Number.isFinite(dt)) return event;
    this.contactFrame = false;
    if (!this.active) return event;
    this.elapsed += dt;
    if (!this.contacted && this.elapsed + 1e-9 >= this.windup) {
      this.contacted = true; this.contactFrame = true; event.contact = true;
    }
    if (this.elapsed + 1e-9 >= this.duration) {
      this.active = false; this.target = null; event.finished = true;
    }
    return event;
  }
  cancel() {
    this.active = false; this.target = null; this.elapsed = 0;
    this.contacted = false; this.contactFrame = false;
  }
}

export function attackTiming(actor) {
  const gym = actor.personality === 'gym_uncle';
  const timing = gym ? { windup: .28, strike: .08, recovery: .28 }
    : { windup: actor.isBoss ? .18 : .1, strike: .05, recovery: .13 };
  // Preserve faster configurations too: recovery must fit inside attack cadence.
  const scale = Math.min(1, .85 / actor.attackSpeed / (timing.windup + timing.strike + timing.recovery));
  return Object.fromEntries(Object.entries(timing).map(([k, v]) => [k, v * scale]));
}
