import { useEffect, useMemo, useRef } from 'react'
import { createGame } from '../game/createGame'
import { getModel, type DirectionId, type ModelId } from '../game/models'
import type { StarCatchFinishedPayload } from '../game/StarCatchScene'

export type PhaserStageProps = {
  model: ModelId
  direction?: DirectionId
  heightPx?: number
  mode?: 'idle' | 'play-minigame'
  onMiniGameFinished?(payload: StarCatchFinishedPayload): void
  shouldAbortMiniGame?(): boolean
}

export default function PhaserStage({
  model,
  direction,
  heightPx,
  mode = 'idle',
  onMiniGameFinished,
  shouldAbortMiniGame,
}: PhaserStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null)
  const onFinishedRef = useRef<PhaserStageProps['onMiniGameFinished']>(onMiniGameFinished)
  const shouldAbortRef = useRef<PhaserStageProps['shouldAbortMiniGame']>(shouldAbortMiniGame)

  const spriteModel = useMemo(() => getModel(model), [model])

  // Evita recriar o Phaser.Game a cada re-render do React (ex.: tick do usePet()).
  // As refs garantem que a cena sempre usa os callbacks mais recentes.
  useEffect(() => {
    onFinishedRef.current = onMiniGameFinished
  }, [onMiniGameFinished])

  useEffect(() => {
    shouldAbortRef.current = shouldAbortMiniGame
  }, [shouldAbortMiniGame])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    if (typeof heightPx === 'number') host.style.height = `${heightPx}px`
    else host.style.height = '100%'

    const instance = createGame({
      parent: host,
      scene: {
        ...(mode === 'play-minigame'
          ? {
              model: spriteModel,
              heightPx: typeof heightPx === 'number' ? heightPx : 240,
              background: 0x16171d,
              durationSec: 30,
              onFinished: (payload: StarCatchFinishedPayload) => {
                onFinishedRef.current?.(payload)
              },
              shouldAbort: () => Boolean(shouldAbortRef.current?.()),
            }
          : {
              model: spriteModel,
              direction,
              heightPx: typeof heightPx === 'number' ? heightPx : 240,
              background: 0x16171d,
            }),
      },
    })

    gameRef.current = instance
    return () => instance.destroy()
  }, [spriteModel, direction, heightPx, mode])

  return (
    <div
      ref={hostRef}
      style={{
        width: '100%',
        height: typeof heightPx === 'number' ? heightPx : '100%',
        minWidth: 320,
      }}
    />
  )
}

