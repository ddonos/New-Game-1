import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PCFSoftShadowMap,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  type MeshStandardMaterialParameters,
  type Texture,
} from 'three'
import type { World } from '../ecs/world.ts'

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

const CAMERA_HEIGHT = 82
const CAMERA_FORWARD_OFFSET = 62
const CAMERA_SIDE_OFFSET = -18
const DEFAULT_MAP_SIZE = 320
const OVERVIEW_PADDING = 96
const GROUND_VISUAL_PADDING = 180

export function createRenderer(viewport: HTMLElement): RendererContext {
  const scene = new Scene()
  scene.background = new Color(0xcfe8ff)
  let overviewSize = DEFAULT_MAP_SIZE + OVERVIEW_PADDING

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
    const aspect = width / Math.max(height, 1)
    const frustumHeight = Math.max(overviewSize, overviewSize / aspect)
    camera.left = (-frustumHeight * aspect) / 2
    camera.right = (frustumHeight * aspect) / 2
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
      overviewSize = Math.max(size.width, size.height) + OVERVIEW_PADDING
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
      const halfSpan = Math.max(width, height) * 0.55
      shadowLight.shadow.camera.left = -halfSpan
      shadowLight.shadow.camera.right = halfSpan
      shadowLight.shadow.camera.top = halfSpan
      shadowLight.shadow.camera.bottom = -halfSpan
      shadowLight.shadow.camera.near = 10
      shadowLight.shadow.camera.far = 320
      shadowLight.shadow.camera.updateProjectionMatrix()
    },
    syncWorld(world, _elapsedSeconds) {
      const playerView = world.views.player
      if (playerView) {
        const bobOffset = Math.sin(world.player.bobPhase) * 0.1
        playerView.root.position.set(
          world.player.position.x,
          world.player.hoverHeight + bobOffset,
          world.player.position.y,
        )
        playerView.yawPivot.rotation.y = world.player.facing
        playerView.bodyPivot.rotation.z = world.player.visualRoll
        playerView.bodyPivot.rotation.x = world.player.visualPitch
        playerView.mainRotor.rotation.y =
          Number(playerView.mainRotor.userData.baseRotationY ?? 0) + world.player.mainRotorAngle
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
      }

      for (const bullet of world.bullets) {
        let view = world.views.bullets.get(bullet.id)

        if (!view) {
          const mesh = new Mesh(
            new SphereGeometry(0.45, 10, 10),
            new MeshStandardMaterial({
              color: 0xffe082,
              emissive: 0xffa000,
              emissiveIntensity: 1.2,
            }),
          )
          mesh.castShadow = false
          mesh.receiveShadow = false
          scene.add(mesh)
          view = { mesh }
          world.views.bullets.set(bullet.id, view)
        }

        view.mesh.position.set(bullet.position.x, bullet.altitude, bullet.position.y)
      }

      for (const [id, view] of world.views.bullets) {
        const stillExists = world.bullets.some((bullet) => bullet.id === id)
        if (!stillExists) {
          scene.remove(view.mesh)
          view.mesh.geometry.dispose()
          ;(view.mesh.material as MeshStandardMaterial).dispose()
          world.views.bullets.delete(id)
        }
      }

      for (const [id, view] of world.views.bases) {
        const base = world.bases.find((entry) => entry.id === id)
        if (!base || !base.alive) {
          scene.remove(view.root)
          world.views.bases.delete(id)
        }
      }

      const desiredPosition = new Vector3(CAMERA_SIDE_OFFSET, CAMERA_HEIGHT, CAMERA_FORWARD_OFFSET)
      camera.position.lerp(desiredPosition, 0.1)
      camera.lookAt(0, 0, 0)
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
