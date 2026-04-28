import type { MapDefinition } from '../../game/types.ts'

export const forestValleyMap: MapDefinition = {
  id: 'forest-valley',
  name: 'Forest Valley',
  description: 'A small combat test valley with one enemy outpost.',
  size: {
    width: 624,
    height: 624,
  },
  playerSpawn: {
    position: { x: 0, y: -120 },
    facing: 0,
  },
  safeZone: {
    radius: 58,
  },
  terrain: {
    type: 'grass',
    groundTexture: 'forest-ground',
    ambientColor: 0xaed6a1,
    fogColor: 0xcde5be,
    fogNear: 120,
    fogFar: 624,
  },
  ambience: {
    skyTint: 0xcfe8ff,
    lightDirection: [90, 150, 60],
  },
  spawns: [
    {
      kind: 'forest-cluster',
      center: { x: -252, y: -238 },
      radius: 62,
      density: 0.0026,
      variants: ['Tree_1_B_Color1', 'Tree_2_A_Color1', 'Tree_3_A_Color1', 'Tree_4_B_Color1'],
    },
    {
      kind: 'forest-cluster',
      center: { x: -266, y: 16 },
      radius: 56,
      density: 0.0028,
      variants: ['Tree_1_B_Color1', 'Tree_2_A_Color1', 'Tree_3_A_Color1', 'Tree_4_B_Color1'],
    },
    {
      kind: 'forest-cluster',
      center: { x: -218, y: 238 },
      radius: 58,
      density: 0.0025,
      variants: ['Tree_1_B_Color1', 'Tree_2_A_Color1', 'Tree_4_B_Color1'],
    },
    {
      kind: 'forest-cluster',
      center: { x: -52, y: -260 },
      radius: 52,
      density: 0.0028,
      variants: ['Tree_2_A_Color1', 'Tree_3_A_Color1', 'Tree_4_B_Color1'],
    },
    {
      kind: 'forest-cluster',
      center: { x: 34, y: 252 },
      radius: 54,
      density: 0.0026,
      variants: ['Tree_1_B_Color1', 'Tree_3_A_Color1'],
    },
    {
      kind: 'forest-cluster',
      center: { x: 226, y: -232 },
      radius: 58,
      density: 0.0027,
      variants: ['Tree_1_B_Color1', 'Tree_2_A_Color1', 'Tree_4_B_Color1'],
    },
    {
      kind: 'forest-cluster',
      center: { x: 266, y: 12 },
      radius: 56,
      density: 0.0027,
      variants: ['Tree_1_B_Color1', 'Tree_2_A_Color1', 'Tree_3_A_Color1', 'Tree_4_B_Color1'],
    },
    {
      kind: 'forest-cluster',
      center: { x: 224, y: 230 },
      radius: 60,
      density: 0.0025,
      variants: ['Tree_1_B_Color1', 'Tree_2_A_Color1', 'Tree_4_B_Color1'],
    },
    {
      kind: 'forest-cluster',
      center: { x: 18, y: -28 },
      radius: 42,
      density: 0.0021,
      variants: ['Tree_1_B_Color1', 'Tree_2_A_Color1', 'Tree_4_B_Color1'],
    },
    {
      kind: 'airbase',
      count: 3,
      seed: 42,
      minDistanceFromPlayer: 115,
    },
  ],
}
