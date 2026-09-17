# Combat Cataclysm: 10-day playable release plan

**Plan created:** 2026-09-17 (JST). **Kickoff:** evening 2026-09-17. **Execution days:** 2026-09-18 through 2026-09-27. **Deliverable:** playable, shareable **Web V1**, plus source ZIP and release tag, NOT the entirety of the long-term World Tour/Bōken vision. Date is a target, not a guarantee.

## 0. Operating rules

- Preserve the working Three.js ES-module prototype. Read `design/GAME_BIBLE.md`, `design/PROJECT_REQUIREMENTS_V1.md`, `production/STUDIO_ONBOARDING.md`, this plan, source code and tests first.
- Comedy-first, original characters/visuals/audio, Battle Cats-inspired **generic mechanics** only. No copying another game's assets, names, UI or level data.
- One owner for integration. Codex may research and implement small bounded tickets, but humans approve scope, art and play feel. Never let multiple agents concurrently rewrite `Game.js`, `BattleScene.js` or save code without coordination.
- Branch per ticket, small PR, review, tests, playable preview, merge. Keep `main` playable; tag current baseline at kickoff; back up saves before migrating.
- Every ticket contains: goal, in-scope/out-of-scope, touched files, acceptance tests, regression risks, evidence and fallback. No claims of passing tests unless run.
- Daily end: record completed/failed tests, known bugs, screenshots, remaining scope and next day's top two priorities in `worklog.md` or release log. Stop feature expansion after Day 7.

## 1. Repo-grounded baseline and known risk

- Current code already has 10 campaign stages (`src/config/stages.js`), units (`src/config/units.js`), persistent upgrades (`src/config/upgrades.js`: attack/HP/economy/deploy/starting money/base HP/burn/stun), localStorage save (`src/core/SaveSystem.js`), Bōken, roster, Combat Feel, Comedy Director, Gym Uncle battle sprite and first motion/FX pass.
- **Not yet equivalent to the desired release:** genuine 2.5D front/back combat slots, reliable collision/fan-out, explicit within-battle worker/income upgrade, Player XP/level and unit unlock gating, QA-certified stage 5 balance, final release packaging/deployment, complete end-to-end tests.
- `Game.finishBattle()` currently checks victory before resolving Bōken, but the previously reported defeat/clear scenario must receive reproducible tests covering route stages, retry and save/reload. Never assume fixed from code inspection alone.
- The Gym Uncle Blender/GLB pipeline is preparatory. A real, rigged 3D asset has not been certified and is NOT a dependency for V1; retain the approved visible 2D sprite fallback.

## 2. Locked Web V1 scope

**Must ship:**
1. Stable game boot, menu, campaign 10 stages, victory/defeat/retry, base-versus-base win condition, loading/error recovery.
2. 2.5D battle on existing Three.js: x=forward lane, z=small pseudo-depth spread, y=vertical only. Camera stays readable. Units stop and fight on contact, do not walk through opponents, regroup after fights, and attack the opposing base when unblocked. Same rules for enemies. Tanks/frontline, ranged/backline, support rear; bounded position slots and soft separation, no full pathfinding.
3. In-battle economy: passive income, upgrade income generation and money cap with clear pricing, feedback and capped levels. Preserve persistent economy, starting-money, unit HP/ATK, base HP and cooldown upgrades; avoid duplicate permanent upgrade systems.
4. Player XP/level, at least three starter units, level-unlocked roster units, level-gated upgrade ceilings and Bōken recruits. Locked cards disclose conditions. A unit cannot be deployed while locked even via programmatic/UI shortcuts. Retroactive unlock/migration for existing saves.
5. Bōken lite: one complete playable Japan introductory route, Vietnam route only if existing content survives QA; battle or boss defeat NEVER clears a node. Rewards granted once; persistence after refresh.
6. Character identity: Gym Uncle visible and with readable slow movement/impact; at least a small set of distinct representative comedy interactions already supported by code. Other units may use polished placeholder geometry/sprites; no requirement for fully rigged 3D roster.
7. Tested campaign difficulty curve, especially Stage 5, without forced grinding or dead-end unlock cycles; at least one viable strategy with zero paid boosts; documented tuning.
8. Performance and interface: desktop Chrome and one mobile-class viewport; responsive controls, basic mute option if audio is added, no image/texture loading invisibility, no blocking console errors.
9. Public static deployment URL compatible with repo subpath OR another selected static host; source ZIP, clear README and tagged `v1.0.0-playable`. Check relative import/asset URLs; localhost-only root paths break GitHub Pages subpaths.

**Defer after V1:** fully modeled/rigged character roster, all countries, giant explorable maps, PvP, online account, payments, elaborate cinematic video, dozens of new units, complex AI navigation, app store packaging. No feature creep.

## 3. Day-by-day execution and verifiable exits

