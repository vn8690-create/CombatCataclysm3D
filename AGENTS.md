# Combat Cataclysm: instructions for Codex

This is an EXISTING, PLAYABLE comedy lane-defense game using vanilla ES modules and Three.js. Never restart the game, replace it with a sample, or claim a mockup is implemented. Preserve the repository's approved art, gameplay, save and progression.

## Read before changing code
- `CLAUDE.md`, `README.md`, `design/GAME_BIBLE.md`, `design/COMEDY_BIBLE.md`, `design/TECHNICAL_ARCHITECTURE.md`
- `src/systems/CharacterFactory.js`, `src/config/canonicalCharacters.js`, `src/config/units.js`, `src/entities/Unit.js`, `src/systems/CombatPose.js`, `src/systems/AttackTimeline.js`, `src/scenes/BattleScene.js`, roster and deployment UI
- `production/ANIMATION_PIPELINE.md`, `docs/day1/README.md`, `docs/day2/README.md`; check the actual files under `assets/characters/`

## Sprint scope: Day 3, Issue #32
Day 1 2.5D combat (PR #28) and Day 2 timed attacks/VFX (PR #31) are merged. Current task: implement reusable character presentation/asset validation using the EXISTING `CharacterFactory` and canonical DNA, then make four actual characters recognizable and playable: preserve approved Gym Uncle; produce ORIGINAL distinct battlefield SVG art and portraits for Manager, Drunk Uncle and Supermarket Auntie, integrate them into existing roster/spawn/animation, and prove browser visibility. `CharacterFactory`, six canonical entries and all six unit configs already exist. Only Gym Uncle currently has battle/portrait assets. Do not rename these as brand-new systems or claim unimplemented skills work. All new art is provisional until user visually approves it.

Read full Issue #32 for detailed acceptance criteria, test evidence and narrow priorities. Do not expand to new stages, extra characters, shop, full 3D/Blender, a real sprite atlas without approved frames, or new paid dependencies. The approved Gym asset must not change. Current single-image animation uses code-driven motion; never call it multi-frame or rigged 3D.

## Operating contract
1. Inspect current branch and `git status`, preserve uncommitted work. Start from up-to-date `main` on a separate `codex/day3-character-pipeline` branch or unique equivalent. Do not push gameplay changes to main or auto-merge.
2. Implement real runtime code, actual original art files where feasible, and deterministic tests. Do not stop at plans or SVG-only unintegrated mockups. Do not use unattended paid APIs, hosted models or new npm dependencies.
3. Extend `CharacterFactory` and DNA consistently, ensure missing/broken sprite URLs lead to visible fallback rather than invisible actors. Keep local asset paths correct, no broken portrait references, and avoid disposing shared textures on individual death or scene exit.
4. Keep existing `AttackTimeline`/`CombatPose` contact synchronization, base hits, formation, sprites/HP bars/ground positions, Gym's exact approved art and movement speed 0.62, current stats/DPS, economy, stages, saves and progression intact. Give the other three lightweight visually distinct code-driven motion; never claim fully articulated animation.
5. Run `npm run test:unit` and `npm test` independently, check actual browser screenshots at 1440x900 and 960x540 for all four deployed actors and roster portraits, and test missing assets, 3v3 mixed roles, attack/recovery, both base sieges, shared texture lifetime and scene cleanup. Report exact results or blockers, no fabricated pass or screenshots.
6. Open a PR linked to Issue #32 without auto-merging. Include `docs/day3/README.md` with accurate before/after, real image evidence, what is implemented vs proposed/unapproved art, limitations, and the minimal Day 4 handoff.

## Run
- `npm start` runs `server.mjs` at `http://127.0.0.1:8000` with no build step; `START_GAME.bat` launches on Windows.
- Unit tests: `npm run test:unit`. Browser smoke: `npm test` (may require Playwright Chromium; see README).

## Definition of done for v1 release
Tester launches game, selects a stage, deploys recognizable actors, fights with readable 2.5D combat, destroys a base, receives rewards, upgrades/unlocks, completes campaign, reopens and finds saved progress. This is a release gate, not a claim all items are already finished.
