import { renderLeaderboardItems } from './leaderboard.ts'

export type WorldId = 'forest-valley' | 'desert-front' | 'arctic-line' | 'island-siege'

export interface MenuController {
  element: HTMLElement
  destroy: () => void
}

interface MenuOptions {
  onPlay: (worldId: WorldId) => void
  onInteract?: () => void
}

const worlds: Array<{
  id: WorldId
  name: string
  status: 'ready' | 'locked'
  biome: string
}> = [
  { id: 'forest-valley', name: 'Forest Valley', status: 'ready', biome: 'Playable' },
  { id: 'desert-front', name: 'Desert Front', status: 'locked', biome: 'Coming soon' },
  { id: 'arctic-line', name: 'Arctic Line', status: 'locked', biome: 'Coming soon' },
  { id: 'island-siege', name: 'Island Siege', status: 'locked', biome: 'Coming soon' },
]

function renderWorldCards() {
  return worlds
    .map((world) => `
      <button class="menu-world menu-world--${world.id}" data-world="${world.id}" ${world.status === 'locked' ? 'disabled' : ''}>
        <span class="menu-world__image" aria-hidden="true"></span>
        <span class="menu-world__label">
          <strong>${world.name}</strong>
          <span>${world.biome}</span>
        </span>
      </button>
    `)
    .join('')
}

export function createMainMenu(root: HTMLElement, options: MenuOptions): MenuController {
  const element = document.createElement('div')
  element.className = 'menu'
  element.innerHTML = `
    <div class="menu__backdrop"></div>
    <main class="menu__layout">
      <nav class="menu__nav" aria-label="Main menu">
        <button class="menu-button menu-button--primary" data-menu-action="play">Play</button>
        <button class="menu-button" data-menu-action="leaderboard">Leaderboard</button>
        <button class="menu-button" data-menu-action="how-to-play">How to Play</button>
      </nav>

      <section class="menu__content" data-menu-content="worlds" hidden>
        <h2>Select Battlefield</h2>
        <div class="menu-worlds">${renderWorldCards()}</div>
      </section>

      <section class="menu__content" data-menu-content="leaderboard" hidden>
        <h2>Leaderboard</h2>
        <ol class="menu-ranks">
          ${renderLeaderboardItems()}
        </ol>
      </section>

      <section class="menu__content" data-menu-content="how-to-play" hidden>
        <h2>How to Play</h2>
        <div class="menu-briefing">
          <p><strong>WASD</strong> moves the helicopter after takeoff.</p>
          <p><strong>Q / E</strong> rotates your heading.</p>
          <p><strong>Space</strong> fires unlimited rounds.</p>
          <p><strong>Esc</strong> pauses the mission.</p>
        </div>
      </section>
    </main>
  `
  root.append(element)

  const showContent = (name: string) => {
    element.querySelectorAll<HTMLElement>('[data-menu-content]').forEach((panel) => {
      panel.hidden = panel.dataset.menuContent !== name
    })
    element.querySelectorAll<HTMLElement>('[data-menu-action]').forEach((button) => {
      button.classList.toggle('menu-button--primary', button.dataset.menuAction === (name === 'worlds' ? 'play' : name))
    })
  }

  element.addEventListener('click', (event) => {
    options.onInteract?.()
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    const action = target.closest<HTMLElement>('[data-menu-action]')?.dataset.menuAction
    if (action === 'play') {
      showContent('worlds')
      return
    }
    if (action === 'leaderboard' || action === 'how-to-play') {
      showContent(action)
      return
    }

    const worldButton = target.closest<HTMLButtonElement>('[data-world]')
    if (worldButton && !worldButton.disabled) {
      options.onPlay(worldButton.dataset.world as WorldId)
    }
  })

  return {
    element,
    destroy() {
      element.remove()
    },
  }
}
