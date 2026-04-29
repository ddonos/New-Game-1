import './style.css'
import { getMapDefinition } from './content/maps/index.ts'
import { createFixedStepLoop } from './engine/loop.ts'
import { createAudioController } from './engine/audio.ts'
import { createMenuAudioController } from './engine/menu-audio.ts'
import { loadAssets } from './engine/assets.ts'
import { createInput } from './engine/input.ts'
import { createRenderer } from './engine/renderer.ts'
import { updateCombat } from './ecs/systems/combat.ts'
import { updateMovement } from './ecs/systems/movement.ts'
import { createWorld, refreshHud } from './ecs/world.ts'
import { loadMap } from './game/map-loader.ts'
import { initializePlayer, updatePlayer } from './game/player.ts'
import { createHud } from './ui/hud.ts'
import { createMainMenu, type WorldId } from './ui/menu.ts'
import { createMissionEndMenu, type MissionEndController } from './ui/mission-end.ts'
import { createPauseMenu } from './ui/pause-menu.ts'

async function bootstrap() {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) {
    throw new Error('App root not found')
  }

  app.innerHTML = `
    <div class="game-shell">
      <div class="game-stage" hidden></div>
    </div>
  `

  const stage = app.querySelector<HTMLElement>('.game-stage')

  if (!stage) {
    throw new Error('Game shell failed to mount')
  }

  let gameStarted = false
  let menuAudio = createMenuAudioController()
  let menu = createMainMenu(app.querySelector<HTMLElement>('.game-shell') ?? app, {
    onPlay: (worldId) => {
      void startGame(worldId)
    },
    onInteract: () => {
      menuAudio.start()
      menuAudio.click()
    },
  })
  menuAudio.start()

  const showHome = () => {
    stage.hidden = true
    stage.innerHTML = ''
    gameStarted = false
    menuAudio.dispose()
    menuAudio = createMenuAudioController()
    menu = createMainMenu(app.querySelector<HTMLElement>('.game-shell') ?? app, {
      onPlay: (worldId) => {
        void startGame(worldId)
      },
      onInteract: () => {
        menuAudio.start()
        menuAudio.click()
      },
    })
    menuAudio.start()
  }

  const startGame = async (worldId: WorldId) => {
    if (gameStarted || worldId !== 'forest-valley') {
      return
    }

    gameStarted = true
    menuAudio.stop()
    menu.destroy()
    stage.hidden = false
    stage.innerHTML = '<div class="game-loading" data-loading>Loading Forest Valley...</div>'

    const loading = stage.querySelector<HTMLElement>('[data-loading]')
    const world = createWorld()
    const input = createInput()
    const renderer = createRenderer(stage)
    const hud = createHud(stage)
    const assets = await loadAssets()
    const audio = createAudioController(assets)
    const map = getMapDefinition(worldId)
    let paused = false
    let escapeWasDown = false
    let missionEndMenu: MissionEndController | null = null

    initializePlayer(world, renderer.scene, assets, map.playerSpawn)
    loadMap(world, renderer, assets, map)
    refreshHud(world)
    hud.update(world)
    loading?.remove()

    const cleanupAndReturnHome = () => {
      loop.stop()
      input.dispose()
      audio.dispose()
      renderer.dispose()
      pauseMenu.destroy()
      missionEndMenu?.destroy()
      showHome()
    }

    const pauseMenu = createPauseMenu(stage, {
      onInteract() {
        menuAudio.click()
      },
      onResume() {
        paused = false
        audio.setPaused(false)
        pauseMenu.setVisible(false)
      },
      onReturnHome() {
        cleanupAndReturnHome()
      },
    })

    const loop = createFixedStepLoop(
      (deltaSeconds) => {
        const inputState = input.getState()
        if (inputState.pause && !escapeWasDown) {
          paused = !paused
          audio.setPaused(paused)
          pauseMenu.update(world)
          pauseMenu.setVisible(paused)
        }
        escapeWasDown = inputState.pause

        if (paused) {
          return
        }

        updatePlayer(world, inputState, deltaSeconds)
        updateMovement(world, deltaSeconds)
        updateCombat(world, deltaSeconds)
        audio.update(world)
        hud.update(world)

        if (world.missionStatus !== 'playing' && !missionEndMenu) {
          paused = true
          audio.setPaused(true)
          pauseMenu.setVisible(false)
          missionEndMenu = createMissionEndMenu(stage, {
            outcome: world.missionStatus,
            score: world.score,
            onReturnHome: cleanupAndReturnHome,
          })
        }
      },
      (_alpha, elapsedSeconds) => {
        renderer.syncWorld(world, elapsedSeconds)
        renderer.renderFrame()
      },
    )
  }
}

bootstrap().catch((error: unknown) => {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (app) {
    app.innerHTML = `<div class="game-error">Failed to boot the game: ${error instanceof Error ? error.message : 'Unknown error'}</div>`
  }
  console.error(error)
})
