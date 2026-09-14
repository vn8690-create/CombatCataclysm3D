// Persistent upgrades. Each upgrade boosts a category of player stats.
// apply(stats) mutates a stats object that units read at spawn time.
import { BALANCE } from './balance.js';

export const UPGRADES = [
  {
    id: 'dmg',
    name: 'Power Quotient',
    desc: '+12% unit attack per level',
    maxLevel: BALANCE.MAX_UPGRADE_LEVEL,
    baseCost: BALANCE.UPGRADE_COST_BASE,
    growth: BALANCE.UPGRADE_COST_GROWTH,
    apply: (stats, lvl) => { stats.attackMul *= (1 + 0.12 * lvl); },
  },
  {
    id: 'hp',
    name: 'Iron Resolve',
    desc: '+15% unit HP per level',
    maxLevel: BALANCE.MAX_UPGRADE_LEVEL,
    baseCost: BALANCE.UPGRADE_COST_BASE,
    growth: BALANCE.UPGRADE_COST_GROWTH,
    apply: (stats, lvl) => { stats.hpMul *= (1 + 0.15 * lvl); },
  },
  {
    id: 'eco',
    name: 'Side Hustle',
    desc: '+12% money gain per level',
    maxLevel: BALANCE.MAX_UPGRADE_LEVEL,
    baseCost: BALANCE.UPGRADE_COST_BASE,
    growth: BALANCE.UPGRADE_COST_GROWTH,
    apply: (stats, lvl) => { stats.moneyMul *= (1 + 0.12 * lvl); },
  },
  {
    id: 'deploy',
    name: 'Quick Deploy',
    desc: '-8% deploy cooldown per level',
    maxLevel: BALANCE.MAX_UPGRADE_LEVEL,
    baseCost: BALANCE.UPGRADE_COST_BASE,
    growth: BALANCE.UPGRADE_COST_GROWTH,
    apply: (stats, lvl) => { stats.cdMul *= (1 - 0.08 * lvl); },
  },
  {
    id: 'start_money',
    name: 'Coffee Fund',
    desc: '+40 starting money per level',
    maxLevel: BALANCE.MAX_UPGRADE_LEVEL,
    baseCost: BALANCE.UPGRADE_COST_BASE,
    growth: BALANCE.UPGRADE_COST_GROWTH,
    apply: (stats, lvl) => { stats.startMoneyBonus += 40 * lvl; },
  },
  {
    id: 'base_hp',
    name: 'Reinforced Walls',
    desc: '+15% player base HP per level',
    maxLevel: BALANCE.MAX_UPGRADE_LEVEL,
    baseCost: BALANCE.UPGRADE_COST_BASE,
    growth: BALANCE.UPGRADE_COST_GROWTH,
    apply: (stats, lvl) => { stats.baseHpMul *= (1 + 0.15 * lvl); },
  },
  {
    id: 'burn',
    name: 'Spice Mix',
    desc: '+20% burn damage per level',
    maxLevel: BALANCE.MAX_UPGRADE_LEVEL,
    baseCost: BALANCE.UPGRADE_COST_BASE,
    growth: BALANCE.UPGRADE_COST_GROWTH,
    apply: (stats, lvl) => { stats.burnMul *= (1 + 0.2 * lvl); },
  },
  {
    id: 'stun',
    name: 'Heavy Hands',
    desc: '+15% stun duration per level',
    maxLevel: BALANCE.MAX_UPGRADE_LEVEL,
    baseCost: BALANCE.UPGRADE_COST_BASE,
    growth: BALANCE.UPGRADE_COST_GROWTH,
    apply: (stats, lvl) => { stats.stunMul *= (1 + 0.15 * lvl); },
  },
];

export const UPGRADE_MAP = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

export function defaultStats() {
  return {
    attackMul: 1.0,
    hpMul: 1.0,
    moneyMul: 1.0,
    cdMul: 1.0,
    startMoneyBonus: 0,
    baseHpMul: 1.0,
    burnMul: 1.0,
    stunMul: 1.0,
  };
}

export function costFor(upgrade, currentLevel) {
  return Math.round(upgrade.baseCost * Math.pow(upgrade.growth, currentLevel));
}
