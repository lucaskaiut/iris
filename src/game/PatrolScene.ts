import Phaser from 'phaser'
import type { DirectionId, ResolvedSpriteSheetSpec, SpriteModel } from './models'
import { resolveSheetDirection } from './models'

export type PatrolSceneConfig = {
  model: SpriteModel
  direction?: DirectionId
  heightPx: number
  background: number
}

export class PatrolScene extends Phaser.Scene {
  private readonly cfg: PatrolSceneConfig
  private sprite?: Phaser.GameObjects.Sprite
  private flipForLeft = false

  constructor(cfg: PatrolSceneConfig) {
    super('patrol')
    this.cfg = cfg
  }

  preload() {
    const sheet = this.cfg.model.getSheet()
    this.load.spritesheet(`${sheet.model}:${sheet.animation}`, sheet.src, {
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
    })
  }

  create() {
    const sheet = this.cfg.model.getSheet()
    const { background } = this.cfg
    this.cameras.main.setBackgroundColor(background)

    this.flipForLeft = sheet.directionRows.left === sheet.directionRows.right

    const w = this.scale.width
    const h = this.scale.height
    const x = Math.floor(w / 2)
    const y = Math.floor(h / 2)

    const direction: DirectionId = this.cfg.direction ?? 'down'

    const key = `${sheet.model}:${sheet.animation}`
    const animKey = `${key}:${direction}:anim`
    if (!this.anims.exists(animKey)) {
      const resolved: ResolvedSpriteSheetSpec = resolveSheetDirection(sheet, direction)
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(key, {
          start: resolved.startFrame,
          end: resolved.endFrame,
        }),
        frameRate: sheet.frameRate,
        repeat: sheet.repeat,
      })
    }

    const initialResolved = resolveSheetDirection(sheet, direction)
    this.sprite = this.add.sprite(x, y, key, initialResolved.startFrame)
    this.sprite.setScale(sheet.scale)
    this.applyFacing(direction)
    this.sprite.play(animKey)
  }

  private applyFacing(face: DirectionId) {
    if (!this.sprite) return
    if (!this.flipForLeft) {
      this.sprite.setFlipX(false)
      return
    }
    this.sprite.setFlipX(face === 'left')
  }
}
