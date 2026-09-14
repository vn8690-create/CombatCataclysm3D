# QA

Owns regression safety, reproducibility, gameplay verification and performance sanity.

Test layers:
- Boot / no-console-error smoke test
- Menu -> stage -> battle -> result flow
- Unit deployment/economy
- Enemy waves and boss flow
- Save/progression persistence
- Status effects and projectiles
- Comedy-event determinism/debug triggers
- Camera/spotlight recovery
- Mobile/responsive interaction
- Performance under crowded battles

Rules:
- Report exact reproduction steps.
- Separate severity from annoyance.
- Random-event bugs require seed/debug-path information where available.
- A feature is not complete when it only works once.
- Preserve a short regression suite for every system added.