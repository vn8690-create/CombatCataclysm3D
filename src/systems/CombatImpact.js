export function impactPosition(target, source) {
  const p = target.group.position.clone();
  const sx = source?.group?.position?.x ?? source?.x ?? p.x - 1;
  if (target.isPlayer !== undefined) {
    p.x += Math.sign(sx - p.x) * .82;
    p.y = 1.15;
    p.z += Math.max(-.72, Math.min(.72, source?.group?.position?.z ?? source?.z ?? 0));
  } else {
    p.x += Math.sign(sx - p.x) * .5 * (target.config?.scale || 1);
    p.y += .85;
    p.z += .38 * (target.config?.scale || 1);
  }
  return p;
}

// One presentation route per actual damage event, including base contact.
export function applyImpact(target, damage, source, world, options = {}) {
  if (!target?.alive) return false;
  const position = options.position || impactPosition(target, source);
  target.takeDamage(damage, source, { impactPosition: position, suppressHitSpark: true });
  const killed = !target.alive;
  const gym = source?.personality === 'gym_uncle';
  const level = target.isPlayer !== undefined ? 'base' : source?.isBoss || target.isBoss ? 'boss'
    : gym ? 'heavy' : world.combatFeel?.classifyDamage(damage, target.maxHp, killed) || 'light';
  if (!killed) target.reactToHit?.(level);
  if (options.camera !== false) world.combatFeel?.impact(level);
  const vfx = world.vfx || source?.vfx;
  if (options.effects !== false) {
    if (gym) vfx?.spawnGymImpact(position);
    else vfx?.spawnHitSpark(position, options.color || 0xffcc66);
  }
  world.onCombatEvent?.({ type: 'impact', actor: source, target, damage, position: position.clone(), level });
  return killed;
}
