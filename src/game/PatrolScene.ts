import Phaser from 'phaser'
import type { DirectionId, ResolvedSpriteSheetSpec, SpriteSheetSpec } from './models'
import { resolveSheetDirection } from './models'

export type PatrolSceneConfig = {
  sheet: SpriteSheetSpec
  direction?: DirectionId
  patrolWidthRatio: number
  heightPx: number
  background: number
}

export class PatrolScene extends Phaser.Scene {
  private readonly cfg: PatrolSceneConfig
  private sprite?: Phaser.GameObjects.Sprite
  private dir: 1 | -1 = 1
  private minX = 0
  private maxX = 0
  private lastAutoDir: 1 | -1 = 1
  private turningMsLeft = 0
  private turnNextDir: 1 | -1 = 1

  constructor(cfg: PatrolSceneConfig) {
    super('patrol')
    this.cfg = cfg
  }

  preload() {
    const { sheet } = this.cfg
    this.load.spritesheet(`${sheet.model}:${sheet.animation}`, sheet.src, {
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
    })
  }

  create() {
    const { sheet, background } = this.cfg
    this.cameras.main.setBackgroundColor(background)

    const key = `${sheet.model}:${sheet.animation}`

    const ensureAnim = (direction: DirectionId) => {
      const animKey = `${key}:${direction}:anim`
      if (this.anims.exists(animKey)) return animKey
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
      return animKey
    }

    const w = this.scale.width
    const h = this.scale.height
    const patrolW = Math.max(80, Math.floor(w * this.cfg.patrolWidthRatio))
    const left = Math.floor((w - patrolW) / 2)
    const right = left + patrolW

    this.minX = left + sheet.paddingPx
    this.maxX = right - sheet.paddingPx

    const y = Math.floor(h * 0.72)
    const startX = Math.floor((this.minX + this.maxX) / 2)

    const initialDirection: DirectionId = this.cfg.direction ?? 'right'
    const initialResolved = resolveSheetDirection(sheet, initialDirection)
    const initialAnimKey = ensureAnim(initialDirection)

    this.sprite = this.add.sprite(startX, y, key, initialResolved.startFrame)
    this.sprite.setScale(sheet.scale)
    this.sprite.play(initialAnimKey)

    const groundY = Math.floor(h * 0.84)
    const g = this.add.graphics()
    g.lineStyle(2, 0x2e303a, 0.8)
    g.beginPath()
    g.moveTo(left, groundY)
    g.lineTo(right, groundY)
    g.strokePath()
  }

  update(_: number, deltaMs: number) {
    if (!this.sprite) return

    const sheet = this.cfg.sheet

    if (this.cfg.direction) return

    if (this.turningMsLeft > 0) {
      this.turningMsLeft = Math.max(0, this.turningMsLeft - deltaMs)
      if (this.turningMsLeft === 0) {
        this.dir = this.turnNextDir
        this.lastAutoDir = this.dir
        const key = `${sheet.model}:${sheet.animation}`
        const direction: DirectionId = this.dir === -1 ? 'left' : 'right'
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
        this.sprite.play(animKey, true)
      }
      return
    }

    const dt = deltaMs / 1000
    const nextX = this.sprite.x + this.dir * sheet.speedPxPerSec * dt
    if (nextX <= this.minX) {
      this.sprite.x = this.minX
      this.beginTurn(1)
    } else if (nextX >= this.maxX) {
      this.sprite.x = this.maxX
      this.beginTurn(-1)
    } else {
      this.sprite.x = nextX
    }
  }

  private beginTurn(nextDir: 1 | -1) {
    if (!this.sprite) return
    const sheet = this.cfg.sheet
    const key = `${sheet.model}:${sheet.animation}`

    this.turnNextDir = nextDir
    this.turningMsLeft = 220

    const faceDir: DirectionId = 'down'
    const animKey = `${key}:${faceDir}:anim`
    if (!this.anims.exists(animKey)) {
      const resolved: ResolvedSpriteSheetSpec = resolveSheetDirection(sheet, faceDir)
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

    this.sprite.play(animKey, true)
  }
}

