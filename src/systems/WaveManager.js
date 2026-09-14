// WaveManager reads stage config and spawns enemies at scheduled times.
import * as THREE from 'three';
import { ENEMY_MAP, BOSS_MAP } from '../config/enemies.js';
import { STAGE_MAP } from '../config/stages.js';
import { BALANCE } from '../config/balance.js';

export class WaveManager {
  constructor(scene, vfx, stageId, hpMul, atkMul, spawnCb) {
    this.scene = scene;
    this.vfx = vfx;
    this.stageId = stageId;
    this.stage = STAGE_MAP[stageId];
    this.hpMul = hpMul;
    this.atkMul = atkMul;
    this.spawnCb = spawnCb;
    this.time = 0;
    this.spawnQueue = [];
    this.bossSpawned = {};
    this.waveIndex = 0;
    this.allWavesTriggered = false;
    this.bossAlive = false;
    this.chaosApplied = false;
    this._buildQueue();
  }

  _buildQueue() {
    if (!this.stage) return;
    for (const wave of this.stage.waves) {
      if (wave.enemies) {
        for (const group of wave.enemies) {
          const cfg = ENEMY_MAP[group.id];
          if (!cfg) continue;
          for (let i = 0; i < group.count; i++) {
            this.spawnQueue.push({
              time: wave.time + (group.delay || 0) + i * group.interval,
              id: group.id,
              x: BALANCE.ENEMY_BASE_X - 1.5,
              hpMul: this.hpMul,
              atkMul: this.atkMul,
            });
          }
        }
      }
      if (wave.boss) {
        this.spawnQueue.push({
          time: wave.time + (wave.boss.delay || 0),
          id: wave.boss.id,
          isBoss: true,
          x: BALANCE.ENEMY_BASE_X - 2.0,
          hpMul: this.hpMul,
          atkMul: this.atkMul,
        });
      }
    }
    this.spawnQueue.sort((a, b) => a.time - b.time);
  }

  update(dt, chaosActive) {
    this.time += dt;

    if (chaosActive && !this.chaosApplied) {
      this.chaosApplied = true;
      for (const entry of this.spawnQueue) {
        if (entry.time > this.time) {
          entry.time = this.time + (entry.time - this.time) * BALANCE.CHAOS_SPAWN_MUL;
        }
      }
      this.spawnQueue.sort((a, b) => a.time - b.time);
    }

    while (this.spawnQueue.length > 0) {
      const next = this.spawnQueue[0];
      if (this.time >= next.time) {
        this.spawnQueue.shift();
        this._spawn(next);
      } else {
        break;
      }
    }
    if (this.spawnQueue.length === 0) {
      this.allWavesTriggered = true;
    }
  }

  _spawn(entry) {
    const cfg = entry.isBoss ? BOSS_MAP[entry.id] : ENEMY_MAP[entry.id];
    if (!cfg) {
      console.warn('[WaveManager] unknown spawn id', entry.id);
      return;
    }
    if (entry.isBoss) {
      this.bossAlive = true;
      if (this.vfx) this.vfx.spawnShockwave(new THREE.Vector3(entry.x, 1, 0), 0xff6666);
    }
    this.spawnCb(cfg, entry.x, {
      hpMul: entry.hpMul,
      atkMul: entry.atkMul,
      isBoss: entry.isBoss,
    });
  }

  onBossDied() {
    this.bossAlive = false;
  }

  get isCleared() {
    return this.allWavesTriggered && !this.bossAlive;
  }
}
