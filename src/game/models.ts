import { getAnimationUrl } from './assets'

export type ModelId = string

export type AnimationId = string

export type DirectionId = 'down' | 'left' | 'right' | 'up'

export type SpriteModel = {
  id: ModelId
  hasAnimation(animation: AnimationId): boolean
  getDefaultAnimation(): AnimationId
  getSheet(animation?: AnimationId): SpriteSheetSpec
}

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

type SpriteModelBaseSpec = Omit<SpriteSheetSpec, 'model' | 'animation' | 'src' | 'columns'>

class AssetBackedSpriteModel implements SpriteModel {
  public readonly id: ModelId
  private readonly base: SpriteModelBaseSpec
  private readonly columnsByAnimation: Record<string, number>
  private readonly defaultColumns: number
  private readonly defaultAnimation: AnimationId

  constructor(opts: {
    id: ModelId
    base: SpriteModelBaseSpec
    columnsByAnimation: Record<string, number>
    defaultColumns: number
    defaultAnimation: AnimationId
  }) {
    this.id = opts.id
    this.base = opts.base
    this.columnsByAnimation = opts.columnsByAnimation
    this.defaultColumns = opts.defaultColumns
    this.defaultAnimation = opts.defaultAnimation
  }

  hasAnimation(animation: AnimationId) {
    return Boolean(getAnimationUrl(this.id, animation))
  }

  getDefaultAnimation() {
    if (this.hasAnimation(this.defaultAnimation)) return this.defaultAnimation
    if (this.hasAnimation('idle')) return 'idle'
    return this.defaultAnimation
  }

  getSheet(animation?: AnimationId): SpriteSheetSpec {
    const resolvedAnimation = animation ?? this.getDefaultAnimation()
    const src = getAnimationUrl(this.id, resolvedAnimation)
    if (!src) {
      throw new Error(`Spritesheet não encontrado: ${this.id}/${resolvedAnimation}.png`)
    }
    const columns = this.columnsByAnimation[resolvedAnimation] ?? this.defaultColumns
    return {
      model: this.id,
      animation: resolvedAnimation,
      src,
      columns,
      ...this.base,
    }
  }
}

const FOX_MODEL: SpriteModel = new AssetBackedSpriteModel({
  id: 'fox',
  base: {
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
  },
  columnsByAnimation: { idle: 4, hurt: 4, run: 6, walk: 6 },
  defaultColumns: 6,
  defaultAnimation: 'idle',
})

const GREAT_DANE_MODEL: SpriteModel = new AssetBackedSpriteModel({
  id: 'great_dane',
  base: {
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
  },
  columnsByAnimation: {
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
  },
  defaultColumns: 1,
  defaultAnimation: 'idle',
})

const MODEL_REGISTRY: Record<string, SpriteModel> = {
  [FOX_MODEL.id]: FOX_MODEL,
  [GREAT_DANE_MODEL.id]: GREAT_DANE_MODEL,
}

export function getModel(modelId: ModelId): SpriteModel {
  const model = MODEL_REGISTRY[modelId]
  if (!model) throw new Error(`Modelo não registrado: ${modelId}`)
  return model
}
