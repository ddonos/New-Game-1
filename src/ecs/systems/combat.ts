import { refreshHud, type World } from '../world.ts'

export function updateCombat(world: World) {
  const spentBullets = new Set<string>()

  for (const bullet of world.bullets) {
    if (spentBullets.has(bullet.id)) {
      continue
    }

    for (const base of world.bases) {
      if (!base.alive) {
        continue
      }

      const dx = bullet.position.x - base.position.x
      const dy = bullet.position.y - base.position.y
      const hitRadius = bullet.radius + base.radius

      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        base.health -= bullet.damage
        spentBullets.add(bullet.id)

        if (base.health <= 0) {
          base.alive = false
          world.score += base.scoreValue
        }

        break
      }
    }
  }

  if (spentBullets.size > 0) {
    world.bullets = world.bullets.filter((bullet) => !spentBullets.has(bullet.id))
  }

  refreshHud(world)
}
