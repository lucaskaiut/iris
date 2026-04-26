export type Pet = {
  name: string
  modelId: string
  hunger: number
  health: number
  energy: number
  isSleeping: boolean
  hungerAccMs: number
  energyAccMs: number
  healthAccMs: number
  createdAt: number
  updatedAt: number
  lastInteractionAt: number
}

export type PetDerivedState = {
  isHungry: boolean
  isTired: boolean
  isUnhealthy: boolean
  isHealthy: boolean
  isCritical: boolean
}

export const PET_LIMITS = {
  min: 0,
  max: 100,
} as const

export const PET_THRESHOLDS = {
  critical: 20,
  low: 50,
  ok: 80,
} as const

export const PET_ENERGY_AWAKE_INTERVAL_MS = 30_000
export const PET_HUNGER_INTERVAL_MS = 40_000
export const PET_HEALTH_INTERVAL_MS = 40_000
export const PET_SLEEP_REGEN_INTERVAL_MS = 8_000

export const PET_DECAY = {
  energyAwake: -1,
  hunger: -1,
  sleepEnergy: +1,
} as const

export const PET_HEALTH = {
  lowHunger: -2,
  lowEnergy: -2,
  sleepHungryPenalty: -2,
  sleepStarvingPenalty: -5,
} as const

export type ActionBlock = { ok: true } | { ok: false; reason: string }

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

export function getSleepEfficiency(hunger: number) {
  if (hunger <= 0) return 0
  return clamp01(hunger / 100)
}

export function canSleep(pet: Pet): ActionBlock {
  if (pet.health <= 0) return { ok: false, reason: 'Pet morto' }
  if (pet.isSleeping) return { ok: false, reason: 'Já está dormindo' }
  if (pet.energy > 80) return { ok: false, reason: 'Energia já está alta' }
  if (pet.hunger < 20) return { ok: false, reason: 'Muito faminto para dormir' }
  return { ok: true }
}

export function canPlay(pet: Pet): ActionBlock {
  if (pet.health <= 0) return { ok: false, reason: 'Pet morto' }
  if (pet.isSleeping) return { ok: false, reason: 'Não pode brincar dormindo' }
  if (pet.energy < 30) return { ok: false, reason: 'Energia muito baixa para brincar' }
  if (pet.hunger < 30) return { ok: false, reason: 'Fome muito baixa para brincar' }
  return { ok: true }
}

export function canFeed(pet: Pet): ActionBlock {
  if (pet.health <= 0) return { ok: false, reason: 'Pet morto' }
  if (pet.isSleeping) return { ok: false, reason: 'Não pode alimentar dormindo' }
  if (pet.hunger > 90) return { ok: false, reason: 'Já está alimentado demais' }
  return { ok: true }
}

export function clampStat(v: number) {
  if (Number.isNaN(v)) return PET_LIMITS.min
  return Math.min(PET_LIMITS.max, Math.max(PET_LIMITS.min, v))
}

export function clampPet(pet: Pet): Pet {
  return {
    ...pet,
    hunger: clampStat(pet.hunger),
    health: clampStat(pet.health),
    energy: clampStat(pet.energy),
  }
}

export function createPet(opts: {
  name: string
  modelId: string
  nowMs: number
  initial?: Partial<Pick<Pet, 'hunger' | 'health' | 'energy'>>
}): Pet {
  const hunger = clampStat(opts.initial?.hunger ?? 80)
  const health = clampStat(opts.initial?.health ?? 80)
  const energy = clampStat(opts.initial?.energy ?? 80)
  return {
    name: opts.name.trim() || 'Pet',
    modelId: opts.modelId,
    hunger,
    health,
    energy,
    isSleeping: false,
    hungerAccMs: 0,
    energyAccMs: 0,
    healthAccMs: 0,
    createdAt: opts.nowMs,
    updatedAt: opts.nowMs,
    lastInteractionAt: opts.nowMs,
  }
}

export function derivePetState(pet: Pet): PetDerivedState {
  const isCritical = pet.health <= 0
  const isHungry = pet.hunger <= PET_THRESHOLDS.critical
  const isTired = pet.energy <= PET_THRESHOLDS.critical
  const isUnhealthy = pet.health <= PET_THRESHOLDS.critical
  const isHealthy =
    pet.hunger > 60 && pet.energy > 60 && pet.health > 60
  return { isHungry, isTired, isUnhealthy, isHealthy, isCritical }
}

