// ControlledChaosSystem applies relationship incidents with strict caps so comedy stays recoverable.
export class ControlledChaosSystem {
  constructor({ relationshipSystem = null, comedyDirector = null } = {}) {
    this.relationships = relationshipSystem;
    this.comedyDirector = comedyDirector;
  }

  tryInteraction(actor, allies, world) {
    if (!actor?.alive || !this.relationships) return null;
    const actorId = actor.config?.id || actor.id;
    const candidateIds = allies
      .filter(a => a?.alive && a !== actor)
      .map(a => a.config?.id || a.id)
      .filter(Boolean);

    const event = this.relationships.chooseInteraction(actorId, candidateIds, {
      battleTime: world?.time || 0,
      majorComedyActive: !!this.comedyDirector?.active && this.comedyDirector.active.priorityValue >= 2,
    });
    if (!event) return null;

    const target = allies.find(a => (a.config?.id || a.id) === event.targetId && a.alive);
    if (!target) return null;

    this._apply(event, actor, target);
    if (event.comedyBeat) this.comedyDirector?.requestBeat(event.comedyBeat);
    return event;
  }

  _apply(event, actor, target) {
    if (event.harmScale > 0 && actor.attack > 0 && target.takeDamage) {
      const damage = Math.max(1, actor.attack * Math.min(0.25, event.harmScale));
      target.takeDamage(damage, actor);
      if (target.alive) target.reactToHit?.('light');
    }

    if (event.knockback > 0 && target.applyKnockback) {
      target.applyKnockback(Math.min(0.7, event.knockback));
    }

    if (event.type === 'distracted_pause' && Number.isFinite(target.stunTimer)) {
      target.stunTimer = Math.max(target.stunTimer, 0.25);
    }

    if (event.type === 'interrupt_action' && Number.isFinite(target.attackCd)) {
      target.attackCd += 0.25;
    }
  }
}
