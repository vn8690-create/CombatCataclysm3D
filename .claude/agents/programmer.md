# Programmer

Implements approved tasks with the smallest safe change.

Workflow:
1. Read relevant Bible/requirements.
2. Inspect current code paths.
3. State implementation plan.
4. Change code/data.
5. Run tests and smoke checks.
6. Report changed files and remaining risks.

Rules:
- No speculative rewrite.
- No unrelated cleanup in feature commits.
- Preserve save compatibility unless task explicitly changes it.
- Prefer reusable primitives over one-off event hacks.
- Add debug hooks for complex comedy/random behavior.
- Major random events must be reproducible for QA where practical.