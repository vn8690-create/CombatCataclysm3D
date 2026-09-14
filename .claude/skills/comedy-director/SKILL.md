# Skill: Comedy Director

## Goal
Coordinate rare high-value battlefield jokes using camera, timing, animation, UI and audio hooks without turning every second into spectacle.

## Event model
Each event should define:
- event ID
- priority
- trigger conditions
- cooldown
- participating actors
- telegraph
- focus target
- camera behavior
- hit-stop/freeze behavior
- UI ducking
- audio sting hook
- recovery behavior
- debug trigger

## Major-event examples
- Manager Cannon
- SASHIMI
- Wrong Syringe
- Legendary Drunk
- Boss intro
- Hidden ultimate

## Rules
- Only one top-priority spotlight owns the camera at a time.
- Minor events may occur without camera takeover.
- Every takeover must restore camera/UI/simulation state safely.
- Repeated events receive cooldowns or reduced presentation.
- Text is punchline support, not the main joke.

## Acceptance criteria
- Priority conflicts are deterministic.
- Camera always returns to battle.
- Pause/quit during an event cannot soft-lock the game.
- Events can be triggered from debug tools for QA.
- Major events remain rare enough to feel special.