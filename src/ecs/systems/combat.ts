import { queueAudio, refreshHud, spawnBullet, spawnEffect, type World } from '../world.ts'
import type { Vec2 } from '../../game/types.ts'

const burstOffsets = [
  { x: 0, y: 0, altitude: 0, scale: 1 },
  { x: 1.7, y: -1.1, altitude: 0.5, scale: 0.62 },
  { x: -1.5, y: 1.4, altitude: 0.8, scale: 0.54 },
  { x: 0.9, y: 1.8, altitude: 1.1, scale: 0.48 },
]

function spawnImpactBurst(world: World, position: Vec2, altitude: number, scale: number) {
  queueAudio(world, 'impact')
  spawnEffect(world, {
    kind: 'explosion',
    position,
    altitude,
    lifetime: 0.18,
    scale: scale * 0.95,
    color: 0xfff1a6,
    emissive: 0xffd04a,
    emissiveIntensity: 2.8,
    opacity: 0.9,
    verticalRise: 0.2,
  })
  spawnEffect(world, {
    kind: 'explosion',
    position: { x: position.x + 0.8, y: position.y - 0.5 },
    altitude: altitude + 0.6,
    lifetime: 0.36,
    scale: scale * 1.2,
    color: 0xff7428,
    emissive: 0xff3100,
    emissiveIntensity: 1.6,
    opacity: 0.82,
    verticalRise: 1.3,
  })
  spawnEffect(world, {
    kind: 'smoke',
    position: { x: position.x - 0.7, y: position.y + 0.5 },
    altitude: altitude + 0.3,
    lifetime: 1,
    scale: scale * 1.35,
    color: 0x4a4d45,
    opacity: 0.5,
    verticalRise: 3.2,
  })
}

function spawnDestructionBurst(world: World, position: Vec2, altitude: number, scale: number) {
  queueAudio(world, 'explosion')
  for (const offset of burstOffsets) {
    spawnEffect(world, {
      kind: 'explosion',
      position: {
        x: position.x + offset.x * scale,
        y: position.y + offset.y * scale,
      },
      altitude: altitude + offset.altitude,
      lifetime: 0.46 + offset.scale * 0.12,
      scale: scale * offset.scale,
      color: offset.scale > 0.8 ? 0xffd36a : 0xff6a1f,
      emissive: 0xff3000,
      emissiveIntensity: 1.8,
      opacity: 0.86,
      verticalRise: 2.2,
    })
  }

  for (const offset of burstOffsets) {
    spawnEffect(world, {
      kind: 'smoke',
      position: {
        x: position.x - offset.y * scale * 0.9,
        y: position.y + offset.x * scale * 0.9,
      },
      altitude: Math.max(1, altitude - 0.8 + offset.altitude),
      lifetime: 1.7 + offset.scale * 0.55,
      scale: scale * (1 + offset.scale * 0.55),
      color: 0x30342f,
      opacity: 0.58,
      verticalRise: 4.8,
    })
  }
}

function closestPointOnSegment(point: Vec2, start: Vec2, end: Vec2): Vec2 {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSq = dx * dx + dy * dy

  if (lengthSq <= 0.0001) {
    return { ...end }
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq))
  return {
    x: start.x + dx * t,
    y: start.y + dy * t,
  }
}

function segmentHitsCircle(start: Vec2, end: Vec2, center: Vec2, radius: number) {
  const travelX = end.x - start.x
  const travelY = end.y - start.y
  const offsetX = start.x - center.x
  const offsetY = start.y - center.y
  const a = travelX * travelX + travelY * travelY
  const b = 2 * (offsetX * travelX + offsetY * travelY)
  const c = offsetX * offsetX + offsetY * offsetY - radius * radius

  if (a > 0.0001) {
    const discriminant = b * b - 4 * a * c
    if (discriminant >= 0) {
      const root = Math.sqrt(discriminant)
      const t1 = (-b - root) / (2 * a)
      const t2 = (-b + root) / (2 * a)
      const contactT = [t1, t2].filter((value) => value >= 0 && value <= 1).sort((left, right) => left - right)[0]

      if (contactT !== undefined) {
        return {
          hit: true,
          point: {
            x: start.x + travelX * contactT,
            y: start.y + travelY * contactT,
          },
        }
      }
    }
  }

  const closest = closestPointOnSegment(center, start, end)
  const dx = closest.x - center.x
  const dy = closest.y - center.y
  const insideAtEnd = (end.x - center.x) * (end.x - center.x) + (end.y - center.y) * (end.y - center.y) <= radius * radius

  return {
    hit: dx * dx + dy * dy <= radius * radius || insideAtEnd,
    point: insideAtEnd ? { ...end } : closest,
  }
}

