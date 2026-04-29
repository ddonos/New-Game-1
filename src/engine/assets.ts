import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import helicopterModelUrl from '../assets/models/helicopter/helicopter.glb?url'
import fighterJetModelUrl from '../assets/models/aircraft/fighter_jet.obj?url'
import tree1BModelUrl from '../assets/models/nature/Tree_1_B_Color1.gltf?url'
import tree2AModelUrl from '../assets/models/nature/Tree_2_A_Color1.gltf?url'
import tree3AModelUrl from '../assets/models/nature/Tree_3_A_Color1.gltf?url'
import tree4BModelUrl from '../assets/models/nature/Tree_4_B_Color1.gltf?url'
import barracksModelUrl from '../assets/models/buildings/base-barracks-a.fbx?url'
import watchtowerModelUrl from '../assets/models/buildings/base-watchtower-a.fbx?url'
import storageModelUrl from '../assets/models/buildings/base-storage-a.fbx?url'
import marketModelUrl from '../assets/models/buildings/base-market-a.fbx?url'
import templeModelUrl from '../assets/models/buildings/base-temple-a.fbx?url'
import towncenterModelUrl from '../assets/models/buildings/base-towncenter-a.fbx?url'
import groundTextureUrl from '../assets/textures/terrain/grass.png'
import turretModelUrl from '../assets/models/turrets/turret.glb?url'
import muzzleFlashUrl from '../assets/textures/vfx/muzzle-flash-front.png'
import explosionSpriteUrl from '../assets/textures/vfx/explosion-1-b-spritesheet.png'
import playerGunSfxUrl from '../assets/audio/player-gun.wav'
import bulletHitSfxUrl from '../assets/audio/bullet-hit.wav'
import baseDestroyedSfxUrl from '../assets/audio/base-destroyed.wav'
import explosionSfxUrl from '../assets/audio/explosion.mp3'
import gunFireSfxUrl from '../assets/audio/gun-fire.mp3'
import rocketLaunchSfxUrl from '../assets/audio/rocket-launch.mp3'
import rotorHoverSfxUrl from '../assets/audio/rotor-hover.mp3'
import warningBeepSfxUrl from '../assets/audio/warning-beep.mp3'
import gameplayMusicUrl from '../assets/audio/gameplay-loop.mp3'
import menuMusicUrl from '../assets/audio/menu-loop.mp3'
const treeModelUrls = {
  Tree_1_B_Color1: tree1BModelUrl,
  Tree_2_A_Color1: tree2AModelUrl,
  Tree_3_A_Color1: tree3AModelUrl,
  Tree_4_B_Color1: tree4BModelUrl,
} satisfies Record<string, string>
const buildingModelUrls = {
  barracks: barracksModelUrl,
  watchtower: watchtowerModelUrl,
  storage: storageModelUrl,
  market: marketModelUrl,
  temple: templeModelUrl,
  towncenter: towncenterModelUrl,
} satisfies Record<string, string>

export interface GameAssets {
  helicopterTemplate: Group
  fighterJetTemplate: Group
  turretTemplate: Group
  treeTemplates: Record<string, Group>
  buildingTemplates: Record<string, Group>
  groundTexture: Texture
  staged: {
    muzzleFlashUrl: string
    explosionSpriteUrl: string
    playerGunSfxUrl: string
    bulletHitSfxUrl: string
    baseDestroyedSfxUrl: string
    explosionSfxUrl: string
    gunFireSfxUrl: string
    rocketLaunchSfxUrl: string
    rotorHoverSfxUrl: string
    warningBeepSfxUrl: string
    gameplayMusicUrl: string
    menuMusicUrl: string
  }
}

function loadTexture(url: string): Promise<Texture> {
  const loader = new TextureLoader()

  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject)
  })
}

function loadFBX(url: string): Promise<Group> {
  const loader = new FBXLoader()

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (object) => resolve(object),
      undefined,
      (error) => reject(error),
    )
  })
}

function loadGLTFScene(url: string): Promise<Group> {
  const loader = new GLTFLoader()

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error),
    )
  })
}

