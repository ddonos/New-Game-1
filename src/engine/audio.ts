import { Howl } from 'howler'
import type { World } from '../ecs/world.ts'
import type { GameAssets } from './assets.ts'

export interface AudioController {
  update: (world: World) => void
  setPaused: (paused: boolean) => void
  dispose: () => void
}

function createSound(src: string, volume: number, pool = 4) {
  return new Howl({
    src: [src],
    volume,
    pool,
    html5: false,
  })
}

export function createAudioController(assets: GameAssets): AudioController {
  const gun = createSound(assets.staged.gunFireSfxUrl, 0.18, 6)
  const rocket = createSound(assets.staged.rocketLaunchSfxUrl, 0.28, 6)
  const impact = createSound(assets.staged.bulletHitSfxUrl, 0.2, 5)
  const explosion = createSound(assets.staged.explosionSfxUrl, 0.36, 4)
  const warning = createSound(assets.staged.warningBeepSfxUrl, 0.22, 1)
  const rotor = new Howl({
    src: [assets.staged.rotorHoverSfxUrl],
    volume: 0,
    loop: true,
    html5: false,
  })

  let rotorId: number | null = null
  let lastWarningTime = 0
  let paused = false

  return {
    update(world) {
      if (paused) {
        return
      }

      for (const cue of world.audioCues.splice(0)) {
        if (cue === 'player-fire') {
          gun.play()
        } else if (cue === 'rocket-launch') {
          rocket.play()
        } else if (cue === 'impact') {
          impact.play()
        } else if (cue === 'explosion') {
          explosion.play()
        } else if (cue === 'warning') {
          const now = performance.now()
          if (now - lastWarningTime > 1200) {
            warning.play()
            lastWarningTime = now
          }
        }
      }

      const shouldHover = world.player.takeoffStarted && !world.player.destroyed
      if (shouldHover && rotorId === null) {
        rotorId = rotor.play()
      }

      if (rotorId !== null) {
        const volume = shouldHover ? Math.min(0.24, 0.08 + world.player.hoverHeight / 120) : 0
        rotor.volume(volume, rotorId)
        if (!shouldHover && rotor.playing(rotorId)) {
          rotor.stop(rotorId)
          rotorId = null
        }
      }
    },
    setPaused(nextPaused) {
      paused = nextPaused
      if (nextPaused && rotorId !== null) {
        rotor.volume(0, rotorId)
      }
    },
    dispose() {
      gun.unload()
      rocket.unload()
      impact.unload()
      explosion.unload()
      warning.unload()
      rotor.unload()
    },
  }
}
