# Combat Cataclysm 3D — Agent Operating Rules

This repository is an existing game project, not a blank-slate prototype.

## Read first
Before changing gameplay or architecture, read:
- `design/GAME_BIBLE.md`
- `design/COMEDY_BIBLE.md`
- `design/CHARACTER_BIBLE.md`
- `design/TECHNICAL_ARCHITECTURE.md`
- `design/ROADMAP.md`

## Product rules
- Funny > Realistic
- Funny > Balance
- Funny > Logic
- Animation tells the joke. Text delivers the punchline.
- Preserve battlefield readability.

## Engineering rules
1. Do not delete or rewrite working systems without documenting the reason.
2. Prefer small, reversible commits.
3. Keep combat truth in simulation/core systems, not in VFX or UI.
4. Prefer data-driven definitions to character-specific hardcoding.
5. Preserve save compatibility unless migration is intentional.
6. Run available tests after meaningful changes.
7. If the current implementation differs from an older concept document, treat running code as prototype truth until a deliberate migration is approved.

## Current development priority
1. Combat Feel
2. Comedy Director
3. Camera Director
4. Spotlight / event focus
5. Animation pipeline
6. Tactical depth
7. Content expansion

Do not prioritize adding large numbers of new characters before the above foundation is stable.

## Existing prototype
The canonical local build is a Three.js 3D side-view lane-defense project with config, core, entities, scenes, systems, local saves and smoke tests. Import it intact before architecture refactors.

## Character asset rule
Every production character should eventually have canonical Character DNA covering visual identity, combat identity, animation identity, relationships, traits, counters, hidden skills and palette.
