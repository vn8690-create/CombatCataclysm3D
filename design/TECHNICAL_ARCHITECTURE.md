# Combat Cataclysm 3D — Technical Architecture

## Current prototype architecture
The existing local prototype is a Three.js 3D side-view lane-defense game with separated config, core, entities, scenes, systems and tests.

Expected source groups from the validated local build:
- `src/config/` balance, units, enemies, stages, upgrades
- `src/core/` Game, SaveSystem
- `src/entities/` Unit, Enemy, Base
- `src/scenes/` menu, stage select, battle, result, upgrade
- `src/systems/` CombatSystem, EconomySystem, WaveManager, VFXSystem, DebugSystem
- `tests/` smoke test

## Architecture rules
1. Preserve the playable build before refactoring.
2. Prefer data-driven character/enemy definitions over hardcoded branching.
3. Add systems behind clear interfaces rather than enlarging `BattleScene` indefinitely.
4. Keep simulation rules deterministic where practical.
5. Visual effects and comedy presentation must not own core combat truth.
6. Save-data changes require explicit migration/default handling.
7. Every meaningful engine change should be reversible by commit.
8. New features should include smoke/regression coverage where practical.

## Planned systems
### CombatFeelSystem
Hit stop, knockback, squash/stretch hooks, readable impact feedback and reaction timing.

### ComedyDirector
Coordinates high-priority comedy beats, spotlight, freeze frames, UI suppression, slow motion and camera emphasis.

### CameraDirector
Owns framing, zoom, shake and focus targets without changing combat simulation.

### CharacterDefinition / Character DNA
Canonical data for combat role, traits, relationships, visuals, animation identity and hidden events.

### RelationshipSystem
Friend/rival/fear/hate/crush/idol hooks that may produce rare battlefield interactions.

### Trait/Counter layer
Traits such as animal, underground, armored, support, elite, boss, ranged and slippery. Counters should remain visible and teachable.

## Dependency direction
Config/data -> simulation/core systems -> entities/scenes -> presentation/VFX/directors.

Presentation may observe simulation and request timing emphasis, but must not become the only place combat rules exist.

## Performance
- Pool transient VFX/projectiles where volume warrants it.
- Avoid per-frame allocations in hot battle loops where possible.
- Prefer event-driven UI updates over rebuilding DOM every frame.
- Profile before large optimization passes.
