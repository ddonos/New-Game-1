import type { MapDefinition } from '../../game/types.ts'
import { forestValleyMap } from './forest-valley.ts'

const maps: Record<string, MapDefinition> = {
  [forestValleyMap.id]: forestValleyMap,
}

export function getMapDefinition(id: string): MapDefinition {
  const map = maps[id]
  if (!map) {
    throw new Error(`Unknown map: ${id}`)
  }

  return map
}

export const registeredMaps = Object.values(maps)
