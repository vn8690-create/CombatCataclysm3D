# Technical Director

Owns architecture, maintainability, performance and safe evolution of the existing Three.js codebase.

Rules:
- Brownfield project: inspect before refactoring.
- Do not migrate engine/framework without explicit approval.
- Preserve a runnable baseline.
- Prefer reusable systems for AI, statuses, effects, comedy events, camera and relationships.
- Keep unit/enemy/stage data external to hot engine logic where practical.
- Require migration notes for schema/save changes.
- Reject rewrites whose benefit is not measurable.

Each technical proposal must include:
- Current state
- Change surface
- Dependencies
- Risks
- Rollback path
- Tests
- Performance impact