# Extend an existing character

Keep the existing ID and gameplay/comedy/relationship DNA. Edit only the visual
block in `src/config/canonicalCharacters.js`; `CharacterFactory` converts it to
the runtime config consumed by `UNITS`, the real Unit, deployment and roster.
Do not duplicate stats in a separate art config.

```js
visual: {
  icon: '📊', // also a visible portrait error fallback
  portrait: 'assets/characters/manager_portrait.svg',
  battleSprite: 'assets/characters/manager_battle.svg',
  battleSpriteWidth: 1.5,
  battleSpriteHeight: 2.1,
  battleBarY: 2.25, // above the full image
  animationPreset: 'office_jab',
  artStatus: 'provisional',
  projectileOrigin: { x: .4, y: 1.2 }, // prop offset from ground anchor
  color: '#4e78ff', accent: '#f7f7ff', modelType: 'box', scale: 1,
  silhouette: 'Compact office silhouette with clipboard/tablet.',
  animationPersonality: 'Tiny authoritative gestures and frantic pointing.'
}
```

Use original self-contained SVG with a 512×512 viewBox (or transparent PNG).
Keep feet near the bottom, outline/props inside the edges, a transparent battle
background, thick outlines and a face/prop readable at roughly 50–100 screen
pixels. Portraits must reuse the same identity and palette. New art remains
`provisional` until reviewed. Gym Uncle's approved SVGs are hash locked in tests.
Current source SVGs use paths/gradients only and need no asset build tool.

Optional fields preserve old procedural characters. Missing `battleSprite`
uses the existing procedural body. A configured sprite starts with that visible
body and switches only after successful decoding; errors keep the fallback.
Portraits similarly keep their icon if decoding fails. The factory rejects
non-local paths, malformed dimensions, bars below the sprite, unknown presets,
invalid projectile origins and art status.

`CharacterAssets` caches the loaded texture for each URL. A Unit creates its own
SpriteMaterial and owns its fallback geometry, bar and shadow. Destroy/death
releases the load subscription and local resources once; it does not dispose
shared textures. Failed records are evicted for a future deployment to retry.
Successful textures live for the application session. Never mutate a shared
texture to animate one actor. Roster previews use the same Unit and restore the
shared renderer viewport/scissor after drawing into their visible panel.

`CombatPose` consumes the existing `AttackTimeline`: `office_jab` gives a compact
directive lean, `drunk_sway` a loose loaded mug lunge, and `grocery_throw` a short
throwing lean. Walking/idle are small preset sways. Rendering adds a bounded
depth offset to the three new silhouettes, their bars, shadows and projectile
origins; formation anchors/collision/range stay unchanged. Gym keeps its exact
Day 2 pose branch. Damage and projectile release are never driven by an image
load, CSS callback or animation timer.

Run `npm run test:unit`, then `npm test`, then `node tests/capture-day3.mjs`.
Review the live game at 1440×900 and 960×540, not only the source SVG. Test death
during loading, broken paths, repeated roster/battle transitions and duplicates.
Review projectile arrival independently from release. A single image cannot
move an arm or prop independently; add atlas metadata only when real approved
frame files exist. No current multi-frame or rigged animation is implied.
