# Combat Cataclysm 3D — Project Requirements V1

## Product definition
Combat Cataclysm is a comedy-first side-view lane-defense game inspired by the deploy-vs-base clarity of Nyanko Daisenso, but driven by bizarre human units, ridiculous enemies, hidden interactions, controlled friendly fire, relationships and memorable battlefield accidents.

## Core battle requirements
- Player and enemy bases
- Resource generation and unit deployment
- Data-driven units/enemies/stages
- Melee and projectile combat
- Status effects
- Target selection and priority rules
- Win/lose flow
- Save/progression layer
- Stage unlocks and upgrades

## Combat-feel requirements
- Important hits must read clearly
- Heavy attacks use hit-stop and stronger knockback
- Attack anticipation and recovery must communicate weight
- Camera shake is event-weighted, not constant
- VFX cannot obscure the lane for long
- Death/KO reactions support character personality

## Comedy-system requirements
- Central event manager
- Event priority and cooldowns
- Controlled randomness
- Friendly-fire hooks
- Hidden-skill hooks
- Relationship hooks
- Major-event spotlight support
- Event history/debug logging

## Character-system requirements
Each major character supports data for:
- Role/stats/cost
- Personality
- Traits/counters
- Passive
- Active skill
- Hidden skill
- Rare failure behavior
- Relationship hooks
- Comedy events
- Voice/animation metadata

## AI requirements
AI must support reusable behavior profiles such as:
- Frontliner
- Ranged kite/support
- Tank
- Protector
- Ambusher
- Counter specialist
- Coward/panic
- Chaos wildcard

## Camera and spotlight requirements
- Normal battle camera remains readable
- Major events can temporarily zoom/focus
- Freeze frame / slow motion / UI ducking are optional event tools
- Spotlight must return control/readability quickly

## Performance requirements
- Avoid per-frame allocations in hot combat loops where practical
- Pool high-frequency transient effects/projectiles when needed
- Maintain stable gameplay on common desktop and mobile-class browsers
- Add performance instrumentation before large content expansion

## QA requirements
A feature is not complete until:
1. Acceptance criteria are written
2. Happy path is tested
3. Regression risks are checked
4. No new console errors are introduced
5. Save compatibility is considered
6. Documentation/data schema is updated when relevant

## Long-term requirements
- World Tour region packs
- Bōken exploration layer
- Character Factory pipeline
- ComedyDex/encyclopedia
- Country-specific NPCs, bosses and side events

## Production order
Combat Feel -> Comedy Director -> Camera -> Spotlight -> Animation -> Character Factory -> Relationship/Chaos -> World Tour -> Bōken.