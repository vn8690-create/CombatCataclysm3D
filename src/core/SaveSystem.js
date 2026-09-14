// Persistent save system — wraps localStorage with safe defaults.
const SAVE_KEY = 'cc3d_save_v1';

const DEFAULT_SAVE = {
  unlockedStages: [1],
  clearedStages: {},
  upgrades: {},
  money: 0,
  boken: null,
  version: 1,
};

export class SaveSystem {
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SAVE,
        ...parsed,
        unlockedStages: Array.from(new Set([...DEFAULT_SAVE.unlockedStages, ...(parsed.unlockedStages || [])])),
        clearedStages: { ...(parsed.clearedStages || {}) },
        upgrades: { ...(parsed.upgrades || {}) },
        boken: parsed.boken && typeof parsed.boken === 'object' ? { ...parsed.boken } : null,
      };
    } catch (e) {
      console.warn('[SaveSystem] load failed, using defaults', e);
      return { ...DEFAULT_SAVE };
    }
  }

  static save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('[SaveSystem] save failed', e);
      return false;
    }
  }

  static reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    return { ...DEFAULT_SAVE };
  }

  static isStageUnlocked(data, stageId) {
    return data.unlockedStages.includes(stageId);
  }

  static unlockStage(data, stageId) {
    if (!data.unlockedStages.includes(stageId)) {
      data.unlockedStages.push(stageId);
      data.unlockedStages.sort((a, b) => a - b);
    }
  }

  static markCleared(data, stageId, maxStageId = Infinity) {
    data.clearedStages[stageId] = true;
    if (stageId + 1 <= maxStageId) SaveSystem.unlockStage(data, stageId + 1);
  }

  static getUpgradeLevel(data, upgradeId) {
    return data.upgrades[upgradeId] || 0;
  }

  static setUpgradeLevel(data, upgradeId, level) {
    data.upgrades[upgradeId] = level;
  }
}
