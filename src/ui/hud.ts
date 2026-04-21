import type { World } from '../ecs/world.ts'

export interface HudController {
  element: HTMLElement
  update: (world: World) => void
}

export function createHud(root: HTMLElement): HudController {
  const element = document.createElement('div')
  element.className = 'hud'
  element.innerHTML = `
    <div class="hud__row">
      <div class="hud__chip"><span class="hud__label">HP</span><strong data-hud="hp">100</strong></div>
      <div class="hud__chip"><span class="hud__label">Ammo</span><strong data-hud="ammo">200</strong></div>
      <div class="hud__chip"><span class="hud__label">Score</span><strong data-hud="score">0</strong></div>
    </div>
    <div class="hud__hint">WASD move, Q/E rotate, SPACE fire</div>
  `
  root.append(element)

  const hp = element.querySelector<HTMLElement>('[data-hud="hp"]')
  const ammo = element.querySelector<HTMLElement>('[data-hud="ammo"]')
  const score = element.querySelector<HTMLElement>('[data-hud="score"]')

  if (!hp || !ammo || !score) {
    throw new Error('HUD mount failed')
  }

  return {
    element,
    update(world) {
      hp.textContent = `${world.hud.hp}`
      ammo.textContent = `${world.hud.ammo}`
      score.textContent = `${world.hud.score}`
    },
  }
}
