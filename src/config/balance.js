// Global balance constants for Combat Cataclysm 3D
export const BALANCE = {
  // Lane / world
  LANE_LENGTH: 22,        // x distance between bases
  LANE_WIDTH: 6,
  GROUND_Y: 0,
  UNIT_Y: 0.6,
  PLAYER_BASE_X: -10,
  ENEMY_BASE_X: 10,

  // Base stats
  PLAYER_BASE_HP: 1500,
  ENEMY_BASE_HP: 1800,

  // Economy
  START_MONEY: 120,
  MONEY_RATE: 6,          // money per second passive
  MONEY_PER_KILL_MUL: 1.0,
  MAX_MONEY: 9999,

  // Chaos mode
  CHAOS_TIME: 90,         // seconds before chaos triggers
  CHAOS_SPAWN_MUL: 0.5,   // enemy spawn interval multiplied by this
  CHAOS_MONEY_MUL: 1.5,

  // Combat
  STUN_BASE_DURATION: 1.2,
  BURN_DURATION: 2.5,
  BURN_TICK: 0.5,
  KNOCKBACK_FORCE: 1.6,
  DASH_RANGE: 4.0,
  DASH_SPEED: 14,
  TAUNT_RADIUS: 3.0,

  // Cooldowns
  GLOBAL_DEPLOY_CD_FLOOR: 0.4,

  // Upgrades
  MAX_UPGRADE_LEVEL: 5,
  UPGRADE_COST_BASE: 80,
  UPGRADE_COST_GROWTH: 1.6,

  // Camera
  CAMERA_FOV: 50,
  CAMERA_POS: { x: 0, y: 6.5, z: 13 },
  CAMERA_LOOK: { x: 0, y: 1.5, z: 0 },
};
