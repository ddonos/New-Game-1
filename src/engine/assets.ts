import {
  Box3,
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
import helicopterModelUrl from '../assets/models/helicopter/helicopter.fbx?url'
import helicopterTextureUrl from '../assets/models/helicopter/blend 32.png'
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
import turretBaseUrl from '../assets/models/turrets/turretBase.fbx?url'
import turretTopUrl from '../assets/models/turrets/turret01.fbx?url'
import turretTextureUrl from '../assets/models/turrets/Texture.png'
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
  treeTemplates: Record<string, Group>
  buildingTemplates: Record<string, Group>
  groundTexture: Texture
  staged: {
    turretBaseUrl: string
    turretTopUrl: string
    turretTextureUrl: string
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

export async function loadAssets(): Promise<GameAssets> {
  const [helicopter, fighterJet, helicopterTexture, groundTexture] = await Promise.all([
    loadFBX(helicopterModelUrl),
    loadOBJ(fighterJetModelUrl),
    loadTexture(helicopterTextureUrl),
    loadTexture(groundTextureUrl),
  ])
  const treeEntries = await Promise.all(
    Object.entries(treeModelUrls).map(async ([key, url]) => [key, await loadGLTFScene(url)] as const),
  )
  const buildingEntries = await Promise.all(
    Object.entries(buildingModelUrls).map(async ([key, url]) => [key, await loadFBX(url)] as const),
  )

  helicopterTexture.colorSpace = SRGBColorSpace
  groundTexture.colorSpace = SRGBColorSpace

  forEachMesh(helicopter, (mesh) => {
    const material = coerceStandardMaterial(mesh)
    material.map = helicopterTexture
    material.transparent = true
    material.alphaTest = 0.2
    material.needsUpdate = true
  })
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
    treeTemplates,
    buildingTemplates,
    groundTexture,
    staged: {
      turretBaseUrl,
      turretTopUrl,
      turretTextureUrl,
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
