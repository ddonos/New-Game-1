import { Color, Fog, Vector3 } from 'three'
import type { GameAssets } from '../engine/assets.ts'
import type { RendererContext } from '../engine/renderer.ts'
import type { World } from '../ecs/world.ts'
import type { MapDefinition } from './types.ts'
import { Spawner } from './spawner.ts'

export function loadMap(
  world: World,
  renderer: RendererContext,
  assets: GameAssets,
  map: MapDefinition,
) {
  world.mapSize = {
    width: map.size.width,
    height: map.size.height,
  }
  world.cameraTarget = { ...map.playerSpawn.position }
  renderer.scene.background = new Color(map.ambience.skyTint)

  if (map.terrain.fogColor !== undefined) {
    renderer.scene.fog = new Fog(
      map.terrain.fogColor,
      map.terrain.fogNear ?? 120,
      map.terrain.fogFar ?? 320,
    )
  }

  renderer.setGround(map.size, assets.groundTexture)
  renderer.ambientLight.color = new Color(map.terrain.ambientColor)
  renderer.shadowLight.position.copy(new Vector3(...map.ambience.lightDirection))
  renderer.updateShadowBounds(map.size.width, map.size.height)

  const spawner = new Spawner(world, renderer.scene, assets)
  world.safeZone = {
    position: { ...map.playerSpawn.position },
    radius: map.safeZone?.radius ?? 52,
    active: true,
  }
  spawner.spawnHelipad(world.safeZone.position, world.safeZone.radius)

  for (const spawn of map.spawns) {
    if (spawn.kind === 'airbase') {
      spawner.spawnAirbases(spawn)
    }
  }

  for (const spawn of map.spawns) {
    if (spawn.kind === 'forest-cluster') {
      spawner.spawnForestCluster(spawn)
    } else if (spawn.kind === 'base') {
      spawner.spawnBase(spawn)
    }
  }
}
