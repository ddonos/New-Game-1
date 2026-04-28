import { spawnEffect, type World } from '../world.ts'

export function updateMovement(world: World, deltaSeconds: number) {
  const { player } = world
  const halfWidth = world.mapSize.width / 2 - 8
  const halfHeight = world.mapSize.height / 2 - 8

  player.facing += player.angularVelocity * deltaSeconds
  player.position.x = Math.max(-halfWidth, Math.min(halfWidth, player.position.x + player.velocity.x * deltaSeconds))
  player.position.y = Math.max(-halfHeight, Math.min(halfHeight, player.position.y + player.velocity.y * deltaSeconds))

  world.cameraTarget.x = player.position.x
  world.cameraTarget.y = player.position.y

  for (const bullet of world.bullets) {
    bullet.previousPosition = { ...bullet.position }
    bullet.position.x += bullet.velocity.x * deltaSeconds
    bullet.position.y += bullet.velocity.y * deltaSeconds
    if (bullet.targetAltitude !== undefined) {
      const progress = 1 - bullet.lifetime / Math.max(bullet.maxLifetime, 0.001)
      const climbFactor = Math.min(1, progress * 3)
      bullet.altitude += (bullet.targetAltitude - bullet.altitude) * climbFactor * deltaSeconds * 8
    }
    if (bullet.owner === 'enemy') {
      bullet.smokeCooldown = (bullet.smokeCooldown ?? 0) - deltaSeconds
      if (bullet.smokeCooldown <= 0) {
        const speed = Math.hypot(bullet.velocity.x, bullet.velocity.y) || 1
        spawnEffect(world, {
          kind: 'smoke',
          position: {
            x: bullet.position.x - (bullet.velocity.x / speed) * 2.3,
            y: bullet.position.y - (bullet.velocity.y / speed) * 2.3,
          },
          altitude: Math.max(2, bullet.altitude - 0.2),
          lifetime: 0.68,
          scale: 1.35,
          color: 0x6d7168,
          opacity: 0.58,
          verticalRise: 1.5,
        })
        bullet.smokeCooldown = 0.1
      }
    }
    bullet.lifetime -= deltaSeconds
  }

  world.bullets = world.bullets.filter((bullet) => bullet.lifetime > 0)
  for (const effect of world.effects) {
    effect.age += deltaSeconds
  }
  world.effects = world.effects.filter((effect) => effect.age < effect.lifetime)
}
