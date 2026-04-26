import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  applyFeed,
  applyPlay,
  applyPlayResult,
  applySleep,
  applyWake,
  applyTimeProgress,
  canFeed,
  canPlay,
  canSleep,
  clampPet,
  createPet,
  derivePetState,
  type Pet,
  type PlayMiniGameResult,
} from './domain'
import { createLocalStoragePetStore } from './stores/localStoragePetStore'
import type { PetStore } from './store'

export type UsePetOptions = {
  defaultName?: string
  defaultModelId: string
  store?: PetStore
  tickMs?: number
}

export type UsePetResult = {
  pet: Pet
  derived: ReturnType<typeof derivePetState>
  isCritical: boolean
  isSleeping: boolean
  canFeed: ReturnType<typeof canFeed>
  canPlay: ReturnType<typeof canPlay>
  canSleep: ReturnType<typeof canSleep>
  setName(name: string): void
  setModelId(modelId: string): void
  feed(): void
  play(): void
  applyPlayMiniGameResult(result: PlayMiniGameResult): { ok: true } | { ok: false; reason: string }
  sleep(): void
  wake(): void
  reset(): void
  debugSet?(patch: Partial<Pick<Pet, 'hunger' | 'health' | 'energy' | 'isSleeping'>>): void
}

export function usePet(opts: UsePetOptions): UsePetResult {
  const store = useMemo(() => opts.store ?? createLocalStoragePetStore(), [opts.store])
  const tickMs = opts.tickMs ?? 2_000

  const [pet, setPet] = useState<Pet>(() => {
    const now = Date.now()
    const loaded = store.load()
    const base =
      loaded ??
      createPet({
        name: opts.defaultName ?? 'Pet',
        modelId: opts.defaultModelId,
        nowMs: now,
      })
    const decayed = applyTimeProgress(base, now)
    if (!loaded) store.save(decayed)
    return decayed
  })

  const derived = useMemo(() => derivePetState(pet), [pet])

  const persistAndSet = useCallback(
    (next: Pet) => {
      setPet(next)
      store.save(next)
    },
    [store],
  )

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now()
      setPet((prev) => {
        const next = applyTimeProgress(prev, now)
        if (next === prev) return prev
        store.save(next)
        return next
      })
    }, tickMs)
    return () => window.clearInterval(id)
  }, [store, tickMs])

  const setName = useCallback(
    (name: string) => {
      const now = Date.now()
      persistAndSet({
        ...pet,
        name: name.trim() || 'Pet',
        updatedAt: now,
      })
    },
    [persistAndSet, pet],
  )

  const setModelId = useCallback(
    (modelId: string) => {
      const now = Date.now()
      persistAndSet({
        ...pet,
        modelId,
        updatedAt: now,
      })
    },
    [persistAndSet, pet],
  )

  const feed = useCallback(() => {
    if (derivePetState(pet).isCritical) return
    const now = Date.now()
    const decayed = applyTimeProgress(pet, now)
    const next = applyFeed(decayed, now)
    persistAndSet(next)
  }, [persistAndSet, pet])

  const play = useCallback(() => {
    if (derivePetState(pet).isCritical) return
    const now = Date.now()
    const decayed = applyTimeProgress(pet, now)
    const next = applyPlay(decayed, now)
    persistAndSet(next)
  }, [persistAndSet, pet])

  const applyPlayMiniGameResultCb = useCallback(
    (result: PlayMiniGameResult) => {
      if (derivePetState(pet).isCritical) return { ok: false, reason: 'Pet morto' } as const
      const now = Date.now()
      const applied = applyPlayResult(pet, result, now)
      if (!applied.ok) return applied
      persistAndSet(applied.pet)
      return { ok: true } as const
    },
    [persistAndSet, pet],
  )

  const sleep = useCallback(() => {
    if (derivePetState(pet).isCritical) return
    const now = Date.now()
    const decayed = applyTimeProgress(pet, now)
    const next = applySleep(decayed, now)
    persistAndSet(next)
  }, [persistAndSet, pet])

  const wake = useCallback(() => {
    const now = Date.now()
    const decayed = applyTimeProgress(pet, now)
    const next = applyWake(decayed, now)
    persistAndSet(next)
  }, [persistAndSet, pet])

  const reset = useCallback(() => {
    const now = Date.now()
    const next = createPet({
      name: pet.name,
      modelId: pet.modelId,
      nowMs: now,
    })
    persistAndSet(next)
  }, [persistAndSet, pet.modelId, pet.name])

  const debugSet = useCallback(
    (patch: Partial<Pick<Pet, 'hunger' | 'health' | 'energy' | 'isSleeping'>>) => {
      const now = Date.now()
      persistAndSet(
        clampPet({
          ...pet,
          ...patch,
          hungerAccMs: 0,
          energyAccMs: 0,
          healthAccMs: 0,
          updatedAt: now,
          lastInteractionAt: now,
        }),
      )
    },
    [persistAndSet, pet],
  )

  return {
    pet,
    derived,
    isCritical: derived.isCritical,
    isSleeping: pet.isSleeping,
    canFeed: canFeed(pet),
    canPlay: canPlay(pet),
    canSleep: canSleep(pet),
    setName,
    setModelId,
    feed,
    play,
    applyPlayMiniGameResult: applyPlayMiniGameResultCb,
    sleep,
    wake,
    reset,
    debugSet,
  }
}

