import type { World } from '../world.ts'

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
    bullet.position.x += bullet.velocity.x * deltaSeconds
    bullet.position.y += bullet.velocity.y * deltaSeconds
    bullet.lifetime -= deltaSeconds
  }

  world.bullets = world.bullets.filter((bullet) => bullet.lifetime > 0)
}
