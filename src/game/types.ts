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

export interface AirbaseSpawnRule {
  kind: 'airbase'
  count: number
  seed: number
  minDistanceFromPlayer: number
}

export type SpawnRule = ForestClusterSpawnRule | BaseSpawnRule | AirbaseSpawnRule

export interface MapDefinition {
  id: string
  name: string
  description: string
  size: {
    width: number
    height: number
  }
  playerSpawn: PlayerSpawn
  safeZone?: {
    radius: number
  }
  terrain: TerrainDefinition
  spawns: SpawnRule[]
  ambience: {
    skyTint: number
    lightDirection: [number, number, number]
  }
}

export interface PlayerState {
  position: Vec2
  spawnPosition: Vec2
  spawnFacing: number
  velocity: Vec2
  facing: number
  angularVelocity: number
  health: number
  ammo: number
  fireCooldown: number
  hoverHeight: number
  targetHoverHeight: number
  bobPhase: number
  forwardSpeed: number
  visualPitch: number
  visualRoll: number
  mainRotorAngle: number
  tailRotorAngle: number
  destroyed: boolean
  takeoffStarted: boolean
  respawnTimer: number
}

export interface BulletState {
  id: string
  owner: 'player' | 'enemy'
  position: Vec2
  previousPosition: Vec2
  velocity: Vec2
  altitude: number
  targetAltitude?: number
  lifetime: number
  maxLifetime: number
  radius: number
  damage: number
  smokeCooldown?: number
}

export interface EffectState {
  id: string
  kind: 'explosion' | 'smoke'
  position: Vec2
  altitude: number
  age: number
  lifetime: number
  scale: number
  color?: number
  emissive?: number
  emissiveIntensity?: number
  opacity?: number
  verticalRise?: number
}

export type AudioCue = 'player-fire' | 'rocket-launch' | 'impact' | 'explosion' | 'warning'

export interface BaseState {
  id: string
  position: Vec2
  variant: string
  health: number
  maxHealth: number
  radius: number
  scoreValue: number
  alive: boolean
  attackRange?: number
  fireCooldown?: number
  fireInterval?: number
  projectileSpeed?: number
  projectileDamage?: number
  projectileLifetime?: number
  muzzleOffset?: number
  muzzleAltitude?: number
}

export interface PropState {
  id: string
  kind: 'tree' | 'runway' | 'hangar' | 'parked-aircraft' | 'airbase-detail' | 'helipad'
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