function loadOBJ(url: string): Promise<Group> {
  const loader = new OBJLoader()

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (object) => resolve(object),
      undefined,
      (error) => reject(error),
    )
  })
}

function forEachMesh(root: Object3D, callback: (mesh: Mesh) => void) {
  root.traverse((child) => {
    if (child instanceof Mesh) {
      callback(child)
    }
  })
}

function setShadows(root: Object3D) {
  forEachMesh(root, (mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
  })
}

function coerceStandardMaterial(mesh: Mesh, color = 0xffffff) {
  const current = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
  const nextMaterial =
    current instanceof MeshStandardMaterial
      ? current
      : new MeshStandardMaterial({
          color,
          roughness: 0.7,
          metalness: 0.1,
        })

  if (Array.isArray(mesh.material)) {
    mesh.material = [nextMaterial]
  } else {
    mesh.material = nextMaterial
  }

  return nextMaterial
}

function normalizeLongestSide(root: Object3D, targetSize: number) {
  const bounds = new Box3().setFromObject(root)
  const size = bounds.getSize(new Vector3())
  const longestSide = Math.max(size.x, size.y, size.z)

  if (longestSide === 0) {
    return
  }

  const scalar = targetSize / longestSide
  root.scale.multiplyScalar(scalar)
}

function centerOnGround(root: Object3D) {
  const bounds = new Box3().setFromObject(root)
  const center = bounds.getCenter(new Vector3())
  const min = bounds.min
  root.position.x -= center.x
  root.position.z -= center.z
  root.position.y -= min.y
}

function stylePlayerHelicopter(root: Object3D) {
  const militaryGreen = 0x4f6548
  const darkDetail = 0x1d2420
  const lightDetail = 0xa8b1a0
  const glass = 0x020405

  forEachMesh(root, (mesh) => {
    const meshName = mesh.name.toLowerCase()
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const styledMaterials = materials.map((current) => {
      const material =
        current instanceof MeshStandardMaterial
          ? current
          : new MeshStandardMaterial({
              color: militaryGreen,
              roughness: 0.7,
              metalness: 0.1,
            })
      const materialName = material.name.toLowerCase()

      if (
        materialName.includes('transl') ||
        materialName.includes('glass') ||
        materialName.includes('window')
      ) {
        material.color.setHex(glass)
        material.transparent = false
        material.opacity = 1
        material.roughness = 0.2
        material.metalness = 0.08
        material.emissive.setHex(0x000000)
        material.emissiveIntensity = 0
      } else if (
        materialName.includes('black') ||
        materialName.includes('foregrou') ||
        meshName.includes('mesh25') ||
        meshName.includes('mesh26') ||
        meshName.includes('mesh27') ||
        meshName.includes('mesh28')
      ) {
        material.color.setHex(darkDetail)
        material.roughness = 0.52
        material.metalness = 0.22
      } else if (meshName.includes('mesh188')) {
        material.color.setHex(lightDetail)
        material.roughness = 0.58
        material.metalness = 0.18
      } else {
        material.color.setHex(militaryGreen)
        material.roughness = 0.64
        material.metalness = 0.12
      }

      material.needsUpdate = true
      return material
    })

    mesh.material = Array.isArray(mesh.material) ? styledMaterials : styledMaterials[0]!
  })
}

function optimizeVertexColorModel(root: Group): Group {
  const geometries: BufferGeometry[] = []

  root.updateMatrixWorld(true)
  root.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return
    }

    const geometry = child.geometry.clone()
    const paint = geometry.getAttribute('color_1') ?? geometry.getAttribute('color')

    if (paint) {
      geometry.setAttribute('color', paint.clone())
    } else {
      const color = new Float32Array(geometry.getAttribute('position').count * 3)
      color.fill(0.45)
      geometry.setAttribute('color', new Float32BufferAttribute(color, 3))
    }

    geometry.deleteAttribute('color_1')
    geometry.deleteAttribute('uv')
    geometry.applyMatrix4(child.matrixWorld)
    geometries.push(geometry)
  })

  const optimized = new Group()
  const mergedGeometry = mergeGeometries(geometries, false)

  if (!mergedGeometry) {
    return root
  }

  const material = new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0,
    vertexColors: true,
  })
  const mesh = new Mesh(mergedGeometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  optimized.add(mesh)
  return optimized
}

