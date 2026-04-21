export interface Vec2 {
  x: number
  y: number
}

export interface PlayerSpawn {
  position: Vec2
  facing: number
}

export interface TerrainDefinition {
  type: 'grass' | 'desert' | 'snow' | 'jungle'
  groundTexture: string
  ambientColor: number
  fogColor?: number
  fogNear?: number
  fogFar?: number
}

export interface ForestClusterSpawnRule {
  kind: 'forest-cluster'
  center: Vec2
  radius: number
  density: number
  variants: string[]
}

export interface BaseSpawnRule {
  kind: 'base'
  center: Vec2
  buildingCount: number
  turretCount: number
  launcherCount: number
  difficulty: number
  structureVariants?: string[]
}

export type SpawnRule = ForestClusterSpawnRule | BaseSpawnRule

export interface MapDefinition {
  id: string
  name: string
  description: string
  size: {
    width: number
    height: number
  }
  playerSpawn: PlayerSpawn
  terrain: TerrainDefinition
  spawns: SpawnRule[]
  ambience: {
    skyTint: number
    lightDirection: [number, number, number]
  }
}

export interface PlayerState {
  position: Vec2
  velocity: Vec2
  facing: number
  angularVelocity: number
  health: number
  ammo: number
  fireCooldown: number
  hoverHeight: number
  bobPhase: number
  forwardSpeed: number
  visualPitch: number
  visualRoll: number
  mainRotorAngle: number
  tailRotorAngle: number
}

export interface BulletState {
  id: string
  position: Vec2
  velocity: Vec2
  altitude: number
  lifetime: number
  radius: number
  damage: number
}

export interface BaseState {
  id: string
  position: Vec2
  variant: string
  health: number
  maxHealth: number
  radius: number
  scoreValue: number
  alive: boolean
}

export interface PropState {
  id: string
  kind: 'tree'
  variant: string
  position: Vec2
  rotation: number
  scale: number
}

export interface HUDState {
  hp: number
  ammo: number
  score: number
}
