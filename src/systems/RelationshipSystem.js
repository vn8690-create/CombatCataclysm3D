// RelationshipSystem evaluates personality links without letting comedy destroy battle readability.
const BASE_CHANCE = Object.freeze({
  friend: 0.012,
  rival: 0.038,
  fear: 0.025,
  hate: 0.045,
  crush: 0.018,
  idol: 0.016,
  annoyance: 0.040,
});

export class RelationshipSystem {
  constructor({ random = Math.random, globalCooldown = 4.5 } = {}) {
    this.random = random;
    this.globalCooldownMax = globalCooldown;
    this.cooldown = 0;
    this.registry = new Map();
    this.incidentTimes = [];
  }

  registerCharacter(runtimeConfig) {
    if (!runtimeConfig?.id) return;
    this.registry.set(runtimeConfig.id, runtimeConfig);
  }

  unregisterCharacter(id) {
    this.registry.delete(id);
  }

  update(dt, battleTime = 0) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.incidentTimes = this.incidentTimes.filter(t => battleTime - t < 30);
  }

  relationBetween(actorId, targetId) {
    const actor = this.registry.get(actorId);
    if (!actor) return null;
    return (actor.relationships || []).find(r => r.target === targetId) || null;
  }

  canAttempt(battleTime = 0) {
    if (this.cooldown > 0) return false;
    const recent = this.incidentTimes.filter(t => battleTime - t < 30).length;
    return recent < 2;
  }

  chooseInteraction(actorId, candidateIds = [], context = {}) {
    const battleTime = context.battleTime || 0;
    if (!this.canAttempt(battleTime)) return null;
    if (context.majorComedyActive) return null;

    const actor = this.registry.get(actorId);
    if (!actor) return null;

    const candidates = [];
    for (const targetId of candidateIds) {
      if (targetId === actorId) continue;
      const relation = this.relationBetween(actorId, targetId);
      if (!relation) continue;
      const base = BASE_CHANCE[relation.type] || 0;
      const strength = Number.isFinite(relation.strength) ? relation.strength : 0.5;
      const chance = Math.min(0.08, base * (0.55 + strength * 0.8));
      candidates.push({ targetId, relation, chance });
    }

    candidates.sort((a, b) => b.chance - a.chance);
    for (const candidate of candidates) {
      if (this.random() <= candidate.chance) {
        const event = this._makeEvent(actor, candidate.targetId, candidate.relation);
        this.cooldown = this.globalCooldownMax;
        this.incidentTimes.push(battleTime);
        return event;
      }
    }
    return null;
  }

  _makeEvent(actor, targetId, relation) {
    const common = {
      actorId: actor.id,
      targetId,
      relationType: relation.type,
      strength: relation.strength ?? 0.5,
      harmScale: 0,
      knockback: 0,
      comedyBeat: null,
    };

    switch (relation.type) {
      case 'hate':
        return {
          ...common,
          type: 'friendly_shove',
          harmScale: 0.12,
          knockback: 0.55,
          comedyBeat: { id: `hate-${actor.id}-${targetId}`, title: 'WRONG TARGET', priority: 'minor', duration: 0.45, impact: 'medium', slowMotion: 0.75 },
        };
      case 'rival':
        return {
          ...common,
          type: 'showoff_collision',
          harmScale: 0.08,
          knockback: 0.35,
          comedyBeat: { id: `rival-${actor.id}-${targetId}`, title: 'TOO COMPETITIVE', priority: 'minor', duration: 0.4, impact: 'medium' },
        };
      case 'annoyance':
        return {
          ...common,
          type: 'interrupt_action',
          harmScale: 0,
          knockback: 0.25,
          comedyBeat: { id: `annoy-${actor.id}-${targetId}`, title: 'NOT NOW', priority: 'minor', duration: 0.35, impact: 'light' },
        };
      case 'fear':
        return {
          ...common,
          type: 'panic_step',
          knockback: 0.45,
          comedyBeat: { id: `fear-${actor.id}-${targetId}`, title: 'NOPE', priority: 'minor', duration: 0.3, impact: 'light', suppressUI: false },
        };
      case 'crush':
      case 'idol':
        return {
          ...common,
          type: 'distracted_pause',
          comedyBeat: { id: `distracted-${actor.id}-${targetId}`, title: 'DISTRACTED', priority: 'minor', duration: 0.35, impact: 'light', suppressUI: false },
        };
      case 'friend':
      default:
        return {
          ...common,
          type: 'friendly_bump',
          knockback: 0.18,
          comedyBeat: null,
        };
    }
  }
}

RelationshipSystem.BASE_CHANCE = BASE_CHANCE;
