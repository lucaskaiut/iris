import type { Pet } from './domain'

export type PetStore = {
  load(): Pet | null
  save(pet: Pet): void
  clear(): void
}