| Day (JST) | Focus | Exit gate |
| --- | --- | --- |
| Kickoff, Sep 17 evening | `git pull`, inspect scripts/tests, backup save, baseline tag, run `npm run test:unit` and browser smoke (`npm test` after installing Playwright), record failures/screenshots. Split P0/P1/P2. Codex gets one ticket at a time. | Known baseline and reproducible issue ledger, no speculative 'all green'. |
| Day 1, Sep 18 | P0 stabilisation: Bōken victory/defeat/retry and reward-once tests; visibility/fallback for Gym and texture loading; collision reproduction; tests and save snapshot. | Failed battle cannot progress route or grant victory rewards, refreshed save is coherent. |
| Day 2, Sep 19 | 2.5D combat foundation: lane x, world z slots, friendly/enemy separation and capped combat anchors; preserve base coordinates. | Multiple units form readable clusters, no clipping or targetless bypass at base. |
| Day 3, Sep 20 | Engagement FSM and base attacks: acquire/block/engage/attack/recover/march; melee/ranged/support distance; windup damage and death cleanup; enemy symmetry. | **Combat vertical slice**: both sides fight, disengage, resume and destroy bases reliably. Feature freeze contingency if this fails. |
| Day 4, Sep 21 | Economy and upgrades: in-battle income button with escalating cost/cap; sync HUD; permanent base HP, starting money, income, HP/ATK remain functional; exploit checks. | New save can strategically upgrade money, field troops and improve base without negative/duplicated cash. |
| Day 5, Sep 22 | XP/unlocks and migration: level thresholds, starter loadout, roster locks, unit deployment gate, stage/Bōken recruit conditions; migrate existing save version safely. | New and old saves both playable; level-gated unit cannot bypass lock; no impossible unlock loop. |
| Day 6, Sep 23 | Campaign/Bōken end-to-end, enemy/boss waves, Stage 5 balance, stage rewards once, retry, reset. | **Full-loop alpha**: stage 1 → level up → upgrade → stage 5 → stage 10 → results; Bōken defeat remains blocked. |
| Day 7, Sep 24 | Art/comedy polish: consistent Gym sprite/motion, selective effects, 2-3 distinctive safe comedy events, HUD readability, camera/hit-stop budgets. No new major systems after EOD. | All actions legible; FX never hides units or attacks; content freeze. |
| Day 8, Sep 25 | QA/optimization: deterministic Node tests, Playwright full loops, save migration and refresh, 30-minute stress, desktop/mobile viewport, memory/asset disposal, performance profiling. | Zero P0/P1 blocker on tested configurations, no uncaught console errors; document measured FPS rather than guarantee 60. |
| Day 9, Sep 26 | Release candidate: fix QA regressions only, browser hosting path, release build/package, licenses/assets check, clean install test, readme/how-to-play, publish private/test URL. | Fresh browser/machine can launch URL and complete stage 1/5 and reload save. |
| Day 10, Sep 27 | Final acceptance: user playtest, fix launch/progression blockers, release tag, public URL, ZIP, patch notes, known limitations, rollback reference. | `v1.0.0-playable` link + ZIP + tagged commit + evidence of actual smoke testing. Otherwise label RC, never misrepresent as finished. |

## 4. Acceptance matrix (must run, not just code review)

- Boot: desktop and mobile viewport, no broken asset, black/white screen, uncaught error or invisible Gym.
- Combat: 1v1, 10v10, same-position spawn, enemy at player base, melee vs ranged, stun/knockback/death, target dies mid-windup, enemies reaching house; both bases can be attacked and victory/defeat fire once.
- Economy: cap, insufficient funds, rapid clicking, income upgrade near cap, all permanent upgrade categories, reset and reload.
- Unlocks: new save starter roster, threshold exact boundary, Bōken recruit, locked deployment rejection, already-progressed save migration and no loss of progress.
- Route: defeat/retry/victory, quit mid-battle, reward granted once, boss defeats, browser refresh. Campaign stage clears and route clears must be separate events.
- Stages: scripted or manual play-through of 1, 4, 5, 7, 10 and one complete campaign, including upgrades where intended. Log time-to-first-enemy, money curve, base health and success/fail reasons; do not claim 'balanced' from one anecdote.
- Release: deployment subdirectory paths, fresh profile localStorage, `npm run test:unit` and `npm test`, HTTPS asset fetch, readme local start and public URL, ZIP startup script, performance measurements on stated hardware.

## 5. Definition of done and stop rules

- **P0:** cannot launch, units invisible, broken combat or win/lose, save corruption, defeat clears level. Must fix before shipping.
- **P1:** required upgrade/unlock missing, Stage 5 impossible under intended play, reward exploit, serious UI blockage or major performance collapse. Fix before shipping.
- **P2:** minor FX, optional model quality, cosmetic text. Record for post-release.
- If Day 3 combat gate fails, cut optional z-depth sophistication to fixed two-row slots; preserve correct base combat first.
- If Day 6 full loop fails, cut optional Vietnam, 3D model and extra comedy events, NOT correctness/save/Stage 5.
- If Day 8 has P0/P1, do not publish 'finished'; release a clearly labeled test/RC build and shift final date transparently.
- Final scope is a polished small complete game, not every idea in `WORLD_BIBLE` / `STORY_BOKEN_BIBLE`.

## 6. Master Codex brief (paste once at kickoff)

> You are the technical lead delivering Combat Cataclysm Web V1 in 10 execution days. Work inside the EXISTING repository, not a rewrite. Read `design/GAME_BIBLE.md`, `design/PROJECT_REQUIREMENTS_V1.md`, `production/STUDIO_ONBOARDING.md`, and `production/TEN_DAY_PLAYABLE_RELEASE_PLAN.md`, then audit the actual repo, git status and tests. Preserve working systems and assets, no copyrighted Battle Cats content. Tonight do only kickoff: record baseline, reproduce highest-risk bugs and produce a ranked P0/P1/P2 ticket list, with relevant file paths, acceptance tests and branch strategy. Do not make claims of running a test unless executed. Work on one bounded ticket at a time; each must end with files changed, tests actually run/results, manual QA steps, regression risks, PR and next-ticket recommendation. Implement 2.5D using x forward/z depth/y vertical, robust engage/base attack, upgrade and level unlocking, campaign/Bōken save correctness, then release QA according to daily gates. No feature creep or mandatory 3D asset generation. Do not merge/publish before review and test evidence. If limits block execution, leave a truthful checkpoint and next exact command; never silently claim completion.

**First Codex task after audit:** reproducible Bōken defeat/retry/save progression regression, then 2.5D contact/fan-out vertical slice. Do not ask Codex to rewrite the entire project in a single prompt.
