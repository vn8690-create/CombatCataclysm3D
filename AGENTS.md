# Combat Cataclysm: instructions for Codex

This is an EXISTING, PLAYABLE comedy lane-defense game written in vanilla ES modules and Three.js. Do not start over, replace it with a new sample, or claim mockups are implemented. Preserve existing character sprites and game progression.

## Read before changing code
- `CLAUDE.md` (the existing architecture and safety rules apply equally to Codex)
- `README.md`, `design/GAME_BIBLE.md`, `design/COMEDY_BIBLE.md`, `design/TECHNICAL_ARCHITECTURE.md`
- `src/scenes/BattleScene.js`, `src/entities/Unit.js`, `src/entities/Enemy.js`, `src/entities/Base.js`, `src/systems/CombatSystem.js`, `src/config/balance.js`
- `production/ANIMATION_PIPELINE.md`

## Sprint scope
The current priority is GitHub issue #26, Day 1 of a ten-day **playable PC-browser MVP** sprint. Make 2.5D contact combat actually work: player/enemy units meet, fan out in shallow lane depth, fight without crossing/stacking, and after defeating opponents resume marching to attack the opposing base. Keep base damage, win/lose and save flow working. Prioritize readable mechanics over visual rework. Implement narrow, tested, reviewable changes.

## Operating contract
1. Inspect the current branch, git status and project first. Make a dedicated feature branch; avoid committing to `main` or discarding user changes. If local working tree is dirty, preserve those changes and ask before potentially destructive operations.
2. Write a brief plan, then implement real code and tests. Do not stop after a plan or generate only concept images. No unattended paid API, hosted model, dependency changes or new external services.
3. Keep core combat decisions in simulation/entity systems, not presentation/VFX. Prefer deterministic slot assignment, limited Z lane offsets, collision safety against large `dt`, and explicit dash/flying/knockback behavior. Be careful with target-nearest fixes and avoid freezes when opposing units cross through previously.
4. Do not overwrite the Gym Uncle approved sprite, slow movement and V1 motion/VFX. Treat Blender/3D experiments as optional isolated prototypes until verified and approved, not a prerequisite for Day 1.
5. Add focused tests and run `npm run test:unit`; run `npm test` when Playwright exists. If unavailable or failing, report the actual failure; never claim tests passed without running them.
6. Verify at least 1v1 melee, 3v3 spread, ranged/backline, player and enemy base siege, victory/defeat, boss/dash/knockback regressions. Check UI/animation and browser if the environment permits. Keep historical save format compatible.
7. Open a PR linked to issue #26. Do not auto-merge gameplay changes until inspected/tested. In the final report explain what truly changed, test commands/results and unresolved limitations.

## Run
- `npm start` runs `server.mjs` at `http://127.0.0.1:8000` without a build step.
- `START_GAME.bat` launches it on Windows.
- Unit tests: `npm run test:unit`. Browser smoke: `npm test` (may need Playwright setup; see README).

## Definition of done for v1 release
A tester can launch the game, pick a stage, deploy units, fight with visible 2.5D positioning, destroy a base, receive rewards, upgrade/unlock, win campaign, close/reopen and find saved progress intact. This is the release gate, NOT a claim that every item is already implemented.
