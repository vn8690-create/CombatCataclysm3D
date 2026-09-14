// ComedyDirector coordinates rare battlefield beats so jokes stay readable instead of becoming UI noise.
const PRIORITY = Object.freeze({ minor: 1, major: 2, legendary: 3 });

export class ComedyDirector {
  constructor({ camera = null, combatFeel = null, onBeatStart = null, onBeatEnd = null } = {}) {
    this.camera = camera;
    this.combatFeel = combatFeel;
    this.onBeatStart = onBeatStart;
    this.onBeatEnd = onBeatEnd;
    this.baseFov = camera?.fov || 50;
    this.active = null;
    this.queue = [];
    this.cooldown = 0;
    this.recent = new Map();
  }

  requestBeat(event = {}) {
    const beat = this._normalize(event);
    if (!beat.id) return false;

    const recentLeft = this.recent.get(beat.id) || 0;
    if (recentLeft > 0) return false;

    if (!this.active && this.cooldown <= 0) {
      this._start(beat);
      return true;
    }

    if (this.active && beat.priorityValue > this.active.priorityValue && beat.priorityValue >= PRIORITY.legendary) {
      this._finish();
      this._start(beat);
      return true;
    }

    if (this.queue.some(item => item.id === beat.id)) return false;
    this.queue.push(beat);
    this.queue.sort((a, b) => b.priorityValue - a.priorityValue);
    if (this.queue.length > 3) this.queue.length = 3;
    return true;
  }

  _normalize(event) {
    const priority = PRIORITY[event.priority] ? event.priority : 'major';
    return {
      id: String(event.id || ''),
      title: String(event.title || ''),
      subtitle: String(event.subtitle || ''),
      duration: Math.max(0.2, event.duration || 0.8),
      priority,
      priorityValue: PRIORITY[priority],
      impact: event.impact || (priority === 'legendary' ? 'boss' : priority === 'major' ? 'heavy' : 'medium'),
      slowMotion: Math.max(0.2, Math.min(1, event.slowMotion || 1)),
      zoom: Math.max(0, Math.min(0.22, event.zoom ?? (priority === 'minor' ? 0.04 : 0.10))),
      suppressUI: event.suppressUI !== false,
      spotlight: event.spotlight !== false,
      remaining: Math.max(0.2, event.duration || 0.8),
    };
  }

  _start(beat) {
    this.active = { ...beat, remaining: beat.duration };
    this.recent.set(beat.id, 7.5);
    this.combatFeel?.impact(beat.impact);
    this.onBeatStart?.(this.active);
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    for (const [id, left] of this.recent) {
      const next = left - dt;
      if (next <= 0) this.recent.delete(id);
      else this.recent.set(id, next);
    }

    if (this.active) {
      this.active.remaining -= dt;
      this._updateCamera();
      if (this.active.remaining <= 0) this._finish();
    } else {
      this._resetCamera();
      if (this.cooldown <= 0 && this.queue.length > 0) this._start(this.queue.shift());
    }
  }

  simulationScale() {
    return this.active?.slowMotion || 1;
  }

  _updateCamera() {
    if (!this.camera || !this.active) return;
    const progress = 1 - this.active.remaining / this.active.duration;
    const envelope = Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI);
    this.camera.fov = this.baseFov * (1 - this.active.zoom * envelope);
    this.camera.updateProjectionMatrix?.();
  }

  _resetCamera() {
    if (!this.camera) return;
    if (Math.abs(this.camera.fov - this.baseFov) > 0.001) {
      this.camera.fov = this.baseFov;
      this.camera.updateProjectionMatrix?.();
    }
  }

  _finish() {
    if (!this.active) return;
    const finished = this.active;
    this.active = null;
    this.cooldown = Math.max(this.cooldown, finished.priorityValue >= PRIORITY.major ? 1.5 : 0.6);
    this._resetCamera();
    this.onBeatEnd?.(finished);
  }

  clear() {
    this.queue.length = 0;
    this.recent.clear();
    this.cooldown = 0;
    if (this.active) this.onBeatEnd?.(this.active);
    this.active = null;
    this._resetCamera();
  }
}

ComedyDirector.PRIORITY = PRIORITY;
