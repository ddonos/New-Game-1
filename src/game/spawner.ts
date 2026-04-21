import type { Group, Scene } from 'three'
import type { GameAssets } from '../engine/assets.ts'
import { spawnBase, spawnProp, type World } from '../ecs/world.ts'
import type { BaseSpawnRule, ForestClusterSpawnRule } from './types.ts'

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function cloneTemplate(template: Group) {
  return template.clone(true)
}

function pickVariant<T>(variants: T[], seed: number) {
  if (variants.length === 0) {
    throw new Error('Variant list cannot be empty')
  }

  const index = Math.floor(pseudoRandom(seed) * variants.length) % variants.length
  return variants[index]!
}

export class Spawner {
  private readonly world: World
  private readonly scene: Scene
  private readonly assets: GameAssets

  constructor(
    world: World,
    scene: Scene,
    assets: GameAssets,
  ) {
    this.world = world
    this.scene = scene
    this.assets = assets
  }

  spawnForestCluster(rule: ForestClusterSpawnRule) {
    const count = Math.max(8, Math.round(Math.PI * rule.radius * rule.radius * rule.density))

    for (let index = 0; index < count; index += 1) {
      const angle = pseudoRandom(index + rule.center.x) * Math.PI * 2
      const distance = Math.sqrt(pseudoRandom(index + rule.center.y)) * rule.radius
      const position = {
        x: rule.center.x + Math.cos(angle) * distance,
        y: rule.center.y + Math.sin(angle) * distance,
      }
      const rotation = pseudoRandom(index + 99) * Math.PI * 2
      const scale = 0.85 + pseudoRandom(index + 199) * 0.45
      const variant = pickVariant(rule.variants, index + rule.center.x * 7 + rule.center.y * 11)
      const prop = spawnProp(this.world, {
        kind: 'tree',
        variant,
        position,
        rotation,
        scale,
      })

      const root = cloneTemplate(this.assets.treeTemplates[variant] ?? this.assets.treeTemplates.Tree_2_A_Color1)
      root.position.set(position.x, 0, position.y)
      root.rotation.y = rotation
      root.scale.multiplyScalar(scale)
      this.scene.add(root)
      this.world.views.props.set(prop.id, { root })
    }
  }

  spawnBase(rule: BaseSpawnRule) {
    const structureVariants =
      rule.structureVariants && rule.structureVariants.length > 0
        ? rule.structureVariants
        : ['barracks', 'watchtower', 'storage']

    for (let index = 0; index < rule.buildingCount; index += 1) {
      const angle = (index / Math.max(rule.buildingCount, 1)) * Math.PI * 2
      const ringRadius = rule.buildingCount > 1 ? 12 + (index % 2) * 7 : 0
      const variant = pickVariant(structureVariants, index + rule.center.x * 5 + rule.center.y * 3)
      const position = {
        x: rule.center.x + Math.cos(angle) * ringRadius + (index % 2 === 0 ? 0 : 3),
        y: rule.center.y + Math.sin(angle) * ringRadius,
      }
      const base = spawnBase(this.world, {
        position,
        variant,
        health: 60 + rule.difficulty * 20,
        maxHealth: 60 + rule.difficulty * 20,
        radius: variant === 'watchtower' ? 5.5 : 7,
        scoreValue: variant === 'watchtower' ? 180 : 250,
        alive: true,
      })

      const template =
        this.assets.buildingTemplates[variant] ?? this.assets.buildingTemplates.barracks
      const root = cloneTemplate(template)
      const yaw = pseudoRandom(index + 17) * Math.PI * 2
      root.position.set(position.x, 0, position.y)
      root.rotation.y = yaw
      this.scene.add(root)
      this.world.views.bases.set(base.id, { root })
    }
  }
}
