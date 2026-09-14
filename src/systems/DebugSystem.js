// DebugSystem renders an overlay panel with live stats.
export class DebugSystem {
  constructor(game) {
    this.game = game;
    this.el = game.debugEl;
    this.frames = 0;
    this.fpsAccum = 0;
    this.fps = 0;
  }

  update(dt, world) {
    this.frames++;
    this.fpsAccum += dt;
    if (this.fpsAccum >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsAccum);
      this.frames = 0;
      this.fpsAccum = 0;
    }

    if (!this.game.debugVisible) return;

    const lines = [];
    lines.push(`FPS: ${this.fps}`);
    if (world) {
      lines.push(`Units: ${world.units.filter(u => u.alive).length}`);
      lines.push(`Enemies: ${world.enemies.filter(e => e.alive).length}`);
      lines.push(`Projectiles: ${world.combat ? world.combat.projectiles.length : 0}`);
      lines.push(`Particles: ${world.vfx ? world.vfx.particles.length : 0}`);
      lines.push(`Money: ${world.economy ? Math.floor(world.economy.money) : 0}`);
      lines.push(`Time: ${world.time ? world.time.toFixed(1) : 0}s`);
      if (world.waveManager) {
        lines.push(`Wave queue: ${world.waveManager.spawnQueue.length}`);
        lines.push(`Boss alive: ${world.waveManager.bossAlive}`);
      }
      lines.push(`Chaos: ${world.chaosActive ? 'YES' : 'no'}`);
      if (world.playerBase) lines.push(`Player HP: ${Math.round(world.playerBase.hp)}/${world.playerBase.maxHp}`);
      if (world.enemyBase) lines.push(`Enemy HP: ${Math.round(world.enemyBase.hp)}/${world.enemyBase.maxHp}`);
    }
    this.el.innerHTML = lines.join('<br>');
  }
}
