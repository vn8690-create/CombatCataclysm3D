// CharacterFactory converts canonical Character DNA into the runtime unit config shape.
function toHex(value, fallback = 0xffffff) {
  if (Number.isInteger(value)) return value;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().replace(/^#/, '');
  const parsed = Number.parseInt(normalized, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const CHARACTER_ANIMATION_PRESETS = Object.freeze([
  'standard', 'gym_smash', 'office_jab', 'drunk_sway', 'grocery_throw',
]);
const ART_STATUSES = ['approved', 'provisional', 'placeholder'];
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Asset existence/decoding is checked by the asset tests and by the renderer's
// visible loading/error fallback. DNA only accepts portable local image paths.
export function isLocalCharacterAssetPath(value) {
  return typeof value === 'string'
    && /^\/?assets\/[a-z0-9_./-]+\.(?:svg|png)$/i.test(value)
    && !/(?:^|\/)\.{1,2}(?:\/|$)/.test(value);
}

export class CharacterFactory {
  static validateDNA(dna) {
    const errors = [];
    if (!isRecord(dna)) return ['Character DNA must be an object.'];
    if (!dna.id) errors.push('Missing id.');
    if (!dna.name) errors.push('Missing name.');
    for (const key of ['visual', 'stats', 'combat', 'comedy']) {
      if (!isRecord(dna[key])) errors.push(`Missing/invalid ${key} block.`);
    }

    if (isRecord(dna.visual)) {
      for (const key of ['portrait', 'battleSprite']) {
        if (dna.visual[key] != null && !isLocalCharacterAssetPath(dna.visual[key])) {
          errors.push(`visual.${key} must be a local assets/ SVG or PNG path.`);
        }
      }
      for (const key of ['battleSpriteWidth', 'battleSpriteHeight', 'battleBarY']) {
        const value = dna.visual[key];
        if (value != null && (!Number.isFinite(value) || value <= 0)) {
          errors.push(`visual.${key} must be a positive finite number.`);
        }
      }
      if (dna.visual.battleSprite && dna.visual.battleBarY != null &&
          dna.visual.battleBarY <= (dna.visual.battleSpriteHeight || 2.1)) {
        errors.push('visual.battleBarY must be above the battle sprite.');
      }
      if (dna.visual.animationPreset != null && !CHARACTER_ANIMATION_PRESETS.includes(dna.visual.animationPreset)) {
        errors.push('Unknown visual.animationPreset.');
      }
      if (dna.visual.artStatus != null && !ART_STATUSES.includes(dna.visual.artStatus)) {
        errors.push('Unknown visual.artStatus.');
      }
      if (dna.visual.animationPersonality != null && typeof dna.visual.animationPersonality !== 'string') {
        errors.push('visual.animationPersonality must be a string.');
      }
      const origin = dna.visual.projectileOrigin;
      if (origin != null && (!isRecord(origin) || !Number.isFinite(origin.x) || !Number.isFinite(origin.y) || origin.y < 0)) {
        errors.push('visual.projectileOrigin must contain finite x and nonnegative y.');
      }
    }
    if (dna.role != null && (typeof dna.role !== 'string' || !dna.role.trim())) {
      errors.push('role must be a nonempty string.');
    }

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
      battleBarY: dna.visual.battleBarY || (dna.visual.battleSprite ? (dna.visual.battleSpriteHeight || 2.1) + .15 : 1.7),
      animationPreset: dna.visual.animationPreset || 'standard',
      artStatus: dna.visual.artStatus || null,
      projectileOrigin: Object.freeze({ ...(dna.visual.projectileOrigin || { x: 0, y: 0.9 }) }),
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