export function updateCombat(world: World, deltaSeconds: number) {
  if (world.missionStatus !== 'playing') {
    refreshHud(world)
    return
  }

  const spentBullets = new Set<string>()
  const playerSafeDistance = Math.hypot(
    world.player.position.x - world.safeZone.position.x,
    world.player.position.y - world.safeZone.position.y,
  )
  world.safeZone.active = playerSafeDistance <= world.safeZone.radius

  for (const bullet of world.bullets) {
    if (spentBullets.has(bullet.id)) {
      continue
    }

    if (bullet.owner === 'enemy') {
      if (world.player.destroyed) {
        continue
      }

      const dx = bullet.position.x - world.player.position.x
      const dy = bullet.position.y - world.player.position.y
      const hitRadius = bullet.radius + 3.2

      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        const wasAlive = world.player.health > 0 && !world.player.destroyed
        world.player.health -= bullet.damage
        spawnImpactBurst(world, { ...world.player.position }, world.player.hoverHeight - 1.2, 2.2)
        if (world.player.health <= 30 && world.player.health > 0) {
          queueAudio(world, 'warning')
        }
        if (wasAlive && world.player.health <= 0) {
          world.player.health = 0
          world.player.destroyed = true
          world.player.respawnTimer = 2.4
          spawnDestructionBurst(world, { ...world.player.position }, world.player.hoverHeight - 2, 4.4)
        }
        spentBullets.add(bullet.id)
      }

      continue
    }

    for (const base of world.bases) {
      if (!base.alive) {
        continue
      }

      const dx = bullet.position.x - base.position.x
      const dy = bullet.position.y - base.position.y
      const hitRadius = bullet.radius + base.radius
      const sweep = segmentHitsCircle(
        bullet.previousPosition,
        bullet.position,
        base.position,
        hitRadius,
      )

      if (dx * dx + dy * dy <= hitRadius * hitRadius || sweep.hit) {
        const isLauncher = base.attackRange !== undefined
        const isAircraft = base.variant === 'parked-attack-aircraft'
        base.health -= bullet.damage
        spawnImpactBurst(
          world,
          isLauncher ? { ...base.position } : sweep.hit ? sweep.point : { ...bullet.position },
          isLauncher ? 0.9 : isAircraft ? 1.2 : 1.6,
          isLauncher ? 2 : isAircraft ? 2.2 : 1.4,
        )
        spentBullets.add(bullet.id)

        if (base.health <= 0) {
          base.alive = false
          world.score += base.scoreValue
          spawnDestructionBurst(
            world,
            { ...base.position },
            isLauncher ? 1.1 : isAircraft ? 1.4 : 2.4,
            isLauncher ? 4 : isAircraft ? 4.2 : 3,
          )
        }

        break
      }
    }
  }

  if (spentBullets.size > 0) {
    world.bullets = world.bullets.filter((bullet) => !spentBullets.has(bullet.id))
  }

  if (world.bases.length > 0 && world.bases.every((base) => !base.alive)) {
    world.missionStatus = 'victory'
    refreshHud(world)
    return
  }

  for (const base of world.bases) {
    if (!base.alive || base.attackRange === undefined) {
      continue
    }

    if (world.safeZone.active) {
      base.fireCooldown = Math.max(base.fireCooldown ?? 0, 0.8)
      continue
    }

    const dx = world.player.position.x - base.position.x
    const dy = world.player.position.y - base.position.y
    const distance = Math.hypot(dx, dy)

    if (distance > base.attackRange) {
      base.fireCooldown = Math.max(0, (base.fireCooldown ?? 0) - deltaSeconds * 0.35)
      continue
    }

    base.fireCooldown = (base.fireCooldown ?? 0) - deltaSeconds

    if (base.fireCooldown <= 0 && distance > 0.001) {
      const speed = base.projectileSpeed ?? 44
      const invDistance = 1 / distance
      const muzzleOffset = base.muzzleOffset ?? 4.8
      const normalized = {
        x: dx * invDistance,
        y: dy * invDistance,
      }
      spawnBullet(world, {
        owner: 'enemy',
        position: {
          x: base.position.x + normalized.x * muzzleOffset,
          y: base.position.y + normalized.y * muzzleOffset,
        },
        velocity: {
          x: normalized.x * speed,
          y: normalized.y * speed,
        },
        altitude: base.muzzleAltitude ?? 3.2,
        targetAltitude: world.player.hoverHeight - 1.8,
        lifetime: base.projectileLifetime ?? 4,
        radius: 2.2,
        damage: base.projectileDamage ?? 10,
        smokeCooldown: 0,
      })
      queueAudio(world, 'rocket-launch')
      base.fireCooldown = base.fireInterval ?? 2.5
    }
  }

  refreshHud(world)
}
