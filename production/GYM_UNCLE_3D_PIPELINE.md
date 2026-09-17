# Gym Uncle: image -> GLB -> Blender animation -> Combat Cataclysm

## Status
This is a preparation pipeline, **not** a claim that a rigged model has been generated or integrated. The existing 2D Gym Uncle sprite stays the shipping fallback until a visually verified GLB exists.

## Reference and expected deliverable
- Existing visual references: `assets/characters/gym_uncle_battle.svg` and `assets/characters/gym_uncle_portrait.svg`.
- If using the linked to3D plugin: feed it the full-body character reference in ChatGPT, inspect geometry, export `.glb`/`.gltf`, and save a self-contained `.glb` to `assets/characters/3d/gym_uncle.glb` in your local repository. Simple image-to-3D output is **not** necessarily rigged or animated.
- Avoid bundling non-owned third-party models or model-service API keys in the repository.

## Windows: one-time Blender MCP registration
1. Install Blender (GUI), Codex CLI, and `uv` if not already installed. Install uv from its official source; restart PowerShell so `uvx` resolves.
2. From repo root run `powershell -ExecutionPolicy Bypass -File .\tools\SETUP_BLENDER_MCP.ps1` after reviewing the script.
3. Launch Blender; enable **Interface: MCP for Blender** in Edit > Preferences > Add-ons. In a 3D viewport press `N`, select MCP for Blender and start its local server. Restart Codex; check `codex mcp list` reports blender.
4. Blender MCP can execute Python; do not expose its unauthenticated listener beyond localhost. Work on a separate branch and a backup `.blend` file. Do not grant it access to personal files outside the game workspace.

Community integration: https://github.com/ahujasid/mcp-for-blender . No GitHub Actions runner can operate a GUI Blender running on your Windows PC automatically just because GitHub is connected to ChatGPT.

## Initial model review
Use `http://localhost:8000/tools/gym-uncle-3d-preview.html` after `START_GAME.bat` and choose the exported GLB. Inspect silhouette, front/side geometry, upright Y axis, feet at Y=0, positive scale, correct materials, and whether any animations appear. The preview intentionally does not modify game saves or battles.

## Prompt for Codex with Blender MCP connected

> Open the `CombatCataclysm3D` project and read `design/GAME_BIBLE.md` and `production/GYM_UNCLE_3D_PIPELINE.md`. Work on a new branch, preserve the main game and existing Gym Uncle 2D sprite fallback. Load `assets/characters/3d/gym_uncle.glb` in Blender through MCP and inspect its mesh, material and scale first. If the model is missing, stop and request the exported GLB rather than inventing success. Keep a huge upper body, tiny legs and oversized dumbbell consistent with `assets/characters/gym_uncle_battle.svg`. Fix orientation, create a usable humanoid rig only if mesh topology permits, then make Idle, Walk, Attack, Hit and Death actions with genuinely different character poses, focusing on a conspicuous windup/dumbbell slam. Preserve separate animations in GLB and export as `assets/characters/3d/gym_uncle_animated.glb`. Verify in `tools/gym-uncle-3d-preview.html` before adding a lazy GLTFLoader path to game Unit renderer. Load once and clone skinned rigs correctly for multiple simultaneously spawned units, keep per-instance AnimationMixer, advance it only in normal simulation time, handle loading failure with the original 2D sprite, dispose only instance-owned resources, and retain targeting/stats/knockback/base-pass-through behavior. Test 3 concurrent Gym Uncles, pause, death, restart and missing-GLB fallback. Never replace the approved sprite until the 3D character is visually verified.

## Acceptance criteria
- [ ] Model can be loaded locally and has recognizable front AND side silhouettes; no texture errors.
- [ ] Five distinct actions are visible in preview; if the source model has no armature, treat rigging as a separate task.
- [ ] No GLB or Blender Python execution exposes unrestricted socket to public networks.
- [ ] Three concurrent Gym Uncles do not share one mixer/skeleton state incorrectly.
- [ ] Existing 2D fallback works when GLB missing, invalid or loading slowly.
- [ ] Unit speed remains 0.62 until user approves a revised balance.
- [ ] Browser/Node checks actually run and are reported with results, not assumed.
