// CharacterFactory converts canonical Character DNA into the runtime unit config shape.
function toHex(value, fallback = 0xffffff) {
  if (Number.isInteger(value)) return value;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().replace(/^#/, '');
  const parsed = Number.parseInt(normalized, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class CharacterFactory {
  static validateDNA(dna) {
    const errors = [];
    if (!dna || typeof dna !== 'object') return ['Character DNA must be an object.'];
    if (!dna.id) errors.push('Missing id.');
    if (!dna.name) errors.push('Missing name.');
    if (!dna.visual) errors.push('Missing visual block.');
    if (!dna.stats) errors.push('Missing stats block.');
    if (!dna.combat) errors.push('Missing combat block.');
    if (!dna.comedy) errors.push('Missing comedy block.');

    const requiredStats = ['cost', 'hp', 'attack', 'range', 'attackSpeed', 'moveSpeed', 'deployCD'];
    for (const key of requiredStats) {
      if (dna.stats && !Number.isFinite(dna.stats[key])) errors.push(`Missing/invalid stats.${key}.`);
    }

    if (dna.combat && !['melee', 'ranged'].includes(dna.combat.attackType)) {
      errors.push('combat.attackType must be melee or ranged.');
    }
    return errors;
  }

  static createRuntimeConfig(dna) {
    const errors = CharacterFactory.validateDNA(dna);
    if (errors.length) throw new Error(`Invalid Character DNA: ${errors.join(' ')}`);

    return Object.freeze({
      id: dna.id,
      name: dna.name,
      icon: dna.visual.icon || '❓',
      portrait: dna.visual.portrait || null,
      battleSprite: dna.visual.battleSprite || null,
      battleSpriteWidth: dna.visual.battleSpriteWidth || 1.55,
      battleSpriteHeight: dna.visual.battleSpriteHeight || 2.1,
      battleBarY: dna.visual.battleBarY || 1.7,
      color: toHex(dna.visual.color, 0xffffff),
      accent: toHex(dna.visual.accent, 0x222222),
      modelType: dna.visual.modelType || 'box',
      scale: dna.visual.scale || 1,
      cost: dna.stats.cost,
      hp: dna.stats.hp,
      attack: dna.stats.attack,
      range: dna.stats.range,
      attackSpeed: dna.stats.attackSpeed,
      moveSpeed: dna.stats.moveSpeed,
      deployCD: dna.stats.deployCD,
      attackType: dna.combat.attackType,
      projectileSpeed: dna.combat.projectileSpeed || 0,
      projectileColor: toHex(dna.combat.projectileColor, toHex(dna.visual.accent, 0xffffff)),
      special: dna.combat.special || null,
      normalSkill: dna.combat.normalSkill || null,
      passive: dna.combat.passive || null,
      hiddenSkill: dna.combat.hiddenSkill || null,
      traits: Object.freeze([...(dna.traits || [])]),
      relationships: Object.freeze((dna.relationships || []).map(r => Object.freeze({ ...r }))),
      counterHooks: Object.freeze([...(dna.combat.counterHooks || [])]),
      comedyEvents: Object.freeze([...(dna.comedy.comedyEvents || [])]),
      failureBehavior: dna.comedy.failureBehavior || '',
      rareBehaviorChance: dna.comedy.rareBehaviorChance || 0,
      animationPersonality: dna.visual.animationPersonality || '',
      role: dna.role,
      country: dna.country || 'global',
      dna,
    });
  }

  static indexDNA(entries = []) {
    const map = new Map();
    for (const dna of entries) {
      const runtime = CharacterFactory.createRuntimeConfig(dna);
      if (map.has(runtime.id)) throw new Error(`Duplicate character id: ${runtime.id}`);
      map.set(runtime.id, runtime);
    }
    return map;
  }
}

export { toHex as parseCharacterColor };
