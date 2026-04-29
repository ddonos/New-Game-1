import type { World } from '../ecs/world.ts'

export interface PauseMenuController {
  element: HTMLElement
  setVisible: (visible: boolean) => void
  update: (world: World) => void
  destroy: () => void
}

interface PauseMenuOptions {
  onInteract?: () => void
  onResume: () => void
  onReturnHome: () => void
}

export function createPauseMenu(root: HTMLElement, options: PauseMenuOptions): PauseMenuController {
  const element = document.createElement('div')
  element.className = 'pause-menu'
  element.hidden = true
  element.innerHTML = `
    <section class="pause-menu__panel" role="dialog" aria-modal="true" aria-label="Paused">
      <span class="pause-menu__eyebrow">Mission Paused</span>
      <h2>Forest Valley</h2>
      <div class="pause-menu__stats">
        <div class="hud__chip"><span class="hud__label">HP</span><strong data-pause="hp">100</strong></div>
        <div class="hud__chip"><span class="hud__label">Respawns</span><strong class="hud__hearts" data-pause="respawns">&hearts;&hearts;</strong></div>
        <div class="hud__chip"><span class="hud__label">Score</span><strong data-pause="score">0</strong></div>
      </div>
      <div class="pause-menu__actions">
        <button class="menu-button menu-button--primary" data-pause-action="resume">Resume</button>
        <button class="menu-button" data-pause-action="home">Return Home</button>
      </div>
    </section>
  `
  root.append(element)

  const hp = element.querySelector<HTMLElement>('[data-pause="hp"]')
  const respawns = element.querySelector<HTMLElement>('[data-pause="respawns"]')
  const score = element.querySelector<HTMLElement>('[data-pause="score"]')

  if (!hp || !respawns || !score) {
    throw new Error('Pause menu mount failed')
  }

  element.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    const action = target.closest<HTMLElement>('[data-pause-action]')?.dataset.pauseAction
    if (action) {
      options.onInteract?.()
    }
    if (action === 'resume') {
      options.onResume()
    } else if (action === 'home') {
      options.onReturnHome()
    }
  })

  return {
    element,
    setVisible(visible) {
      element.hidden = !visible
    },
    update(world) {
      hp.textContent = `${world.hud.hp}`
      respawns.textContent = '\u2665'.repeat(world.hud.respawns)
      score.textContent = `${world.hud.score}`
    },
    destroy() {
      element.remove()
    },
  }
}