export function applyTimeProgress(pet: Pet, nowMs: number): Pet {
  if (nowMs <= pet.updatedAt) return pet

  const deltaMs = nowMs - pet.updatedAt

  let hunger = pet.hunger
  let energy = pet.energy
  let health = pet.health

  let hungerAccMs = pet.hungerAccMs + deltaMs
  let energyAccMs = pet.energyAccMs + deltaMs
  let healthAccMs = pet.healthAccMs + deltaMs

  while (hungerAccMs >= PET_HUNGER_INTERVAL_MS) {
    hungerAccMs -= PET_HUNGER_INTERVAL_MS
    hunger = clampStat(hunger + PET_DECAY.hunger)
  }

  while (true) {
    const starving = hunger <= 0
    const hungry = hunger < 20

    const { intervalMs, delta } = (() => {
      if (!pet.isSleeping) return { intervalMs: PET_ENERGY_AWAKE_INTERVAL_MS, delta: PET_DECAY.energyAwake }
      if (starving) return { intervalMs: PET_ENERGY_AWAKE_INTERVAL_MS, delta: PET_DECAY.energyAwake }
      if (hungry) return { intervalMs: PET_SLEEP_REGEN_INTERVAL_MS, delta: 0 }

      const eff = getSleepEfficiency(hunger)
      const safeEff = Math.max(0.01, eff)
      return {
        intervalMs: Math.round(PET_SLEEP_REGEN_INTERVAL_MS / safeEff),
        delta: PET_DECAY.sleepEnergy,
      }
    })()

    if (energyAccMs < intervalMs) break
    energyAccMs -= intervalMs
    energy = clampStat(energy + delta)
  }

  while (healthAccMs >= PET_HEALTH_INTERVAL_MS) {
    healthAccMs -= PET_HEALTH_INTERVAL_MS
    if (hunger < 20) health = clampStat(health + PET_HEALTH.lowHunger)
    if (energy < 20) health = clampStat(health + PET_HEALTH.lowEnergy)
    if (pet.isSleeping && hunger <= 0) health = clampStat(health + PET_HEALTH.sleepStarvingPenalty)
    else if (pet.isSleeping && hunger < 20) health = clampStat(health + PET_HEALTH.sleepHungryPenalty)
  }

  return {
    ...pet,
    hunger,
    energy,
    health,
    hungerAccMs,
    energyAccMs,
    healthAccMs,
    updatedAt: nowMs,
  }
}

export function applySleep(pet: Pet, nowMs: number): Pet {
  const block = canSleep(pet)
  if (!block.ok) return pet

  return clampPet({
    ...pet,
    hunger: pet.hunger - 10,
    isSleeping: true,
    updatedAt: nowMs,
    lastInteractionAt: nowMs,
  })
}

export function applyWake(pet: Pet, nowMs: number): Pet {
  if (!pet.isSleeping) return pet
  return {
    ...pet,
    isSleeping: false,
    updatedAt: nowMs,
    lastInteractionAt: nowMs,
  }
}

export function applyPlay(pet: Pet, nowMs: number): Pet {
  const block = canPlay(pet)
  if (!block.ok) return pet

  const lowEnergy = pet.energy < 50
  const lowHunger = pet.hunger < 50

  const energyCost = 20
  const healthDelta = lowEnergy || lowHunger ? 0 : +10

  return clampPet({
    ...pet,
    energy: pet.energy - energyCost,
    hunger: pet.hunger - 15,
    health: pet.health + healthDelta,
    updatedAt: nowMs,
    lastInteractionAt: nowMs,
  })
}

export function applyFeed(pet: Pet, nowMs: number): Pet {
  const block = canFeed(pet)
  if (!block.ok) return pet

  const over70 = pet.hunger > 70
  const healthDelta = over70 ? -5 : 0

  return clampPet({
    ...pet,
    hunger: pet.hunger + 30,
    energy: pet.energy + 5,
    health: pet.health + healthDelta,
    updatedAt: nowMs,
    lastInteractionAt: nowMs,
  })
}

