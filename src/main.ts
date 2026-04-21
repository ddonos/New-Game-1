import './style.css'
import { getMapDefinition } from './content/maps/index.ts'
import { createFixedStepLoop } from './engine/loop.ts'
import { loadAssets } from './engine/assets.ts'
import { createInput } from './engine/input.ts'
import { createRenderer } from './engine/renderer.ts'
import { updateCombat } from './ecs/systems/combat.ts'
import { updateMovement } from './ecs/systems/movement.ts'
import { createWorld, refreshHud } from './ecs/world.ts'
import { loadMap } from './game/map-loader.ts'
import { initializePlayer, updatePlayer } from './game/player.ts'
import { createHud } from './ui/hud.ts'

async function bootstrap() {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) {
    throw new Error('App root not found')
  }

  app.innerHTML = `
    <div class="game-shell">
      <div class="game-stage">
        <div class="game-loading" data-loading>Loading Phase 1...</div>
      </div>
    </div>
  `

  const stage = app.querySelector<HTMLElement>('.game-stage')
  const loading = app.querySelector<HTMLElement>('[data-loading]')

  if (!stage || !loading) {
    throw new Error('Game shell failed to mount')
  }

  const world = createWorld()
  const input = createInput()
  const renderer = createRenderer(stage)
  const hud = createHud(stage)
  const assets = await loadAssets()
  const map = getMapDefinition('forest-valley')

  initializePlayer(world, renderer.scene, assets, map.playerSpawn)
  loadMap(world, renderer, assets, map)
  refreshHud(world)
  hud.update(world)
  loading.remove()

  createFixedStepLoop(
    (deltaSeconds) => {
      updatePlayer(world, input.getState(), deltaSeconds)
      updateMovement(world, deltaSeconds)
      updateCombat(world)
      hud.update(world)
    },
    (_alpha, elapsedSeconds) => {
      renderer.syncWorld(world, elapsedSeconds)
      renderer.renderFrame()
    },
  )
}

bootstrap().catch((error: unknown) => {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (app) {
    app.innerHTML = `<div class="game-error">Failed to boot the game: ${error instanceof Error ? error.message : 'Unknown error'}</div>`
  }
  console.error(error)
})
