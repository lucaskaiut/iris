export type AnimationId = 'walk'

export type ModelId = 'fox'

export type DirectionId = 'down' | 'left' | 'right' | 'up'

export type SpriteSheetSpec = {
  model: ModelId
  animation: AnimationId
  src: string
  frameWidth: number
  frameHeight: number
  columns: number
  directionRows: Record<DirectionId, number>
  frameRate: number
  repeat: number
  scale: number
  speedPxPerSec: number
  paddingPx: number
}

export type ResolvedSpriteSheetSpec = Omit<SpriteSheetSpec, 'directionRows'> & {
  startFrame: number
  endFrame: number
  direction: DirectionId
}

export function resolveSheetDirection(
  sheet: SpriteSheetSpec,
  direction: DirectionId,
): ResolvedSpriteSheetSpec {
  const row = sheet.directionRows[direction]
  const startFrame = row * sheet.columns
  const endFrame = startFrame + sheet.columns - 1
  return { ...sheet, direction, startFrame, endFrame }
}

export const SPRITESHEETS: Record<ModelId, Record<AnimationId, SpriteSheetSpec>> = {
  fox: {
    walk: {
      model: 'fox',
      animation: 'walk',
      src: new URL('../assets/models/fox/walk.png', import.meta.url).toString(),
      frameWidth: 32,
      frameHeight: 32,
      columns: 6,
      directionRows: {
        down: 0,
        up: 1,
        right: 2,
        left: 3,
      },
      frameRate: 12,
      repeat: -1,
      scale: 3,
      speedPxPerSec: 90,
      paddingPx: 16,
    },
  },
}

