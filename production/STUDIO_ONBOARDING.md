# Combat Cataclysm 3D — Studio Onboarding

## Purpose
Use the Claude-Code-Game-Studios workflow as the production brain around the existing Combat Cataclysm codebase. Do not replace the current game architecture blindly. This is a brownfield project: preserve working code, reverse-document what exists, identify gaps, then improve in controlled sprints.

## Required workflow for this project
1. `/start` and choose the existing-project path.
2. `/project-stage-detect` to audit the current state.
3. `/adopt` to build a brownfield migration plan without overwriting existing work.
4. `/reverse-document` for combat, economy, waves, units, enemies, VFX, UI and progression where code exists but design docs are incomplete.
5. `/map-systems` to create a dependency map for all game systems.
6. `/review-all-gdds` to find contradictions and missing decisions.
7. `/create-architecture` plus `/architecture-review` for the technical layer.
8. `/qa-plan` and `/smoke-check` to formalize testing.
9. `/sprint-plan new` only after the above audit is complete.
10. Use `/gate-check` before moving to the next production phase.

## Non-negotiable game identity
Combat Cataclysm is a comedy-first 3D side-view lane-defense game with readable deploy-vs-base combat inspired by the rhythm of Nyanko Daisenso, but with absurd human units, bizarre enemies, hidden interactions, accidental friendly fire and battlefield stories that can go wrong in funny ways.

Core rules:
- Funny > Realistic
- Funny > Balance
- Funny > Logic
- Chaos must remain readable
- Friendly fire is controlled and telegraphed, not constant punishment
- Units have personality, flaws, relationships and rare behaviors
- Animation should carry most jokes; text should be used sparingly
- Main battle mode remains the mechanical backbone
- Long-term expansion includes World Tour and Boken-style exploration across countries and regions

## Production priority
Do not expand roster or countries before the core battle is fun to watch and play.

Priority order:
1. Combat Feel
2. Comedy Director
3. Camera
4. Spotlight / readability
5. Animation
6. Character Factory / Character DNA
7. Relationship and chaos systems
8. World Tour content
9. Boken exploration layer

## Definition of professional
A feature is not considered complete just because it works once. It should have:
- Written requirement
- Clear owner/system boundary
- Acceptance criteria
- Failure states
- Data-driven configuration where appropriate
- Test evidence
- Performance considerations
- Regression coverage for critical paths
- Documentation updated after implementation

## Agent rule
Any coding agent joining this project must first read:
- `design/GAME_BIBLE.md`
- `design/COMEDY_BIBLE.md`
- `design/CHARACTER_BIBLE.md`
- `design/TECHNICAL_ARCHITECTURE.md`
- `design/ROADMAP.md`
- `CLAUDE.md`

No agent may redesign the game from scratch without explicit approval.
