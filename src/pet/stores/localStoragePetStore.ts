import { clampPet, normalizeInventory, type Pet, type PetInventory } from '../domain'
import type { PetStore } from '../store'

const STORAGE_KEY = 'iris.pet.v1'

type LegacyPetV1 = Omit<Pet, 'health' | 'coins'> & {
  happiness?: number
  health?: number
  coins?: number
}
type LegacyPetV2 = LegacyPetV1 & {
  isSleeping?: boolean
  hungerAccMs?: number
  energyAccMs?: number
  healthAccMs?: number
}

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

export function normalizePet(v: LegacyPetV2): Pet {
  const health =
    typeof v.health === 'number'
      ? v.health
      : typeof v.happiness === 'number'
        ? v.happiness
        : 80
  const coins = typeof v.coins === 'number' ? v.coins : 0
  const isSleeping = typeof v.isSleeping === 'boolean' ? v.isSleeping : false
  const hungerAccMs = typeof v.hungerAccMs === 'number' ? v.hungerAccMs : 0
  const energyAccMs = typeof v.energyAccMs === 'number' ? v.energyAccMs : 0
  const healthAccMs = typeof v.healthAccMs === 'number' ? v.healthAccMs : 0
  const rawInv = (v as { inventory?: unknown }).inventory
  const inventory =
    rawInv && typeof rawInv === 'object'
      ? normalizeInventory(rawInv as Partial<PetInventory>)
      : normalizeInventory(undefined)
  return clampPet({
    name: v.name,
    modelId: v.modelId,
    hunger: v.hunger,
    health,
    energy: v.energy,
    coins,
    isSleeping,
    inventory,
    hungerAccMs,
    energyAccMs,
    healthAccMs,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    lastInteractionAt: v.lastInteractionAt,
  })
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

