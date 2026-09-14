// Stage definitions. Each stage defines waves of enemies over time.
// wave: { time, enemies: [ {id, count, interval, delay} ] , boss?: {id, delay} }
// Difficulty multipliers apply to all spawned enemies.

export const STAGES = [
  { id: 1, name: 'Cubicle Skirmish', enemyHpMul: 1.0, enemyAtkMul: 1.0, reward: 100, waves: [
    { time: 0, enemies: [{ id: 'angry_printer', count: 3, interval: 2.0 }] },
    { time: 14, enemies: [{ id: 'angry_printer', count: 4, interval: 1.8 }] },
    { time: 28, enemies: [{ id: 'spreadsheet_slime', count: 4, interval: 1.6 }] },
  ]},
  { id: 2, name: 'Breakroom Brawl', enemyHpMul: 1.15, enemyAtkMul: 1.1, reward: 120, waves: [
    { time: 0, enemies: [{ id: 'angry_printer', count: 4, interval: 1.8 }] },
    { time: 12, enemies: [{ id: 'traffic_cone_soldier', count: 4, interval: 1.6 }] },
    { time: 26, enemies: [{ id: 'tax_goblin', count: 3, interval: 1.8 }] },
    { time: 42, enemies: [{ id: 'spreadsheet_slime', count: 5, interval: 1.4 }] },
  ]},
  { id: 3, name: 'Parking Lot Panic', enemyHpMul: 1.3, enemyAtkMul: 1.15, reward: 150, waves: [
    { time: 0, enemies: [{ id: 'traffic_cone_soldier', count: 5, interval: 1.6 }] },
    { time: 16, enemies: [{ id: 'spam_email_bat', count: 5, interval: 1.2 }] },
    { time: 32, enemies: [{ id: 'overwork_zombie', count: 3, interval: 2.0 }] },
    { time: 50, enemies: [{ id: 'tax_goblin', count: 4, interval: 1.4 }] },
  ]},
  { id: 4, name: 'Mega Printer Mayhem', enemyHpMul: 1.4, enemyAtkMul: 1.2, reward: 220, isBossStage: true, waves: [
    { time: 0, enemies: [{ id: 'angry_printer', count: 5, interval: 1.6 }] },
    { time: 18, enemies: [{ id: 'spreadsheet_slime', count: 5, interval: 1.3 }] },
    { time: 36, enemies: [{ id: 'spam_email_bat', count: 4, interval: 1.2 }] },
    { time: 56, boss: { id: 'mega_printer', delay: 1.5 } },
  ]},
  { id: 5, name: 'Overtime Onslaught', enemyHpMul: 1.55, enemyAtkMul: 1.25, reward: 180, waves: [
    { time: 0, enemies: [{ id: 'overwork_zombie', count: 4, interval: 1.8 }] },
    { time: 14, enemies: [{ id: 'deadline_demon', count: 3, interval: 1.8 }] },
    { time: 30, enemies: [{ id: 'traffic_cone_soldier', count: 6, interval: 1.2 }] },
    { time: 46, enemies: [{ id: 'tax_goblin', count: 5, interval: 1.2 }] },
  ]},
  { id: 6, name: 'Deadline Dungeon', enemyHpMul: 1.7, enemyAtkMul: 1.3, reward: 200, waves: [
    { time: 0, enemies: [{ id: 'deadline_demon', count: 4, interval: 1.6 }] },
    { time: 16, enemies: [{ id: 'spam_email_bat', count: 6, interval: 1.0 }] },
    { time: 32, enemies: [{ id: 'overwork_zombie', count: 4, interval: 1.6 }] },
    { time: 48, enemies: [{ id: 'spreadsheet_slime', count: 6, interval: 1.2 }] },
  ]},
  { id: 7, name: 'Tax Dragon Lair', enemyHpMul: 1.85, enemyAtkMul: 1.35, reward: 320, isBossStage: true, waves: [
    { time: 0, enemies: [{ id: 'tax_goblin', count: 6, interval: 1.4 }] },
    { time: 20, enemies: [{ id: 'deadline_demon', count: 4, interval: 1.5 }] },
    { time: 40, enemies: [{ id: 'overwork_zombie', count: 4, interval: 1.6 }] },
    { time: 60, boss: { id: 'tax_dragon', delay: 1.5 } },
  ]},
  { id: 8, name: 'Slime Sewers', enemyHpMul: 2.0, enemyAtkMul: 1.4, reward: 240, waves: [
    { time: 0, enemies: [{ id: 'spreadsheet_slime', count: 8, interval: 1.0 }] },
    { time: 18, enemies: [{ id: 'spam_email_bat', count: 8, interval: 0.9 }] },
    { time: 36, enemies: [{ id: 'traffic_cone_soldier', count: 6, interval: 1.0 }] },
    { time: 54, enemies: [{ id: 'overwork_zombie', count: 5, interval: 1.4 }] },
  ]},
  { id: 9, name: 'Deadline Demon Throne', enemyHpMul: 2.2, enemyAtkMul: 1.5, reward: 420, isBossStage: true, waves: [
    { time: 0, enemies: [{ id: 'deadline_demon', count: 6, interval: 1.2 }] },
    { time: 20, enemies: [{ id: 'tax_goblin', count: 6, interval: 1.0 }] },
    { time: 40, enemies: [{ id: 'overwork_zombie', count: 5, interval: 1.2 }] },
    { time: 62, boss: { id: 'deadline_demon_king', delay: 1.5 } },
  ]},
  { id: 10, name: 'Algorithm Overlord', enemyHpMul: 2.4, enemyAtkMul: 1.6, reward: 600, isBossStage: true, waves: [
    { time: 0, enemies: [{ id: 'deadline_demon', count: 5, interval: 1.2 }] },
    { time: 16, enemies: [{ id: 'spam_email_bat', count: 8, interval: 0.8 }] },
    { time: 32, enemies: [{ id: 'overwork_zombie', count: 6, interval: 1.2 }] },
    { time: 50, enemies: [{ id: 'tax_goblin', count: 6, interval: 1.0 }] },
    { time: 70, boss: { id: 'algorithm_overlord', delay: 2.0 } },
  ]},
];

export const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]));
