import { clampPet, type Pet } from '../domain'
import type { PetStore } from '../store'

const STORAGE_KEY = 'iris.pet.v1'

type LegacyPetV1 = Omit<Pet, 'health'> & { happiness?: number; health?: number }
type LegacyPetV2 = LegacyPetV1 & { isSleeping?: boolean }

function isLegacyShape(v: unknown): v is LegacyPetV1 {
  if (!v || typeof v !== 'object') return false
  const obj = v as Record<string, unknown>
  return (
    typeof obj.name === 'string' &&
    typeof obj.modelId === 'string' &&
    typeof obj.hunger === 'number' &&
    typeof obj.energy === 'number' &&
    typeof obj.createdAt === 'number' &&
    typeof obj.updatedAt === 'number' &&
    typeof obj.lastInteractionAt === 'number'
  )
}

function normalizePet(v: LegacyPetV2): Pet {
  const health =
    typeof v.health === 'number'
      ? v.health
      : typeof v.happiness === 'number'
        ? v.happiness
        : 80
  const isSleeping = typeof v.isSleeping === 'boolean' ? v.isSleeping : false
  return clampPet({ ...v, health, isSleeping } as Pet)
}

export function createLocalStoragePetStore(opts?: { key?: string }): PetStore {
  const key = opts?.key ?? STORAGE_KEY
  return {
    load() {
      if (typeof window === 'undefined') return null
      try {
        const raw = window.localStorage.getItem(key)
        if (!raw) return null
        const parsed: unknown = JSON.parse(raw)
        if (!isLegacyShape(parsed)) return null
        return normalizePet(parsed)
      } catch {
        return null
      }
    },
    save(pet) {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(key, JSON.stringify(pet))
    },
    clear() {
      if (typeof window === 'undefined') return
      window.localStorage.removeItem(key)
    },
  }
}

