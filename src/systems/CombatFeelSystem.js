// Centralized combat feel controller: hit-stop, impact tiers and camera shake.
export class CombatFeelSystem {
  constructor(camera) {
    this.impactCooldown = 0;
    this.lastTier = 0;
    this.camera = camera;
    this.baseCameraPos = camera.position.clone();
    this.hitStopRemaining = 0;
    this.shakeRemaining = 0;
    this.shakeDuration = 0;
    this.shakeAmplitude = 0;
  }

  impact(level = 'light') {
    const resolved = CombatFeelSystem.PRESETS[level] ? level : 'light';
    const preset = CombatFeelSystem.PRESETS[resolved];
    const tier = ['light', 'medium', 'heavy', 'base', 'ko', 'boss'].indexOf(resolved);
    if (this.impactCooldown > 0 && tier <= this.lastTier) return resolved;
    this.lastTier = tier;
    this.impactCooldown = .16;
    this.hitStopRemaining = Math.max(this.hitStopRemaining, preset.hitStop);
    this.shakeRemaining = Math.max(this.shakeRemaining, preset.shakeDuration);
    this.shakeDuration = Math.max(this.shakeDuration, preset.shakeDuration);
    this.shakeAmplitude = Math.max(this.shakeAmplitude, preset.shakeAmplitude);
    return resolved;
  }

  classifyDamage(damage, targetMaxHp = 100, killed = false) {
    if (killed) return 'ko';
    const ratio = targetMaxHp > 0 ? damage / targetMaxHp : 0;
    if (ratio >= 0.22) return 'heavy';
    if (ratio >= 0.08) return 'medium';
    return 'light';
  }

  impactFromDamage(damage, targetMaxHp = 100, killed = false) {
    const level = this.classifyDamage(damage, targetMaxHp, killed);
    this.impact(level);
    return level;
  }

  simulationDt(dt) {
    this.impactCooldown = Math.max(0, this.impactCooldown - dt);
    if (this.impactCooldown === 0) this.lastTier = 0;
    if (this.hitStopRemaining <= 0) return dt;
    const consumed = Math.min(dt, this.hitStopRemaining);
    this.hitStopRemaining -= consumed;
    return Math.max(0, dt - consumed);
  }

  updateCamera(dt) {
    if (!this.camera) return;
    if (this.shakeRemaining > 0) {
      this.shakeRemaining = Math.max(0, this.shakeRemaining - dt);
      const t = this.shakeDuration > 0 ? this.shakeRemaining / this.shakeDuration : 0;
      const amp = this.shakeAmplitude * t;
      this.camera.position.set(
        this.baseCameraPos.x + (Math.random() - 0.5) * amp,
        this.baseCameraPos.y + (Math.random() - 0.5) * amp * 0.55,
        this.baseCameraPos.z
      );
      if (this.shakeRemaining <= 0) this._resetCamera();
    } else {
      this._resetCamera();
    }
  }

  _resetCamera() {
    if (this.camera) this.camera.position.copy(this.baseCameraPos);
    this.shakeAmplitude = 0;
    this.shakeDuration = 0;
  }

  clear() {
    this.impactCooldown = 0;
    this.lastTier = 0;
    this.hitStopRemaining = 0;
    this.shakeRemaining = 0;
    this._resetCamera();
  }
}

CombatFeelSystem.PRESETS = Object.freeze({
  light:  { hitStop: 0.018, shakeDuration: 0.07, shakeAmplitude: 0.05 },
  medium: { hitStop: 0.032, shakeDuration: 0.11, shakeAmplitude: 0.09 },
  heavy:  { hitStop: 0.050, shakeDuration: 0.16, shakeAmplitude: 0.15 },
  base:   { hitStop: 0.045, shakeDuration: 0.14, shakeAmplitude: 0.12 },
  ko:     { hitStop: 0.065, shakeDuration: 0.22, shakeAmplitude: 0.20 },
  boss:   { hitStop: 0.080, shakeDuration: 0.28, shakeAmplitude: 0.20 },
});
