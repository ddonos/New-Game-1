import type { Group, Object3D } from 'three'
import type { AudioCue, BaseState, BulletState, EffectState, HUDState, PlayerState, PropState, Vec2 } from '../game/types.ts'

export interface PlayerView {
  root: Group
  yawPivot: Group
  bodyPivot: Group
  model: Group
  mainRotor: Object3D
  tailRotor: Object3D
}

export interface BaseView {
  root: Group
}

export interface PropView {
  root: Object3D
}

export interface BulletView {
  root: Object3D
}

export interface EffectView {
  root: Object3D
}

export interface World {
  player: PlayerState
  bullets: BulletState[]
  bases: BaseState[]
  props: PropState[]
  effects: EffectState[]
  audioCues: AudioCue[]
  clearZones: Array<{
    position: Vec2
    radius: number
  }>
  safeZone: {
    position: Vec2
    radius: number
    active: boolean
  }
  hud: HUDState
  score: number
  cameraTarget: Vec2
  mapSize: {
    width: number
    height: number
  }
  nextEntityId: number
  views: {
    player: PlayerView | null
    bullets: Map<string, BulletView>
    bases: Map<string, BaseView>
    props: Map<string, PropView>
    effects: Map<string, EffectView>
  }
}

export function createWorld(): World {
  return {
    player: {
      position: { x: 0, y: 0 },
      spawnPosition: { x: 0, y: 0 },
      spawnFacing: 0,
      velocity: { x: 0, y: 0 },
      facing: 0,
      angularVelocity: 0,
      health: 100,
      ammo: 200,
      fireCooldown: 0,
      hoverHeight: 4,
      targetHoverHeight: 24,
      bobPhase: 0,
      forwardSpeed: 0,
      visualPitch: 0,
      visualRoll: 0,
      mainRotorAngle: 0,
      tailRotorAngle: 0,
      destroyed: false,
      takeoffStarted: false,
      respawnTimer: 0,
    },
    bullets: [],
    bases: [],
    props: [],
    effects: [],
    audioCues: [],
    clearZones: [],
    safeZone: {
      position: { x: 0, y: 0 },
      radius: 52,
      active: true,
    },
    hud: {
      hp: 100,
      ammo: 200,
      score: 0,
    },
    score: 0,
    cameraTarget: { x: 0, y: 0 },
    mapSize: {
      width: 320,
      height: 320,
    },
    nextEntityId: 1,
    views: {
      player: null,
      bullets: new Map(),
      bases: new Map(),
      props: new Map(),
      effects: new Map(),
    },
  }
}

export function nextEntityId(world: World, prefix: string): string {
  const id = `${prefix}-${world.nextEntityId}`
  world.nextEntityId += 1
  return id
}

export function spawnBullet(
  world: World,
  bullet: Omit<BulletState, 'id' | 'owner' | 'maxLifetime' | 'previousPosition'> &
    Partial<Pick<BulletState, 'owner' | 'maxLifetime' | 'previousPosition'>>,
): BulletState {
  const created: BulletState = {
    id: nextEntityId(world, 'bullet'),
    owner: bullet.owner ?? 'player',
    maxLifetime: bullet.maxLifetime ?? bullet.lifetime,
    previousPosition: bullet.previousPosition ?? { ...bullet.position },
    ...bullet,
  }
  world.bullets.push(created)
  return created
}

export function spawnBase(
  world: World,
  base: Omit<BaseState, 'id'>,
): BaseState {
  const created: BaseState = {
    id: nextEntityId(world, 'base'),
    ...base,
  }
  world.bases.push(created)
  return created
}

export function spawnEffect(
  world: World,
  effect: Omit<EffectState, 'id' | 'age'>,
): EffectState {
  const maxEffects = 56
  const maxSmokeEffects = 36
  const smokeCount = world.effects.filter((entry) => entry.kind === 'smoke').length

  if (world.effects.length >= maxEffects || (effect.kind === 'smoke' && smokeCount >= maxSmokeEffects)) {
    const oldestEffect = world.effects.find((entry) => entry.kind === effect.kind) ?? world.effects[0]
    if (oldestEffect) {
      oldestEffect.age = oldestEffect.lifetime
    }
  }

  const created: EffectState = {
    id: nextEntityId(world, effect.kind),
    age: 0,
    ...effect,
  }
  world.effects.push(created)
  return created
}

export function queueAudio(world: World, cue: AudioCue) {
  world.audioCues.push(cue)
}

export function spawnProp(
  world: World,
  prop: Omit<PropState, 'id'>,
): PropState {
  const created: PropState = {
    id: nextEntityId(world, 'prop'),
    ...prop,
  }
  world.props.push(created)
  return created
}

export function refreshHud(world: World) {
  world.hud.hp = Math.max(0, Math.round(world.player.health))
  world.hud.ammo = Math.max(0, world.player.ammo)
  world.hud.score = world.score
}
