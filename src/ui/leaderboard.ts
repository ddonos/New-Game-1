const leaderboardKey = 'heli-vanguard-leaderboard'

export interface LeaderboardEntry {
  name: string
  score: number
  outcome: 'victory' | 'defeat'
  date: string
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(leaderboardKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((entry): entry is LeaderboardEntry => (
        typeof entry?.name === 'string' &&
        typeof entry?.score === 'number' &&
        (entry?.outcome === 'victory' || entry?.outcome === 'defeat') &&
        typeof entry?.date === 'string'
      ))
      .sort((left, right) => right.score - left.score)
      .slice(0, 10)
  } catch {
    return []
  }
}

export function saveLeaderboardEntry(entry: Omit<LeaderboardEntry, 'date'>) {
  const entries = loadLeaderboard()
  entries.push({
    ...entry,
    date: new Date().toISOString(),
  })
  localStorage.setItem(
    leaderboardKey,
    JSON.stringify(entries.sort((left, right) => right.score - left.score).slice(0, 10)),
  )
}

export function renderLeaderboardItems() {
  const entries = loadLeaderboard()
  if (entries.length === 0) {
    return '<li><span>-</span><strong>No entries</strong><em>0</em></li>'
  }

  return entries
    .slice(0, 5)
    .map((entry, index) => `<li><span>${index + 1}</span><strong>${entry.name}</strong><em>${entry.score}</em></li>`)
    .join('')
}
