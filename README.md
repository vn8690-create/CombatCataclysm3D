# Combat Cataclysm 3D

A comedy-first 3D side-view lane-defense game built with Three.js.

## Core philosophy

- Funny > Realistic
- Funny > Balance
- Funny > Logic
- Animation tells the joke. Text delivers the punchline.

This repository is the canonical source for the playable prototype and the Studio design system.

## Fastest Windows workflow

Normal use should require almost no terminal work.

- `START_GAME.bat` starts the local server if needed and opens the game.
- `UPDATE_AND_PLAY.bat` updates `main` when possible, runs the lightweight Combat Feel check, starts the server, and opens the game.
- `RUN_TESTS.bat` runs the Combat Feel check and the browser smoke test.
- `START_STUDIO.bat` opens the project for development, launches Claude Code when available, starts the local server, and opens the game.
- `STOP_GAME.bat` stops the local Node server used by the project.

The game runs at:

```text
http://127.0.0.1:8000
```

## Manual start

```bash
npm start
```

There is no build step. `server.mjs` serves the project directly.

## Tests

Lightweight Combat Feel checks:

```bash
npm run test:feel
```

Browser smoke test:

```bash
npm test
```

The browser smoke test requires Playwright. If it is not installed locally:

```bash
npm i -D playwright
npx playwright install chromium
npm test
```

## Current playable systems

Day 1 combat now uses persistent shallow-depth formation slots, grounded contact
checks and ally spacing. Frontline, ranged and support units keep their existing
attack ranges (large bodies use surface contact), regroup after kills and siege
either base. Flying units and active dashes intentionally bypass ground contact;
dash hits are swept, and knockback still retreats. Gym Uncle's sprite, V1 motion,
VFX and slow speed are unchanged. See the [actual before/after captures and
verification notes](docs/day1/README.md).

`npm run test:unit` includes the dependency-free formation regressions. `npm test`
also exercises actual entities, projectiles, both base results and Bōken defeat
in Chromium. With an existing compatible Chromium installation, optionally set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path; otherwise install the
browser with `npx playwright install chromium`. No runtime dependencies were added.

The prototype includes menu, stage selection, battle flow, win/lose states, upgrades, local save data, units, enemies, bosses, economy, waves, combat and VFX.

Combat Feel now adds reusable impact tiers, hit-stop, restrained camera shake, projectile/melee impact routing, attack pulses, squash/stretch hit reactions and stronger boss-impact feedback.

## Studio roadmap

1. Preserve the current playable build
2. Import the local prototype source
3. Add project bibles and architecture rules
4. Combat Feel pass
5. Comedy Director
6. Camera and spotlight systems
7. Animation and character asset pipeline
8. Character DNA factory
9. Relationships, friendly fire and controlled chaos
10. World Tour expansion
11. Bōken exploration layer

## Safety rule for coding agents

Do not rewrite working systems without first documenting why. Prefer additive, reversible changes with tests and small commits.
