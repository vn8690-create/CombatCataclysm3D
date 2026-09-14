// Data-only World Comedy Tour packs. These are framework descriptors, not final content rosters.
export const WORLD_REGIONS = Object.freeze([
  Object.freeze({
    id: 'japan',
    name: 'Japan',
    icon: '🗾',
    theme: 'Office pressure, convenience-store absurdity, trains, hobby culture and old-vs-new city chaos.',
    visualIdentity: ['neon', 'train-platform', 'office-district', 'shopping-street', 'festival'],
    comedyFlavors: ['salaryman', 'otaku', 'ninja', 'sumo', 'convenience-store'],
    starterArchetypes: ['salaryman', 'otaku', 'ninja', 'sumo'],
    enemyArchetypes: ['printer-spirit', 'deadline-demon', 'crowd-rusher'],
    bossArchetypes: ['mega-manager', 'last-train-overlord'],
    hazards: ['rush-hour', 'vending-machine', 'train-door'],
    status: 'prototype',
  }),
  Object.freeze({
    id: 'vietnam',
    name: 'Vietnam',
    icon: '🇻🇳',
    theme: 'Street-life energy, motorbike rivers, food stalls, neighborhood characters and festive noise.',
    visualIdentity: ['street-food', 'motorbikes', 'alley', 'market', 'lanterns'],
    comedyFlavors: ['motorbike', 'beer-uncle', 'lottery-grandma', 'banh-mi-vendor'],
    starterArchetypes: ['motorbike-rider', 'beer-uncle', 'lottery-grandma', 'banh-mi-vendor'],
    enemyArchetypes: ['traffic-cone', 'karaoke-speaker', 'runaway-cart'],
    bossArchetypes: ['mega-karaoke', 'traffic-jam-beast'],
    hazards: ['motorbike-wave', 'plastic-stool', 'sudden-rain'],
    status: 'prototype',
  }),
]);

export const WORLD_REGION_MAP = Object.freeze(Object.fromEntries(WORLD_REGIONS.map(region => [region.id, region])));
