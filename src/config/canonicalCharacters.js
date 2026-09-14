import { CharacterFactory } from '../systems/CharacterFactory.js';

export const GYM_UNCLE_DNA = Object.freeze({
  id: 'gym_uncle',
  name: 'Gym Uncle',
  role: 'frontline',
  country: 'global',
  visual: {
    icon: '🏋️', color: '#c75bff', accent: '#fff06a', modelType: 'capsule', scale: 1.22,
    silhouette: 'Huge upper body, tiny legs, oversized dumbbell.',
    animationPersonality: 'Top-heavy swagger, tiny rapid steps, dramatic recoil.',
  },
  stats: { cost: 170, hp: 340, attack: 58, range: 1.45, attackSpeed: 0.72, moveSpeed: 1.0, deployCD: 5.8 },
  combat: {
    attackType: 'melee', special: 'knockback', normalSkill: 'Weight Smack', passive: 'Armor Bully', hiddenSkill: 'Manager Cannon',
    counterHooks: ['armored', 'manager'],
  },
  traits: ['loud', 'armored_counter', 'protein_obsessed', 'top_heavy'],
  relationships: [
    { target: 'manager', type: 'hate', strength: 0.85 },
    { target: 'manager', type: 'annoyance', strength: 0.95 },
  ],
  comedy: {
    failureBehavior: 'Overcommits to a swing and launches the wrong thing.',
    comedyEvents: ['manager_cannon', 'human_baseball', 'protein_rage'],
    rareBehaviorChance: 0.05,
    voice: 'Booming confidence until tiny-leg physics intervenes.',
  },
});

export const MANAGER_DNA = Object.freeze({
  id: 'manager',
  name: 'Manager',
  role: 'support',
  country: 'global',
  visual: {
    icon: '📊', color: '#4e78ff', accent: '#f7f7ff', modelType: 'box', scale: 1,
    silhouette: 'Compact office silhouette with clipboard/tablet.',
    animationPersonality: 'Tiny authoritative gestures and frantic pointing.',
  },
  stats: { cost: 220, hp: 150, attack: 18, range: 4.8, attackSpeed: 0.55, moveSpeed: 0.78, deployCD: 8.5 },
  combat: {
    attackType: 'ranged', projectileSpeed: 8.5, projectileColor: '#91b6ff', special: 'support',
    normalSkill: 'PowerPoint Attack', passive: 'Annoyance Meter', hiddenSkill: 'Emergency Meeting',
    counterHooks: ['long_fight', 'gym_uncle'],
  },
  traits: ['support', 'non_frontline', 'annoying_authority', 'paperwork'],
  relationships: [{ target: 'gym_uncle', type: 'annoyance', strength: 0.92 }],
  comedy: {
    failureBehavior: 'Issues an order at exactly the wrong moment.',
    comedyEvents: ['emergency_meeting', 'powerpoint_attack', 'manager_cannon'],
    rareBehaviorChance: 0.045,
    voice: 'Corporate certainty while everything burns.',
  },
});

export const CANONICAL_DNA = Object.freeze([GYM_UNCLE_DNA, MANAGER_DNA]);
export const CANONICAL_UNITS = Object.freeze(CANONICAL_DNA.map(dna => CharacterFactory.createRuntimeConfig(dna)));
