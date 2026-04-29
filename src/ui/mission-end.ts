import { saveLeaderboardEntry } from './leaderboard.ts'

export interface MissionEndController {
  element: HTMLElement
  destroy: () => void
}

interface MissionEndOptions {
  outcome: 'victory' | 'defeat'
  score: number
  onReturnHome: () => void
}

export function createMissionEndMenu(root: HTMLElement, options: MissionEndOptions): MissionEndController {
  const element = document.createElement('div')
  element.className = 'mission-end'
  const title = options.outcome === 'victory' ? 'Victory' : 'Mission Failed'
  const message = options.outcome === 'victory'
    ? 'All hostile objects have been destroyed.'
    : 'No respawns remaining.'

  element.innerHTML = `
    <section class="mission-end__panel" role="dialog" aria-modal="true" aria-label="${title}">
      <span class="pause-menu__eyebrow">${message}</span>
      <h2>${title}</h2>
      <p>Score: <strong>${options.score}</strong></p>
      <label class="mission-end__field">
        <span>Pilot name</span>
        <input data-mission-name maxlength="16" autocomplete="off" placeholder="ACE" />
      </label>
      <div class="pause-menu__actions">
        <button class="menu-button menu-button--primary" data-mission-action="save">Save Score</button>
        <button class="menu-button" data-mission-action="home">Return Home</button>
      </div>
    </section>
  `
  root.append(element)

  const input = element.querySelector<HTMLInputElement>('[data-mission-name]')
  input?.focus()

  const saveScore = () => {
    const name = input?.value.trim() || 'ACE'
    saveLeaderboardEntry({
      name: name.toUpperCase(),
      score: options.score,
      outcome: options.outcome,
    })
  }

  element.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    const action = target.closest<HTMLElement>('[data-mission-action]')?.dataset.missionAction
    if (action === 'save') {
      saveScore()
      options.onReturnHome()
    } else if (action === 'home') {
      options.onReturnHome()
    }
  })

  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      saveScore()
      options.onReturnHome()
    }
  })

  return {
    element,
    destroy() {
      element.remove()
    },
  }
}
