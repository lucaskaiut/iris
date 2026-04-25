import { getAnimationUrl } from './assets'

export type ModelId = string

export type AnimationId = string

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

const FOX_BASE = {
  frameWidth: 32,
  frameHeight: 32,
  directionRows: {
    down: 0,
    up: 1,
    right: 3,
    left: 2,
  } satisfies Record<DirectionId, number>,
  frameRate: 12,
  repeat: -1,
  scale: 3,
  speedPxPerSec: 90,
  paddingPx: 16,
}

const FOX_COLUMNS_BY_ANIMATION: Record<string, number> = {
  idle: 4,
  hurt: 4,
  run: 6,
  walk: 6,
}

const GREAT_DANE_BASE = {
  frameWidth: 100,
  frameHeight: 100,
  directionRows: {
    down: 0,
    up: 0,
    right: 0,
    left: 0,
  } satisfies Record<DirectionId, number>,
  frameRate: 10,
  repeat: -1,
  scale: 2,
  speedPxPerSec: 140,
  paddingPx: 16,
}

const GREAT_DANE_COLUMNS_BY_ANIMATION: Record<string, number> = {
  bark: 3,
  idle: 10,
  itching: 2,
  licking1: 4,
  licking2: 4,
  'lying-down': 7,
  run: 8,
  sitting: 1,
  spleeping: 1,
  stretching: 10,
  walk: 8,
}

export function getSpriteSheetSpec(model: ModelId, animation: AnimationId): SpriteSheetSpec {
  const src = getAnimationUrl(model, animation)
  if (!src) {
    throw new Error(`Spritesheet não encontrado: ${model}/${animation}.png`)
  }

  if (model === 'fox') {
    const columns = FOX_COLUMNS_BY_ANIMATION[animation] ?? 6
    return {
      model,
      animation,
      src,
      frameWidth: FOX_BASE.frameWidth,
      frameHeight: FOX_BASE.frameHeight,
      columns,
      directionRows: FOX_BASE.directionRows,
      frameRate: FOX_BASE.frameRate,
      repeat: FOX_BASE.repeat,
      scale: FOX_BASE.scale,
      speedPxPerSec: FOX_BASE.speedPxPerSec,
      paddingPx: FOX_BASE.paddingPx,
    }
  }

  if (model === 'great_dane') {
    const columns = GREAT_DANE_COLUMNS_BY_ANIMATION[animation] ?? 1
    return {
      model,
      animation,
      src,
      frameWidth: GREAT_DANE_BASE.frameWidth,
      frameHeight: GREAT_DANE_BASE.frameHeight,
      columns,
      directionRows: GREAT_DANE_BASE.directionRows,
      frameRate: GREAT_DANE_BASE.frameRate,
      repeat: GREAT_DANE_BASE.repeat,
      scale: GREAT_DANE_BASE.scale,
      speedPxPerSec: GREAT_DANE_BASE.speedPxPerSec,
      paddingPx: GREAT_DANE_BASE.paddingPx,
    }
  }

  throw new Error(`Modelo não suportado: ${model}`)
}
