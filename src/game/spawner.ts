import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  type Scene,
} from 'three'
import type { GameAssets } from '../engine/assets.ts'
import { spawnBase, spawnProp, type World } from '../ecs/world.ts'
import type { AirbaseSpawnRule, BaseSpawnRule, ForestClusterSpawnRule, Vec2 } from './types.ts'

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

function isInsideClearZone(position: Vec2, zones: World['clearZones'], extraPadding = 0) {
  return zones.some((zone) => {
    const distance = Math.hypot(position.x - zone.position.x, position.y - zone.position.y)
    return distance < zone.radius + extraPadding
  })
}

function addClearZone(world: World, position: Vec2, radius: number) {
  world.clearZones.push({ position: { ...position }, radius })
}

function offsetPoint(center: Vec2, rotation: number, forward: number, right: number): Vec2 {
  return {
    x: center.x + Math.sin(rotation) * forward + Math.cos(rotation) * right,
    y: center.y + Math.cos(rotation) * forward - Math.sin(rotation) * right,
  }
}

function addBox(
  root: Group,
  size: [number, number, number],
  color: number,
  position: [number, number, number],
  rotationY = 0,
  roughness = 0.8,
) {
  const mesh = new Mesh(
    new BoxGeometry(...size),
    new MeshStandardMaterial({ color, roughness, metalness: 0.08 }),
  )
  mesh.position.set(...position)
  mesh.rotation.y = rotationY
  mesh.castShadow = true
  mesh.receiveShadow = true
  root.add(mesh)
  return mesh
}

function addCylinder(
  root: Group,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  color: number,
  position: [number, number, number],
  rotation: [number, number, number],
) {
  const mesh = new Mesh(
    new CylinderGeometry(radiusTop, radiusBottom, height, 12),
    new MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.16 }),
  )
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.castShadow = true
  mesh.receiveShadow = true
  root.add(mesh)
  return mesh
}

