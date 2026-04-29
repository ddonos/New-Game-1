import {
  AmbientLight,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PCFSoftShadowMap,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  type Object3D,
  Vector3,
  WebGLRenderer,
  type MeshStandardMaterialParameters,
  type Texture,
} from 'three'
import type { World } from '../ecs/world.ts'
import type { EffectState } from '../game/types.ts'

export interface RendererContext {
  scene: Scene
  camera: OrthographicCamera
  renderer: WebGLRenderer
  ambientLight: AmbientLight
  shadowLight: DirectionalLight
  viewport: HTMLElement
  setGround: (size: { width: number; height: number }, texture: Texture) => void
  updateShadowBounds: (width: number, height: number) => void
  syncWorld: (world: World, elapsedSeconds: number) => void
  renderFrame: () => void
  dispose: () => void
}

const CAMERA_HEIGHT = 88
const CAMERA_FORWARD_OFFSET = 32
const CAMERA_SIDE_OFFSET = -12
const DEFAULT_MAP_SIZE = 320
const PLAY_FRUSTUM_HEIGHT = 96
const GROUND_VISUAL_PADDING = 180
const CAMERA_FOLLOW_SPEED = 0.14

function clamp(value: number, min: number, max: number) {
  if (min > max) {
    return (min + max) / 2
  }
  return Math.max(min, Math.min(max, value))
}

function disposeObject(root: Object3D) {
  root.traverse((child) => {
    if (child instanceof Mesh) {
      child.geometry.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const material of materials) {
        material.dispose()
      }
    }
  })
}

function createBulletView(owner: 'player' | 'enemy') {
  if (owner === 'enemy') {
    const root = new Group()
    const body = new Mesh(
      new CylinderGeometry(0.42, 0.42, 3.1, 14),
      new MeshStandardMaterial({
        color: 0xb5b8aa,
        roughness: 0.48,
        metalness: 0.25,
      }),
    )
    body.rotation.x = Math.PI / 2
    body.castShadow = true
    root.add(body)

    const nose = new Mesh(
      new ConeGeometry(0.5, 1.2, 14),
      new MeshStandardMaterial({
        color: 0xe15b36,
        roughness: 0.42,
        metalness: 0.18,
        emissive: 0x4a0900,
        emissiveIntensity: 0.25,
      }),
    )
    nose.position.z = 2.1
    nose.rotation.x = Math.PI / 2
    nose.castShadow = true
    root.add(nose)

    const tail = new Mesh(
      new CylinderGeometry(0.5, 0.5, 0.22, 12),
      new MeshStandardMaterial({ color: 0x242a27, roughness: 0.6, metalness: 0.22 }),
    )
    tail.position.z = -1.68
    tail.rotation.x = Math.PI / 2
    root.add(tail)

    for (let index = 0; index < 4; index += 1) {
      const fin = new Mesh(
        new ConeGeometry(0.28, 0.9, 3),
        new MeshStandardMaterial({ color: 0x59635b, roughness: 0.56, metalness: 0.18 }),
      )
      fin.position.z = -1.35
      fin.rotation.z = (index / 4) * Math.PI * 2
      fin.scale.set(0.55, 0.8, 0.3)
      root.add(fin)
    }

    const flame = new Mesh(
      new ConeGeometry(0.24, 0.85, 10),
      new MeshStandardMaterial({
        color: 0xffb347,
        transparent: true,
        opacity: 0.72,
        emissive: 0xff4a00,
        emissiveIntensity: 1.7,
      }),
    )
    flame.position.z = -2.15
    flame.rotation.x = -Math.PI / 2
    root.add(flame)
    return root
  }

  const root = new Group()
  const jacket = new Mesh(
    new CylinderGeometry(0.16, 0.18, 1.45, 10),
    new MeshStandardMaterial({
      color: 0xd0a852,
      roughness: 0.34,
      metalness: 0.52,
      emissive: 0x3b2500,
      emissiveIntensity: 0.2,
    }),
  )
  jacket.rotation.x = Math.PI / 2
  root.add(jacket)

  const tip = new Mesh(
    new ConeGeometry(0.18, 0.46, 10),
    new MeshStandardMaterial({
      color: 0xf0d184,
      roughness: 0.28,
      metalness: 0.48,
      emissive: 0xffaa22,
      emissiveIntensity: 0.35,
    }),
  )
  tip.position.z = 0.95
  tip.rotation.x = Math.PI / 2
  root.add(tip)

  const tracer = new Mesh(
    new CylinderGeometry(0.08, 0.16, 0.68, 8),
    new MeshStandardMaterial({
      color: 0xff8a2a,
      transparent: true,
      opacity: 0.72,
      emissive: 0xff5a00,
      emissiveIntensity: 1.1,
    }),
  )
  tracer.position.z = -0.95
  tracer.rotation.x = Math.PI / 2
  root.add(tracer)
  return root
}

