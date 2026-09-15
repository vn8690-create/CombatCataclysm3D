# Combat Cataclysm Character Animation Pipeline

## Goal

Keep the current Three.js/no-build game fast while letting AI-created character art become readable battlefield actors.

## V1 used by Gym Uncle

1. Character art is stored as a transparent battle sprite.
2. Runtime motion is state driven: idle, walk, attack and hit each use distinct timing, squash/stretch, lean and position curves.
3. Combat effects are emitted separately from the character sprite: foot dust, impact particles, shockwave and short comic text.
4. Character DNA owns gameplay speed. Animation code does not change damage or targeting rules.

This gives immediate motion from one approved character image and avoids waiting for a full rigged 3D production pipeline.

## GitHub projects evaluated

- ocio/TexturePacker-Animator-Threejs: useful reference for texture-atlas/sprite animation in Three.js. Future multi-frame character sheets should follow this atlas/state idea.
- theloneplant/blender-spritesheets: use later when a character has a rigged/animated Blender model and we want to render animations into 2D sheets.
- sjefvanleeuwen/sprite-sheet-creator: useful later for GLB/FBX characters that already contain animation clips.
- facebookresearch/AnimatedDrawings: useful as an experimental reference for turning a single human drawing into rigged motion, but the upstream project is archived and is not a required runtime dependency.
- Alchemist0823/three.quarks: useful reference for a richer Three.js particle system. The prototype keeps a native lightweight emitter for now so it does not require a bundler/dependency migration.

## Planned V2

When approved frame art exists, add a generic SpriteAtlasAnimator with JSON metadata:

```json
{
  "idle": {"start": 0, "count": 4, "fps": 5, "loop": true},
  "walk": {"start": 4, "count": 6, "fps": 8, "loop": true},
  "attack": {"start": 10, "count": 7, "fps": 14, "loop": false},
  "hit": {"start": 17, "count": 3, "fps": 12, "loop": false},
  "death": {"start": 20, "count": 5, "fps": 8, "loop": false}
}
```

The Unit API should stay the same so gameplay systems do not care whether a character uses one sprite, an atlas, or later a skeletal rig.
