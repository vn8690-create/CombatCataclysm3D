// Boken routes define exploration structure. They are not final narrative content.
export const BOKEN_ROUTES = Object.freeze([
  Object.freeze({
    id: 'japan_tokyo_intro',
    regionId: 'japan',
    name: 'Tokyo: Overtime Alley',
    startNodeId: 'tokyo_gate',
    nodes: Object.freeze([
      Object.freeze({ id: 'tokyo_gate', type: 'story', title: 'Clock In?', next: ['salaryman_crossing'] }),
      Object.freeze({ id: 'salaryman_crossing', type: 'encounter', title: 'The Crossing', next: ['konbini_detour', 'printer_brawl'] }),
      Object.freeze({ id: 'konbini_detour', type: 'recruit', title: 'Convenience Store Hero', rewardCharacterId: 'office_cat', next: ['printer_brawl'] }),
      Object.freeze({ id: 'printer_brawl', type: 'battle', title: 'Printer Revolt', battleStageId: 1, next: ['last_train'] }),
      Object.freeze({ id: 'last_train', type: 'boss', title: 'Last Train Panic', battleStageId: 5, next: ['tokyo_clear'] }),
      Object.freeze({ id: 'tokyo_clear', type: 'reward', title: 'District Survived', next: [] }),
    ]),
  }),
  Object.freeze({
    id: 'vietnam_saigon_intro',
    regionId: 'vietnam',
    name: 'Saigon: Scooter Symphony',
    startNodeId: 'saigon_alley',
    nodes: Object.freeze([
      Object.freeze({ id: 'saigon_alley', type: 'story', title: 'Alley Wake-Up Call', next: ['coffee_corner'] }),
      Object.freeze({ id: 'coffee_corner', type: 'encounter', title: 'Coffee Corner', next: ['market_route', 'traffic_battle'] }),
      Object.freeze({ id: 'market_route', type: 'recruit', title: 'Market Shortcut', rewardCharacterId: 'grandma_slipper', next: ['traffic_battle'] }),
      Object.freeze({ id: 'traffic_battle', type: 'battle', title: 'Scooter Wave', battleStageId: 2, next: ['karaoke_boss'] }),
      Object.freeze({ id: 'karaoke_boss', type: 'boss', title: 'Midnight Karaoke', battleStageId: 6, next: ['saigon_clear'] }),
      Object.freeze({ id: 'saigon_clear', type: 'reward', title: 'Neighborhood Legend', next: [] }),
    ]),
  }),
]);

export const BOKEN_ROUTE_MAP = Object.freeze(Object.fromEntries(BOKEN_ROUTES.map(route => [route.id, route])));