function createEffectView(effect: EffectState) {
  const color = effect.color ?? (effect.kind === 'explosion' ? 0xff7b2f : 0x899187)
  const emissive = effect.emissive ?? (effect.kind === 'explosion' ? 0xff3b00 : 0x000000)
  const emissiveIntensity = effect.emissiveIntensity ?? (effect.kind === 'explosion' ? 1.35 : 0)

  if (effect.kind === 'spark') {
    const root = new Group()
    const sparkColors = [0xfff0a0, 0xff9b2f, 0xffd35a]
    for (let index = 0; index < 5; index += 1) {
      const colorValue = sparkColors[index % sparkColors.length]!
      const streak = new Mesh(
        new BoxGeometry(0.08, 0.08, 1),
        new MeshStandardMaterial({
          color: colorValue,
          transparent: true,
          opacity: effect.opacity ?? 0.86,
          emissive: colorValue,
          emissiveIntensity: effect.emissiveIntensity ?? 1.6,
          depthWrite: false,
        }),
      )
      streak.rotation.y = (index / 5) * Math.PI * 2
      streak.rotation.x = index % 2 === 0 ? 0.22 : -0.2
      streak.position.z = 0.08 * index
      root.add(streak)
    }
    return root
  }

  const mesh = new Mesh(
    new SphereGeometry(1, effect.kind === 'explosion' ? 8 : 6, effect.kind === 'explosion' ? 6 : 4),
    new MeshStandardMaterial({
      color,
      transparent: true,
      opacity: effect.opacity ?? (effect.kind === 'explosion' ? 0.82 : 0.38),
      roughness: 1,
      metalness: 0,
      emissive,
      emissiveIntensity,
      depthWrite: false,
    }),
  )
  mesh.castShadow = false
  mesh.receiveShadow = false
  return mesh
}

function setEffectOpacity(root: Object3D, opacity: number, emissiveIntensity: number) {
  root.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return
    }

    const material = child.material as MeshStandardMaterial
    material.opacity = opacity
    material.emissiveIntensity = emissiveIntensity
  })
}

