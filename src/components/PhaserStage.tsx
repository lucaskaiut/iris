import { useEffect, useMemo, useRef } from 'react'
import { createGame } from '../game/createGame'
import { getSpriteSheetSpec, type AnimationId, type DirectionId, type ModelId } from '../game/models'

export type PhaserStageProps = {
  model?: ModelId
  animation?: AnimationId
  direction?: DirectionId
  moveDir?: -1 | 0 | 1
  patrolWidthRatio?: number
  heightPx?: number
}

export default function PhaserStage({
  model = 'fox',
  animation = 'walk',
  direction,
  moveDir = 0,
  patrolWidthRatio = 0.6,
  heightPx = 240,
}: PhaserStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null)

  const sheet = useMemo(() => getSpriteSheetSpec(model, animation), [model, animation])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    host.style.height = `${heightPx}px`

    const instance = createGame({
      parent: host,
      scene: {
        sheet,
        direction,
        patrolWidthRatio,
        heightPx,
        background: 0x16171d,
      },
    })

    gameRef.current = instance
    return () => instance.destroy()
  }, [sheet, direction, patrolWidthRatio, heightPx])

  useEffect(() => {
    const instance = gameRef.current
    if (!instance) return
    instance.game.events.emit('move', moveDir)
  }, [moveDir])

  return (
    <div
      ref={hostRef}
      style={{ width: '60vw', maxWidth: 900, minWidth: 320, height: heightPx }}
    />
  )
}

