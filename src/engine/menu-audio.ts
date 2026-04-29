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

  let playId: number | null = null

  music.on('playerror', (id) => {
    if (id === playId) {
      playId = null
    }
  })

  music.on('end', () => {
    playId = null
  })

  return {
    start() {
      if (playId === null || !music.playing(playId)) {
        playId = music.play()
      }
    },
    stop() {
      music.stop()
      playId = null
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
