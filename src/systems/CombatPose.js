// Code-driven motion of existing art, not a multi-frame sprite animation.
const NEW_PRESETS = ['office_jab', 'drunk_sway', 'grocery_throw'];
export const characterDepthOffset = actor => actor.personality === 'gym_uncle'
  ? -.12 * actor.group.position.z
  : NEW_PRESETS.includes(actor.config?.animationPreset) ? -.45 * actor.group.position.z : 0;

export function updateCombatPose(actor, dt) {
  actor.hitReactTimer = Math.max(0, actor.hitReactTimer - dt);
  if (actor.mat.emissive) actor.mat.emissive.setHex(actor.hitReactTimer > 0 ? 0x442210 : 0);
  const timeline = actor.attackTimeline;
  const phase = timeline.posePhase;
  const gym = actor.personality === 'gym_uncle';
  const dir = actor.side === 'enemy' ? -1 : 1;
  const body = actor.body;
  const originX = actor.baseBodyX || 0;
  const originY = actor.baseBodyY ?? .7;
  // Tiny stable presentation-only offset separates tall billboard silhouettes.
  const visualX = characterDepthOffset(actor);
  if (actor.isSpriteBody) {
    body.children[0].renderOrder = 10 + actor.group.position.z;
  }
  if (phase !== 'idle') {
    actor.animationState = phase;
    let x, y, rot, sx, sy;
    if (phase === 'anticipation') {
      const t = Math.min(1, timeline.visualElapsed / timeline.windup);
      const load = Math.min(1, t / .7);
      // Hold the loaded pose, then accelerate into contact in the final 30%.
      const swing = t > .7 ? ((t - .7) / .3) ** 2 : 0;
      x = -.12 * load + .42 * swing;
      y = .07 * load - .18 * swing;
      rot = .25 * load - .67 * swing;
      sx = 1 - .045 * load + .19 * swing;
      sy = 1 + .055 * load - .20 * swing;
    } else {
      const recovery = phase === 'strike' ? 0 : Math.min(1,
        (timeline.visualElapsed - timeline.windup - timeline.strike) / timeline.recovery);
      const weight = (1 - recovery) ** 2;
      x = .30 * weight; y = -.11 * weight; rot = -.42 * weight;
      sx = 1 + .145 * weight; sy = 1 - .145 * weight;
    }
    let power = gym ? 1 : .4;
    const preset = actor.config?.animationPreset;
    if (!gym && NEW_PRESETS.includes(preset)) {
      // Only presentation changes: contact, cooldown and projectile release
      // continue to come from the unmodified Day 2 timeline.
      const anticipation = phase === 'anticipation';
      const t = anticipation ? Math.min(1, timeline.visualElapsed / timeline.windup) : 1;
      const load = anticipation ? Math.sin(t * Math.PI * .5) : 0;
      const release = anticipation ? Math.max(0, (t - .7) / .3) ** 2
        : phase === 'strike' ? 1 : (1 - Math.min(1,
          (timeline.visualElapsed - timeline.windup - timeline.strike) / timeline.recovery)) ** 2;
      const shape = preset === 'office_jab' ? [.05, .16, .08, -.12, .018]
        : preset === 'drunk_sway' ? [.09, .19, .17, -.20, .035]
        : [.08, .16, .13, -.17, .025];
      x = -shape[0] * load + shape[1] * release;
      rot = shape[2] * load + shape[3] * release;
      sx = 1 + shape[4] * release;
      sy = 1 - shape[4] * release;
      y = originY * (sy - 1) + .025 * load;
      power = 1;
    }
    body.position.set(originX + visualX + x * dir * power, originY + y * power, body.position.z);
    body.rotation.z = rot * dir * power;
    body.scale.set(1 + (sx - 1) * power, 1 + (sy - 1) * power, 1);
    // A light recoil layer cannot overwrite the readable contact pose.
    if (actor.hitReactTimer > 0 && !timeline.contactFrame) body.position.x -= dir * .025;
    if (actor.isSpriteBody) actor.mat.rotation = body.rotation.z;
    return true;
  }
  if (actor.hitReactTimer > 0) {
    actor.animationState = 'hit';
    const strength = (actor.hitReactStrength || .5) * Math.min(1, actor.hitReactTimer / .16);
    body.position.set(originX + visualX - dir * .12 * strength, originY + .04 * strength, body.position.z);
    body.rotation.z = dir * .12 * strength;
    body.scale.set(1 + .13 * strength, 1 - .12 * strength, 1);
    if (actor.isSpriteBody) actor.mat.rotation = body.rotation.z;
    return true;
  }
  actor.hitReactStrength = 0;
  body.position.x += visualX;
  if (actor.isSpriteBody) actor.mat.rotation = body.rotation.z;
  return false;
}