function createRunway(length: number, width: number) {
  const root = new Group()
  const asphaltMaterial = new MeshStandardMaterial({
    color: 0x303835,
    roughness: 0.98,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })
  const apronMaterial = new MeshStandardMaterial({
    color: 0x8f9688,
    roughness: 0.92,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  })
  const asphalt = new Mesh(
    new PlaneGeometry(width, length),
    asphaltMaterial,
  )
  asphalt.rotation.x = -Math.PI / 2
  asphalt.position.y = 0.09
  asphalt.receiveShadow = false
  root.add(asphalt)

  const centerLineCount = Math.floor(length / 16)
  for (let index = 0; index < centerLineCount; index += 1) {
    const z = -length / 2 + 10 + index * 16
    const marking = addBox(root, [1.1, 0.035, 7], 0xe8e0c0, [0, 0.14, z], 0, 0.9)
    marking.castShadow = false
    marking.receiveShadow = false
  }

  const startThreshold = new Mesh(new PlaneGeometry(width + 7, 5), apronMaterial)
  startThreshold.rotation.x = -Math.PI / 2
  startThreshold.position.set(0, 0.11, -length / 2 - 3)
  startThreshold.receiveShadow = false
  root.add(startThreshold)

  const endThreshold = new Mesh(new PlaneGeometry(width + 7, 5), apronMaterial.clone())
  endThreshold.rotation.x = -Math.PI / 2
  endThreshold.position.set(0, 0.11, length / 2 + 3)
  endThreshold.receiveShadow = false
  root.add(endThreshold)

  for (const side of [-1, 1]) {
    const shoulder = new Mesh(
      new PlaneGeometry(2.4, length - 7),
      new MeshStandardMaterial({
        color: 0x4d5c4b,
        roughness: 0.98,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    )
    shoulder.rotation.x = -Math.PI / 2
    shoulder.position.set(side * (width / 2 + 1.6), 0.06, 0)
    shoulder.receiveShadow = false
    root.add(shoulder)
  }
  return root
}

function createHelipad(radius: number) {
  const root = new Group()
  const pad = new Mesh(
    new CylinderGeometry(radius, radius, 0.32, 48),
    new MeshStandardMaterial({ color: 0x38423f, roughness: 0.92, metalness: 0.04 }),
  )
  pad.position.y = 0.05
  pad.receiveShadow = true
  root.add(pad)

  const inner = new Mesh(
    new CylinderGeometry(radius * 0.78, radius * 0.78, 0.36, 48),
    new MeshStandardMaterial({ color: 0x505c57, roughness: 0.9, metalness: 0.02 }),
  )
  inner.position.y = 0.08
  inner.receiveShadow = true
  root.add(inner)

  const hColor = 0xf2f4dc
  const markHeight = 0.1
  const markY = 0.34
  addBox(root, [1.5, markHeight, radius * 1.18], hColor, [-radius * 0.34, markY, 0], 0, 0.88)
  addBox(root, [1.5, markHeight, radius * 1.18], hColor, [radius * 0.34, markY, 0], 0, 0.88)
  addBox(root, [radius * 0.68, markHeight, 1.5], hColor, [0, markY + 0.01, 0], 0, 0.88)
  return root
}

function createHangar() {
  const root = new Group()
  addBox(root, [18, 7.5, 16], 0x59605e, [0, 3.75, 0], 0, 0.75)
  addBox(root, [20, 2.4, 18], 0x46504e, [0, 8.7, 0], 0, 0.72)
  addBox(root, [13, 4.5, 0.5], 0x202725, [0, 2.3, -8.3], 0, 0.85)
  addBox(root, [3, 1.2, 17], 0x737c76, [-8.8, 1.1, 0], 0, 0.85)
  addBox(root, [3, 1.2, 17], 0x737c76, [8.8, 1.1, 0], 0, 0.85)
  return root
}

function createParkedAircraft() {
  const root = new Group()
  addCylinder(root, 0.78, 1.25, 17.5, 0x6f7d79, [0, 1.45, 0], [Math.PI / 2, 0, 0])
  const nose = new Mesh(
    new ConeGeometry(0.82, 3.8, 16),
    new MeshStandardMaterial({ color: 0xa6aea9, roughness: 0.5, metalness: 0.24 }),
  )
  nose.position.set(0, 1.45, 10.6)
  nose.rotation.x = Math.PI / 2
  nose.castShadow = true
  nose.receiveShadow = true
  root.add(nose)

  const cockpit = new Mesh(
    new BoxGeometry(2.1, 0.72, 2.8),
    new MeshStandardMaterial({
      color: 0x1f3440,
      roughness: 0.22,
      metalness: 0.05,
      emissive: 0x0a1820,
      emissiveIntensity: 0.25,
    }),
  )
  cockpit.position.set(0, 2.05, 4.7)
  cockpit.rotation.x = -0.18
  cockpit.castShadow = true
  root.add(cockpit)

  addBox(root, [19, 0.28, 4.2], 0x64726d, [0, 1.38, 0.9], 0, 0.58)
  addBox(root, [8.2, 0.24, 2.9], 0x5c6965, [0, 1.75, -7.1], 0, 0.58)
  addBox(root, [0.42, 4.2, 2.1], 0x56625f, [0, 3.45, -7.4], 0, 0.58)
  addBox(root, [1.2, 0.42, 4.2], 0x333d39, [-4.2, 0.42, -2.7], 0, 0.74)
  addBox(root, [1.2, 0.42, 4.2], 0x333d39, [4.2, 0.42, -2.7], 0, 0.74)

  const hardpoints = [
    { x: -6.2, z: 1.1 },
    { x: -3.6, z: 1.6 },
    { x: 3.6, z: 1.6 },
    { x: 6.2, z: 1.1 },
  ]
  for (const point of hardpoints) {
    addBox(root, [0.5, 0.24, 1.2], 0x2d3532, [point.x, 1.02, point.z], 0, 0.7)
    addCylinder(root, 0.22, 0.28, 2.9, 0xd1d6c8, [point.x, 0.75, point.z + 0.45], [Math.PI / 2, 0, 0])
    const missileNose = new Mesh(
      new ConeGeometry(0.24, 0.7, 10),
      new MeshStandardMaterial({ color: 0xc9472f, roughness: 0.45, metalness: 0.12 }),
    )
    missileNose.position.set(point.x, 0.75, point.z + 2.25)
    missileNose.rotation.x = Math.PI / 2
    missileNose.castShadow = true
    root.add(missileNose)
  }

  addBox(root, [1.7, 0.35, 2.6], 0x2e3935, [-1.4, 0.58, -8.7], 0, 0.7)
  addBox(root, [1.7, 0.35, 2.6], 0x2e3935, [1.4, 0.58, -8.7], 0, 0.7)
  return root
}

function createRocketLauncher() {
  const root = new Group()
  addBox(root, [6.5, 1.1, 4.4], 0x2f3b34, [0, 0.55, 0], 0, 0.8)
  addBox(root, [4.8, 1, 2.8], 0x4d5b50, [0, 1.45, 0.1], 0, 0.72)
  addBox(root, [4.9, 0.55, 5.6], 0x2a332e, [0, 2.2, 1.4], 0, 0.72)
  addCylinder(root, 0.38, 0.38, 5.8, 0x1d2421, [-1.35, 2.65, 1.7], [Math.PI / 2, 0, 0])
  addCylinder(root, 0.38, 0.38, 5.8, 0x1d2421, [0, 2.65, 1.7], [Math.PI / 2, 0, 0])
  addCylinder(root, 0.38, 0.38, 5.8, 0x1d2421, [1.35, 2.65, 1.7], [Math.PI / 2, 0, 0])
  addCylinder(root, 0.32, 0.38, 3.8, 0x6d766b, [-1.35, 2.66, 2.4], [Math.PI / 2, 0, 0])
  addCylinder(root, 0.32, 0.38, 3.8, 0x6d766b, [0, 2.66, 2.4], [Math.PI / 2, 0, 0])
  addCylinder(root, 0.32, 0.38, 3.8, 0x6d766b, [1.35, 2.66, 2.4], [Math.PI / 2, 0, 0])
  addBox(root, [7.8, 0.28, 0.42], 0x151a17, [0, 0.16, -2.15], 0, 0.9)
  addBox(root, [7.8, 0.28, 0.42], 0x151a17, [0, 0.16, 2.15], 0, 0.9)
  return root
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
    const targetCount = Math.max(8, Math.round(Math.PI * rule.radius * rule.radius * rule.density))
    let placed = 0

    for (let index = 0; index < targetCount * 3 && placed < targetCount; index += 1) {
      const angle = pseudoRandom(index + rule.center.x) * Math.PI * 2
      const distance = Math.sqrt(pseudoRandom(index + rule.center.y)) * rule.radius
      const position = {
        x: rule.center.x + Math.cos(angle) * distance,
        y: rule.center.y + Math.sin(angle) * distance,
      }
      const rotation = pseudoRandom(index + 99) * Math.PI * 2
      const scale = 0.85 + pseudoRandom(index + 199) * 0.45
      const clearRadius = 4.5 * scale

      if (isInsideClearZone(position, this.world.clearZones, clearRadius + 2)) {
        continue
      }

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
      addClearZone(this.world, position, clearRadius)
      placed += 1
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

  spawnHelipad(position: Vec2, radius: number) {
    const prop = spawnProp(this.world, {
      kind: 'helipad',
      variant: 'safe-zone-helipad',
      position,
      rotation: 0,
      scale: 1,
    })
    const root = createHelipad(Math.max(12, radius * 0.32))
    root.position.set(position.x, 0.02, position.y)
    this.scene.add(root)
    this.world.views.props.set(prop.id, { root })
    addClearZone(this.world, position, radius)
  }

  spawnAirbases(rule: AirbaseSpawnRule) {
    const mapHalfWidth = this.world.mapSize.width / 2
    const mapHalfHeight = this.world.mapSize.height / 2
    const edgePadding = 150
    const triangleCorners = [
      { x: -mapHalfWidth + edgePadding, y: -mapHalfHeight + edgePadding },
      { x: mapHalfWidth - edgePadding, y: -mapHalfHeight + edgePadding },
      { x: 0, y: mapHalfHeight - edgePadding },
    ]

    for (let baseIndex = 0; baseIndex < rule.count; baseIndex += 1) {
      const center = triangleCorners[baseIndex % triangleCorners.length]!
      addClearZone(this.world, center, 108)
      this.spawnAirbaseAt(center, rule.seed + baseIndex * 101)
    }
  }

  private spawnAirbaseAt(center: Vec2, seed: number) {
    const rotation = pseudoRandom(seed) * Math.PI * 2
    const runway = spawnProp(this.world, {
      kind: 'runway',
      variant: 'asphalt-runway',
      position: center,
      rotation,
      scale: 1,
    })
    const runwayRoot = createRunway(96, 22)
    runwayRoot.position.set(center.x, 0.03, center.y)
    runwayRoot.rotation.y = rotation
    this.scene.add(runwayRoot)
    this.world.views.props.set(runway.id, { root: runwayRoot })
    addClearZone(this.world, center, 58)

    const hangarOffsets = [
      { forward: -34, right: -37 },
      { forward: 0, right: -39 },
      { forward: 34, right: -37 },
    ]
    for (let index = 0; index < hangarOffsets.length; index += 1) {
      const offset = hangarOffsets[index]!
      const position = offsetPoint(center, rotation, offset.forward, offset.right)
      const prop = spawnProp(this.world, {
        kind: 'hangar',
        variant: 'field-hangar',
        position,
        rotation: rotation + (offset.right < 0 ? Math.PI / 2 : -Math.PI / 2),
        scale: 1,
      })
      const root = createHangar()
      root.position.set(position.x, 0, position.y)
      root.rotation.y = prop.rotation
      this.scene.add(root)
      this.world.views.props.set(prop.id, { root })
      addClearZone(this.world, position, 13)
    }

    const aircraftOffsets = [
      { forward: -24, right: 22 },
      { forward: 10, right: 22 },
      { forward: 39, right: 20 },
    ]
    for (let index = 0; index < aircraftOffsets.length; index += 1) {
      const offset = aircraftOffsets[index]!
      const position = offsetPoint(center, rotation, offset.forward, offset.right)
      const yaw = rotation + (pseudoRandom(seed + index) - 0.5) * 0.28
      const aircraft = spawnBase(this.world, {
        position,
        variant: 'parked-attack-aircraft',
        health: 70,
        maxHealth: 70,
        radius: 10,
        scoreValue: 220,
        alive: true,
      })
      const root = createParkedAircraft()
      root.position.set(position.x, 0, position.y)
      root.rotation.y = yaw
      this.scene.add(root)
      this.world.views.bases.set(aircraft.id, { root })
      addClearZone(this.world, position, 8)
    }

    const launcherOffsets = [
      { forward: -54, right: 42 },
      { forward: 54, right: 42 },
      { forward: 2, right: 53 },
    ]
    for (let index = 0; index < launcherOffsets.length; index += 1) {
      const offset = launcherOffsets[index]!
      const position = offsetPoint(center, rotation, offset.forward, offset.right)
      const launcher = spawnBase(this.world, {
        position,
        variant: 'rocket-launcher',
        health: 100,
        maxHealth: 100,
        radius: 10,
        scoreValue: 350,
        alive: true,
        attackRange: 132,
        fireCooldown: 0.6 + pseudoRandom(seed + index * 11) * 1.2,
        fireInterval: 2.3,
        projectileSpeed: 46,
        projectileDamage: 12,
        projectileLifetime: 4.5,
        muzzleOffset: 5.2,
        muzzleAltitude: 2.8,
      })
      const root = createRocketLauncher()
      root.position.set(position.x, 0, position.y)
      root.rotation.y = rotation + Math.PI / 2
      this.scene.add(root)
      this.world.views.bases.set(launcher.id, { root })
      addClearZone(this.world, position, 12)
    }
  }
}
