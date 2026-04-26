import { useEffect, useMemo, useRef } from 'react'
import { createGame } from '../game/createGame'
import { getModel, type DirectionId, type ModelId } from '../game/models'

export type PhaserStageProps = {
  model: ModelId
  direction?: DirectionId
  heightPx?: number
}

export default function PhaserStage({
  model,
  direction,
  heightPx,
}: PhaserStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null)

  const spriteModel = useMemo(() => getModel(model), [model])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    if (typeof heightPx === 'number') host.style.height = `${heightPx}px`
    else host.style.height = '100%'

    const instance = createGame({
      parent: host,
      scene: {
        model: spriteModel,
        direction,
        heightPx: typeof heightPx === 'number' ? heightPx : 240,
        background: 0x16171d,
      },
    })

    gameRef.current = instance
    return () => instance.destroy()
  }, [spriteModel, direction, heightPx])

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