export function createRenderer(viewport: HTMLElement): RendererContext {
  const scene = new Scene()
  scene.background = new Color(0xcfe8ff)
  let mapSize = {
    width: DEFAULT_MAP_SIZE,
    height: DEFAULT_MAP_SIZE,
  }
  let viewportAspect = 1

  const camera = new OrthographicCamera(-50, 50, 50, -50, 0.1, 500)
  camera.position.set(CAMERA_SIDE_OFFSET, CAMERA_HEIGHT, CAMERA_FORWARD_OFFSET)
  camera.lookAt(0, 0, 0)

  const renderer = new WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(viewport.clientWidth, viewport.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  viewport.append(renderer.domElement)

  const ambientLight = new AmbientLight(0xaed6a1, 0.8)
  scene.add(ambientLight)

  const shadowLight = new DirectionalLight(0xffffff, 1.3)
  shadowLight.position.set(90, 150, 60)
  shadowLight.castShadow = true
  shadowLight.shadow.mapSize.width = 2048
  shadowLight.shadow.mapSize.height = 2048
  shadowLight.shadow.bias = -0.0003
  shadowLight.shadow.normalBias = 0.03
  scene.add(shadowLight)
  scene.add(shadowLight.target)

  const groundMaterialParameters: MeshStandardMaterialParameters = {
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
  }
  const ground = new Mesh(
    new PlaneGeometry(1, 1, 1, 1),
    new MeshStandardMaterial(groundMaterialParameters),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const resize = () => {
    const width = viewport.clientWidth
    const height = viewport.clientHeight
    renderer.setSize(width, height)
    viewportAspect = width / Math.max(height, 1)
    const frustumHeight = PLAY_FRUSTUM_HEIGHT
    camera.left = (-frustumHeight * viewportAspect) / 2
    camera.right = (frustumHeight * viewportAspect) / 2
    camera.top = frustumHeight / 2
    camera.bottom = -frustumHeight / 2
    camera.updateProjectionMatrix()
  }

  window.addEventListener('resize', resize)
  resize()

  return {
    scene,
    camera,
    renderer,
    ambientLight,
    shadowLight,
    viewport,
    setGround(size, texture) {
      mapSize = { ...size }
      resize()
      const visualWidth = size.width + GROUND_VISUAL_PADDING
      const visualHeight = size.height + GROUND_VISUAL_PADDING
      ground.geometry.dispose()
      ground.geometry = new PlaneGeometry(visualWidth, visualHeight, 1, 1)
      const material = ground.material as MeshStandardMaterial
      texture.repeat.set(visualWidth / 18, visualHeight / 18)
      texture.needsUpdate = true
      material.map = texture
      material.color.set(0x7fbd58)
      material.roughness = 1
      material.metalness = 0
      material.emissive.set(0x0c2107)
      material.emissiveIntensity = 0.05
      material.needsUpdate = true
    },
    updateShadowBounds(width, height) {
      const mapSpan = Math.max(width, height)
      const halfSpan = mapSpan * 0.76
      shadowLight.shadow.camera.left = -halfSpan
      shadowLight.shadow.camera.right = halfSpan
      shadowLight.shadow.camera.top = halfSpan
      shadowLight.shadow.camera.bottom = -halfSpan
      shadowLight.shadow.camera.near = 0.5
      shadowLight.shadow.camera.far = mapSpan * 2.8
      shadowLight.shadow.camera.updateProjectionMatrix()
      shadowLight.target.position.set(0, 0, 0)
      shadowLight.target.updateMatrixWorld()
      shadowLight.updateMatrixWorld()
      shadowLight.shadow.camera.updateMatrixWorld()
    },
    syncWorld(world, _elapsedSeconds) {
      const playerView = world.views.player
      if (playerView) {
        const bobOffset = Math.sin(world.player.bobPhase) * 0.1
        playerView.root.visible = !world.player.destroyed
        playerView.root.position.set(
          world.player.position.x,
          world.player.hoverHeight + bobOffset,
          world.player.position.y,
        )
        playerView.yawPivot.rotation.y = world.player.facing
        playerView.bodyPivot.rotation.z = world.player.visualRoll
        playerView.bodyPivot.rotation.x = world.player.visualPitch
        playerView.mainRotor.rotation.x = Number(playerView.mainRotor.userData.baseRotationX ?? 0)
        playerView.mainRotor.rotation.y =
          Number(playerView.mainRotor.userData.baseRotationY ?? 0) + world.player.mainRotorAngle
        playerView.mainRotor.rotation.z = Number(playerView.mainRotor.userData.baseRotationZ ?? 0)
        playerView.tailRotor.rotation.x =
          Number(playerView.tailRotor.userData.baseRotationX ?? 0) + world.player.tailRotorAngle
      }

      for (const prop of world.props) {
        const view = world.views.props.get(prop.id)
        if (!view) {
          continue
        }
        view.root.position.set(prop.position.x, 0, prop.position.y)
        view.root.rotation.y = prop.rotation
      }

      for (const base of world.bases) {
        const view = world.views.bases.get(base.id)
        if (!view) {
          continue
        }

        view.root.visible = base.alive
        view.root.position.set(base.position.x, 0, base.position.y)
        if (base.attackRange !== undefined) {
          const dx = world.player.position.x - base.position.x
          const dz = world.player.position.y - base.position.y
          view.root.rotation.y = Math.atan2(dx, dz)
        }
      }

      for (const bullet of world.bullets) {
        let view = world.views.bullets.get(bullet.id)

        if (!view) {
          const root = createBulletView(bullet.owner)
          scene.add(root)
          view = { root }
          world.views.bullets.set(bullet.id, view)
        }

        view.root.position.set(bullet.position.x, bullet.altitude, bullet.position.y)
        view.root.rotation.y = Math.atan2(bullet.velocity.x, bullet.velocity.y)
      }

      for (const effect of world.effects) {
        let view = world.views.effects.get(effect.id)

        if (!view) {
          const root = createEffectView(effect)
          scene.add(root)
          view = { root }
          world.views.effects.set(effect.id, view)
        }

        const progress = effect.age / Math.max(effect.lifetime, 0.001)
        const baseOpacity = effect.opacity ?? (effect.kind === 'explosion' ? 0.82 : 0.38)
        const emissiveIntensity = effect.emissiveIntensity ?? (effect.kind === 'explosion' ? 1.35 : 0)
        const growth = effect.kind === 'explosion' ? 0.72 + progress * 2.15 : effect.kind === 'spark' ? 1 + progress * 0.45 : 0.65 + progress * 1.55
        const rise = effect.verticalRise ?? (effect.kind === 'explosion' ? 1.6 : 2.2)
        view.root.position.set(effect.position.x, effect.altitude + progress * rise, effect.position.y)
        view.root.scale.setScalar(effect.scale * growth)
        view.root.rotation.y += 0.04
        setEffectOpacity(
          view.root,
          Math.max(0, baseOpacity * (1 - progress)),
          Math.max(0, emissiveIntensity * (1 - progress)),
        )
      }

      for (const [id, view] of world.views.bullets) {
        const stillExists = world.bullets.some((bullet) => bullet.id === id)
        if (!stillExists) {
          scene.remove(view.root)
          disposeObject(view.root)
          world.views.bullets.delete(id)
        }
      }

      for (const [id, view] of world.views.effects) {
        const stillExists = world.effects.some((effect) => effect.id === id)
        if (!stillExists) {
          scene.remove(view.root)
          disposeObject(view.root)
          world.views.effects.delete(id)
        }
      }

      for (const [id, view] of world.views.bases) {
        const base = world.bases.find((entry) => entry.id === id)
        if (!base || !base.alive) {
          scene.remove(view.root)
          world.views.bases.delete(id)
        }
      }

      const visibleHalfWidth = (PLAY_FRUSTUM_HEIGHT * viewportAspect) / 2
      const visibleHalfHeight = PLAY_FRUSTUM_HEIGHT / 2
      const mapHalfWidth = mapSize.width / 2
      const mapHalfHeight = mapSize.height / 2
      const targetX = clamp(
        world.cameraTarget.x,
        -mapHalfWidth + visibleHalfWidth,
        mapHalfWidth - visibleHalfWidth,
      )
      const targetZ = clamp(
        world.cameraTarget.y,
        -mapHalfHeight + visibleHalfHeight,
        mapHalfHeight - visibleHalfHeight,
      )
      const lookTarget = new Vector3(targetX, world.player.hoverHeight * 0.35, targetZ)
      const desiredPosition = new Vector3(
        targetX + CAMERA_SIDE_OFFSET,
        CAMERA_HEIGHT,
        targetZ + CAMERA_FORWARD_OFFSET,
      )
      camera.position.lerp(desiredPosition, CAMERA_FOLLOW_SPEED)
      camera.lookAt(lookTarget)
    },
    renderFrame() {
      renderer.render(scene, camera)
    },
    dispose() {
      window.removeEventListener('resize', resize)
      renderer.dispose()
    },
  }
}