export async function loadAssets(): Promise<GameAssets> {
  const [helicopter, fighterJet, turretSource, groundTexture] = await Promise.all([
    loadGLTFScene(helicopterModelUrl),
    loadOBJ(fighterJetModelUrl),
    loadGLTFScene(turretModelUrl),
    loadTexture(groundTextureUrl),
  ])
  const treeEntries = await Promise.all(
    Object.entries(treeModelUrls).map(async ([key, url]) => [key, await loadGLTFScene(url)] as const),
  )
  const buildingEntries = await Promise.all(
    Object.entries(buildingModelUrls).map(async ([key, url]) => [key, await loadFBX(url)] as const),
  )

  groundTexture.colorSpace = SRGBColorSpace

  stylePlayerHelicopter(helicopter)
  normalizeLongestSide(helicopter, 16)
  centerOnGround(helicopter)
  setShadows(helicopter)

  // This OBJ is a 3ds Max export using Z-up coordinates. Rotate it once at import
  // so its length stays on the ground plane instead of becoming object height.
  fighterJet.rotation.x = -Math.PI / 2
  fighterJet.updateMatrixWorld(true)
  forEachMesh(fighterJet, (mesh) => {
    const isGlass = mesh.name.toLowerCase().includes('glass')
    const material = coerceStandardMaterial(mesh, isGlass ? 0x13232b : 0x64706b)
    material.roughness = isGlass ? 0.18 : 0.56
    material.metalness = isGlass ? 0.02 : 0.3
    material.transparent = isGlass
    material.opacity = isGlass ? 0.74 : 1
    material.emissive.setHex(isGlass ? 0x061018 : 0x000000)
    material.emissiveIntensity = isGlass ? 0.18 : 0
  })
  normalizeLongestSide(fighterJet, 23)
  centerOnGround(fighterJet)
  setShadows(fighterJet)

  const turret = optimizeVertexColorModel(turretSource)
  normalizeLongestSide(turret, 11)
  centerOnGround(turret)
  setShadows(turret)

  const treeTemplates = Object.fromEntries(treeEntries)
  for (const tree of Object.values(treeTemplates)) {
    forEachMesh(tree, (mesh) => {
      coerceStandardMaterial(mesh)
    })
    normalizeLongestSide(tree, 11)
    centerOnGround(tree)
    setShadows(tree)
  }

  const buildingSizes: Record<string, number> = {
    barracks: 14,
    watchtower: 13,
    storage: 12,
    market: 13,
    temple: 16,
    towncenter: 18,
  }
  const buildingTemplates = Object.fromEntries(buildingEntries)
  for (const [key, building] of Object.entries(buildingTemplates)) {
    forEachMesh(building, (mesh) => {
      const material = coerceStandardMaterial(mesh, 0x8c6a43)
      material.roughness = 0.9
    })
    normalizeLongestSide(building, buildingSizes[key] ?? 12)
    centerOnGround(building)
    setShadows(building)
  }

  groundTexture.wrapS = RepeatWrapping
  groundTexture.wrapT = RepeatWrapping

  return {
    helicopterTemplate: helicopter,
    fighterJetTemplate: fighterJet,
    turretTemplate: turret,
    treeTemplates,
    buildingTemplates,
    groundTexture,
    staged: {
      muzzleFlashUrl,
      explosionSpriteUrl,
      playerGunSfxUrl,
      bulletHitSfxUrl,
      baseDestroyedSfxUrl,
      explosionSfxUrl,
      gunFireSfxUrl,
      rocketLaunchSfxUrl,
      rotorHoverSfxUrl,
      warningBeepSfxUrl,
      gameplayMusicUrl,
      menuMusicUrl,
    },
  }
}
