# Character DNA Schema

Each canonical character should have a small data file that describes identity and gameplay hooks without hardcoding engine logic.

Recommended fields:

```json
{
  "id": "player_gym_uncle",
  "displayName": "Gym Uncle",
  "faction": "player",
  "country": "japan",
  "role": "bruiser",
  "rarity": "rare",
  "cost": 220,
  "stats": {
    "hp": 100,
    "attack": 20,
    "range": 2.5,
    "speed": 1.0,
    "cooldown": 2.0
  },
  "traits": ["human", "bruiser", "chaos"],
  "personality": ["showoff", "short_temper", "hates_manager"],
  "counterTags": ["armored"],
  "weakTags": ["sleep"],
  "skills": {
    "active": [],
    "passive": [],
    "hidden": []
  },
  "failureBehaviors": [],
  "relationships": [],
  "comedyHooks": [],
  "voice": {},
  "animation": {},
  "art": {}
}
```

## Rules
- Engine code interprets generic fields and systems.
- Character files must not contain executable JavaScript.
- Hidden skills use data-driven conditions whenever possible.
- Relationship references use stable character IDs.
- Asset names are deterministic.
- Schema changes require migration notes.

## Character Factory output
A completed DNA entry can drive:
- Gameplay config
- Reference sheet prompts
- Expression sheet prompts
- Combat pose prompts
- Icon/card prompts
- Voice prompt generation
- Lore/ComedyDex entry
- QA test cases