import { describe, expect, it } from 'vitest'
import {
  applyFeed,
  applyPlay,
  applySleep,
  applyWake,
  applyTimeProgress,
  canFeed,
  canPlay,
  canSleep,
  createPet,
  derivePetState,
} from './domain'

describe('pet domain', () => {
  it('clamps stats to 0..100 when applying actions', () => {
    const now = 1_000_000
    const pet = createPet({
      name: 'X',
      modelId: 'fox',
      nowMs: now,
      initial: { hunger: 95, health: 2, energy: 3 },
    })

    const fed = applyFeed({ ...pet, hunger: 60 }, now + 1)
    expect(fed.hunger).toBe(90)

    const played = applyPlay({ ...pet, hunger: 60, energy: 40, health: 95 }, now + 2)
    expect(played.energy).toBe(20)
    expect(played.hunger).toBe(45)

    const slept = applySleep({ ...pet, hunger: 60, energy: 10, health: 98 }, now + 3)
    expect(slept.energy).toBe(10)
    expect(slept.health).toBe(98)
  })

  it('applies time-based decay based on elapsed time', () => {
    const now = 1_000_000
    const pet = createPet({
      name: 'X',
      modelId: 'fox',
      nowMs: now,
      initial: { hunger: 50, health: 50, energy: 50 },
    })

    const after29s = applyTimeProgress(pet, now + 29_000)
    expect(after29s.hunger).toBe(50)
    expect(after29s.energy).toBe(50)

    const after30s = applyTimeProgress(pet, now + 30_000)
    expect(after30s.energy).toBe(49)

    const after40s = applyTimeProgress(pet, now + 40_000)
    expect(after40s.hunger).toBe(49)
  })

  it('derives states and critical condition', () => {
    const baseNow = 1_000_000
    const low = createPet({
      name: 'X',
      modelId: 'fox',
      nowMs: baseNow,
      initial: { hunger: 10, health: 10, energy: 10 },
    })
    expect(derivePetState(low).isHungry).toBe(true)
    expect(derivePetState(low).isUnhealthy).toBe(true)
    expect(derivePetState(low).isTired).toBe(true)

    const healthy = createPet({
      name: 'X',
      modelId: 'fox',
      nowMs: baseNow,
      initial: { hunger: 80, health: 80, energy: 80 },
    })
    expect(derivePetState(healthy).isHealthy).toBe(true)

    const critical = createPet({
      name: 'X',
      modelId: 'fox',
      nowMs: baseNow,
      initial: { hunger: 0, health: 0, energy: 0 },
    })
    expect(derivePetState(critical).isCritical).toBe(true)
  })

  it('blocks actions according to rules', () => {
    const now = 1_000_000
    const pet = createPet({
      name: 'X',
      modelId: 'fox',
      nowMs: now,
      initial: { hunger: 10, health: 50, energy: 90 },
    })
    expect(canSleep(pet).ok).toBe(false)
    expect(canPlay({ ...pet, hunger: 25, energy: 25 }).ok).toBe(false)
    expect(canFeed({ ...pet, hunger: 95 }).ok).toBe(false)
  })

  it('increases energy while sleeping but still decays other stats', () => {
    const now = 1_000_000
    const pet = createPet({
      name: 'X',
      modelId: 'fox',
      nowMs: now,
      initial: { hunger: 60, health: 60, energy: 10 },
    })

    const sleeping = applySleep(pet, now + 1)
    expect(sleeping.isSleeping).toBe(true)

    const after40s = applyTimeProgress(sleeping, now + 40_000 + 2)
    expect(after40s.energy).toBeGreaterThan(sleeping.energy)
    expect(after40s.hunger).toBeLessThan(sleeping.hunger)

    const awake = applyWake(after40s, now + 40_000 + 3)
    expect(awake.isSleeping).toBe(false)
    const afterAwakeTick = applyTimeProgress(awake, now + 80_000 + 4)
    expect(afterAwakeTick.energy).toBeLessThanOrEqual(awake.energy)
  })
})

