import { Howl } from 'howler'
import menuMusicUrl from '../assets/audio/menu-music.mp3'
import uiClickUrl from '../assets/audio/ui-click.mp3'

export interface MenuAudioController {
  start: () => void
  stop: () => void
  click: () => void
  dispose: () => void
}

export function createMenuAudioController(): MenuAudioController {
  const music = new Howl({
    src: [menuMusicUrl],
    loop: true,
    volume: 0.34,
    html5: true,
  })
  const click = new Howl({
    src: [uiClickUrl],
    volume: 0.42,
    pool: 4,
  })

  let started = false

  return {
    start() {
      if (!started) {
        music.play()
        started = true
      }
    },
    stop() {
      music.stop()
      started = false
    },
    click() {
      click.play()
    },
    dispose() {
      music.unload()
      click.unload()
    },
  }
}
