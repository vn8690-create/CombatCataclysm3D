# Skill: Combat Feel Pass

## Goal
Make attacks readable, satisfying and funny without changing the game's strategic identity.

## Audit
Check:
- anticipation
- contact readability
- hit-stop
- knockback
- squash/stretch
- recoil/recovery
- projectile readability
- death/KO reaction
- camera shake hierarchy
- VFX clutter
- audio hook points

## Implementation order
1. Add reusable impact tiers: light / medium / heavy / legendary.
2. Route melee/projectile impacts through the same feedback interface.
3. Add bounded hit-stop.
4. Add event-weighted camera shake.
5. Improve knockback and KO reactions.
6. Add debug toggles/metrics.
7. Test crowded battle readability.

## Acceptance criteria
- Heavy impacts are visibly distinct from normal attacks.
- Normal attacks do not constantly shake the camera.
- Hit-stop never permanently freezes simulation.
- Feedback works for both player and enemy attacks.
- FX do not hide important targets.
- No new console errors.
- Battle flow remains playable at normal speed.