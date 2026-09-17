# Combat Cataclysm: instructions for Codex

This is an EXISTING, PLAYABLE comedy lane-defense game written in vanilla ES modules and Three.js. Do not start over, replace it with a new sample, or claim mockups are implemented. Preserve existing character sprites and game progression.

## Read before changing code
- `CLAUDE.md` (the existing architecture and safety rules apply equally to Codex)
- `README.md`, `design/GAME_BIBLE.md`, `design/COMEDY_BIBLE.md`, `design/TECHNICAL_ARCHITECTURE.md`
- `src/scenes/BattleScene.js`, `src/entities/Unit.js`, `src/entities/Enemy.js`, `src/entities/Base.js`, `src/systems/CombatSystem.js`, `src/systems/FormationSystem.js`, `src/systems/CombatFeelSystem.js`, `src/systems/VFXSystem.js`
- `production/ANIMATION_PIPELINE.md`, `docs/day1/README.md`

## Sprint scope: Day 2
The current priority is GitHub issue #29, Day 2 of the ten-day **playable PC-browser MVP** sprint. Day 1 contact combat, 2.5D fan-out, base siege and tests are already merged via PR #28. Do NOT repeat Day 1 as a new project. Implement actual runtime combat feel: anticipation -> timed contact/actual damage and impact FX -> recovery; reliable interruption on death/stun/pause; distinct legible Gym Uncle motion with the existing approved single battle sprite; restrained VFX/readability for 3v3 and crowded combat. Preserve all Day 1 behaviors and every existing save and stage. Read the issue for exact acceptance criteria and test evidence.

Important asset truth: Gym Uncle currently uses one approved static battle image with code-driven pose curves and VFX. That is NOT a true multi-frame sprite sheet or rigged 3D. Never claim frame art, GLB/rigging or browser test results that do not exist. Multi-frame production is a separate approved-art task. Existing CombatFeelSystem and VFXSystem already contain hit-stop, shake, dust, sparks, shockwaves and comic text; improve timing, quality and effect budgets rather than presenting old behavior as new.

## Operating contract
1. Inspect branch and `git status` first. Branch from updated `main` for the issue; never discard user edits or push directly to `main`.
2. Write a brief plan, then implement real code and tests. Do not stop after a plan or generate concept images. No paid API, hosted service, dependency changes or Blender/3D experiments needed for Day 2.
3. Keep combat truth in simulation/entity systems. Coordinate timed contact and visuals without double hits, delayed damage after death, phantom pause strikes, animation overwrites or changed attack cadence. Damage, projectile release, base hits, camera hit-stop and VFX must align with real impact.
4. Preserve Gym Uncle approved sprite and speed 0.62, earlier one-image animation as fallback, formation/collision/boss/dash/knockback, economy/stages/rewards/save compatibility. No giant renderer rewrite.
5. Test actual behavior: windup -> single hit -> recovery; interrupted attack; crossed target; large dt; ranged release and projectile impact; opposing base siege; scene exit cleanup; 3v3 effect spam; all Day 1 regressions. Run `npm run test:unit` and `npm test` separately and report exact actual outcomes or blockers. Play/browser screenshots or traces when possible.
6. Make a small PR linked to issue #29, DO NOT auto-merge gameplay changes. Report changed files, what is genuinely new, tests, screenshots/traces and remaining visual limitations.

## Run
- `npm start` runs `server.mjs` at `http://127.0.0.1:8000` without a build step.
- `START_GAME.bat` launches it on Windows.
- Unit tests: `npm run test:unit`. Browser smoke: `npm test` (may need Playwright setup; see README).

## Definition of done for v1 release
A tester can launch the game, pick a stage, deploy units, fight with visible 2.5D positioning, destroy a base, receive rewards, upgrade/unlock, win campaign, close/reopen and find saved progress intact. This is the release gate, NOT a claim that every item is already implemented.
