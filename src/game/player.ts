import {
  Group,
  Mesh,
  Object3D,
  type Scene,
} from 'three'
import type { GameAssets } from '../engine/assets.ts'
import type { InputState } from '../engine/input.ts'
import {
  queueAudio,
  spawnBullet,
  type PlayerView,
  type World,
} from '../ecs/world.ts'
import type { PlayerSpawn } from './types.ts'

function approach(current: number, target: number, rate: number, deltaSeconds: number) {
  const maxStep = rate * deltaSeconds
  if (Math.abs(target - current) <= maxStep) {
    return target
  }
  return current + Math.sign(target - current) * maxStep
}

function lerp(current: number, target: number, factor: number) {
  return current + (target - current) * factor
}

function forwardVector(facing: number) {
  return {
    x: Math.sin(facing),
    y: Math.cos(facing),
  }
}

function rightVector(facing: number) {
  return {
    x: Math.cos(facing),
    y: -Math.sin(facing),
  }
}

function findMeshByName(root: Object3D, targetName: string): Mesh | null {
  let match: Mesh | null = null

  root.traverse((child) => {
    if (match) {
      return
    }

    if (child instanceof Mesh && child.name === targetName) {
      match = child
    }
  })

  return match
}

export function initializePlayer(
  world: World,
  scene: Scene,
  assets: GameAssets,
  spawn: PlayerSpawn,
) {
  world.player.position = { ...spawn.position }
  world.player.spawnPosition = { ...spawn.position }
  world.player.spawnFacing = spawn.facing
  world.player.facing = spawn.facing
  world.player.hoverHeight = 4
  world.player.targetHoverHeight = 4
  world.player.takeoffStarted = false
  world.cameraTarget = { ...spawn.position }

  const root = new Group()
  const yawPivot = new Group()
  const bodyPivot = new Group()
  const model = assets.helicopterTemplate.clone(true)

  const mainRotor = findMeshByName(model, 'Heli')
  const tailRotor = findMeshByName(model, 'Tail')

  if (!mainRotor || !tailRotor) {
    throw new Error('Helicopter FBX is missing expected Heli/Tail propeller meshes')
  }

  mainRotor.userData.baseRotationY = mainRotor.rotation.y
  tailRotor.userData.baseRotationX = tailRotor.rotation.x

  bodyPivot.add(model)
  yawPivot.add(bodyPivot)
  root.add(yawPivot)
  scene.add(root)

  const view: PlayerView = {
    root,
    yawPivot,
    bodyPivot,
    model,
    mainRotor,
    tailRotor,
  }

  world.views.player = view
}

export function updatePlayer(world: World, input: InputState, deltaSeconds: number) {
  const player = world.player

  if (player.destroyed) {
    player.respawnTimer = Math.max(0, player.respawnTimer - deltaSeconds)
    player.velocity.x = 0
    player.velocity.y = 0
    player.angularVelocity = 0
    player.forwardSpeed = 0
    player.fireCooldown = Math.max(0, player.fireCooldown - deltaSeconds)
    player.mainRotorAngle += deltaSeconds * 12
    player.tailRotorAngle += deltaSeconds * 16

    if (player.respawnTimer <= 0) {
      player.position = { ...player.spawnPosition }
      player.facing = player.spawnFacing
      player.health = 100
      player.hoverHeight = 4
      player.targetHoverHeight = 4
      player.destroyed = false
      player.takeoffStarted = false
      player.visualPitch = 0
      player.visualRoll = 0
      player.fireCooldown = 0.2
      world.bullets = world.bullets.filter((bullet) => bullet.owner === 'player')
      world.cameraTarget = { ...player.spawnPosition }
      world.safeZone.active = true
    }
    return
  }

  if (!player.takeoffStarted) {
    player.velocity.x = 0
    player.velocity.y = 0
    player.forwardSpeed = 0
    player.angularVelocity = 0
    player.hoverHeight = 4
    player.targetHoverHeight = 4
    player.visualPitch = lerp(player.visualPitch, 0, deltaSeconds / 0.12)
    player.visualRoll = lerp(player.visualRoll, 0, deltaSeconds / 0.12)
    player.mainRotorAngle += deltaSeconds * 16
    player.tailRotorAngle += deltaSeconds * 20

    if (input.forward) {
      player.takeoffStarted = true
      player.targetHoverHeight = 24
    }

    return
  }

  player.hoverHeight = approach(player.hoverHeight, player.targetHoverHeight, 7.5, deltaSeconds)

  const rotationIntent = Number(input.rotateRight) - Number(input.rotateLeft)
  const rotationAcceleration = rotationIntent === 0 ? 8 : 13.33
  const maxAngularVelocity = 2
  const targetAngularVelocity = rotationIntent * maxAngularVelocity

  player.angularVelocity = approach(
    player.angularVelocity,
    targetAngularVelocity,
    rotationAcceleration,
    deltaSeconds,
  )

  const forward = forwardVector(player.facing)
  const right = rightVector(player.facing)
  const moveForward = Number(input.forward) - Number(input.backward)
  const moveRight = Number(input.strafeRight) - Number(input.strafeLeft)
  const moveLength = Math.hypot(moveForward, moveRight) || 1
  const moveScale = moveForward !== 0 || moveRight !== 0 ? 1 / moveLength : 0
  const speed = 28
  const canTranslate = player.hoverHeight > 14

  player.velocity.x = canTranslate ? (forward.x * moveForward + right.x * moveRight) * moveScale * speed : 0
  player.velocity.y = canTranslate ? (forward.y * moveForward + right.y * moveRight) * moveScale * speed : 0
  player.forwardSpeed = player.velocity.x * forward.x + player.velocity.y * forward.y

  player.fireCooldown = Math.max(0, player.fireCooldown - deltaSeconds)

  if (input.primaryFire && player.fireCooldown <= 0 && canTranslate) {
    const bulletForward = forwardVector(player.facing)
    const muzzleOffset = 3.6
    spawnBullet(world, {
      position: {
        x: player.position.x + bulletForward.x * muzzleOffset,
        y: player.position.y + bulletForward.y * muzzleOffset,
      },
      velocity: {
        x: bulletForward.x * 80,
        y: bulletForward.y * 80,
      },
      altitude: player.hoverHeight - 2.2,
      lifetime: 1.1,
      radius: 0.8,
      damage: 10,
    })
    queueAudio(world, 'player-fire')
    player.fireCooldown = 0.1
  }

  player.visualRoll = lerp(player.visualRoll, -player.angularVelocity * 0.3, deltaSeconds / 0.15)
  player.visualPitch = lerp(player.visualPitch, player.forwardSpeed * 0.007, deltaSeconds / 0.1)
  player.bobPhase += deltaSeconds * 2
  player.mainRotorAngle += deltaSeconds * 40
  player.tailRotorAngle += deltaSeconds * 50
}
