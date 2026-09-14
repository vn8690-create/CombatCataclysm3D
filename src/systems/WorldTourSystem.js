// WorldTourSystem keeps country packs data-driven and save-friendly.
export class WorldTourSystem {
  constructor(regions = [], saveState = null) {
    this.regions = new Map();
    for (const region of regions) this.registerRegion(region);
    const firstId = regions[0]?.id || null;
    this.unlocked = new Set(saveState?.unlockedRegions || (firstId ? [firstId] : []));
    this.completed = new Set(saveState?.completedRegions || []);
    this.currentRegionId = saveState?.currentRegionId || firstId;
  }

  validateRegion(region) {
    const errors = [];
    if (!region?.id) errors.push('Missing region id.');
    if (!region?.name) errors.push('Missing region name.');
    if (!Array.isArray(region?.starterArchetypes)) errors.push('starterArchetypes must be an array.');
    if (!Array.isArray(region?.enemyArchetypes)) errors.push('enemyArchetypes must be an array.');
    if (!Array.isArray(region?.bossArchetypes)) errors.push('bossArchetypes must be an array.');
    if (!Array.isArray(region?.hazards)) errors.push('hazards must be an array.');
    return errors;
  }

  registerRegion(region) {
    const errors = this.validateRegion(region);
    if (errors.length) throw new Error(`Invalid region: ${errors.join(' ')}`);
    if (this.regions.has(region.id)) throw new Error(`Duplicate region id: ${region.id}`);
    this.regions.set(region.id, Object.freeze({ ...region }));
  }

  getRegion(id) {
    return this.regions.get(id) || null;
  }

  listRegions() {
    return [...this.regions.values()];
  }

  isUnlocked(id) {
    return this.unlocked.has(id);
  }

  unlock(id) {
    if (!this.regions.has(id)) return false;
    this.unlocked.add(id);
    return true;
  }

  select(id) {
    if (!this.regions.has(id) || !this.isUnlocked(id)) return false;
    this.currentRegionId = id;
    return true;
  }

  complete(id, unlockNextId = null) {
    if (!this.regions.has(id)) return false;
    this.completed.add(id);
    if (unlockNextId) this.unlock(unlockNextId);
    return true;
  }

  getEncounterPool(id = this.currentRegionId) {
    const region = this.getRegion(id);
    if (!region) return null;
    return {
      units: [...region.starterArchetypes],
      enemies: [...region.enemyArchetypes],
      bosses: [...region.bossArchetypes],
      hazards: [...region.hazards],
    };
  }

  serialize() {
    return {
      currentRegionId: this.currentRegionId,
      unlockedRegions: [...this.unlocked],
      completedRegions: [...this.completed],
    };
  }
}
