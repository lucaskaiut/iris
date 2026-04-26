import Phaser from 'phaser'
import StarIcon from '../assets/icons/minigames/star.png'
import type { DirectionId, ResolvedSpriteSheetSpec, SpriteModel } from './models'
import { resolveSheetDirection } from './models'

export type StarCatchFinishedPayload = { score: number; aborted?: true }

export type StarCatchSceneConfig = {
  model: SpriteModel
  heightPx: number
  background: number
  durationSec: number
  onFinished(payload: StarCatchFinishedPayload): void
  shouldAbort?(): boolean
}

const STAR_TEXTURE_KEY = 'minigame:star'

const PLAYER_BODY_RADIUS_PX = 18
const STAR_SPAWN_PADDING_PX = 22
const STAR_MIN_DISTANCE_FROM_PLAYER_PX = 56
const TOUCH_DEADZONE_PX = 10
const STAR_SIZE_PX = 26
const PLAY_AREA_INSET_PX = { top: 72, right: 10, bottom: 10, left: 10 } as const
const SPEED_MULTIPLIER = 1.05
const SPEED_REFERENCE_MIN_DIM_PX = 400

export class StarCatchScene extends Phaser.Scene {
  private readonly cfg: StarCatchSceneConfig

  private player?: Phaser.Physics.Arcade.Sprite
  private star?: Phaser.Physics.Arcade.Image
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd?: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key }

  private score = 0
  private remainingSec = 0
  private textScore?: Phaser.GameObjects.Text
  private textTime?: Phaser.GameObjects.Text

  private touchActive = false
  private touchTarget?: Phaser.Math.Vector2

  private currentDirection: DirectionId = 'down'
  private sheetKey?: string
  private baseAnimKey?: string
  private flipForLeft = false
  private onResizeBound?: (gameSize: Phaser.Structs.Size) => void
  private worldW = 1
  private worldH = 1
  private playArea = { x: 0, y: 0, w: 1, h: 1 }

  constructor(cfg: StarCatchSceneConfig) {
    super('star-catch')
    this.cfg = cfg
  }

  preload() {
    const anim = this.chooseMovementAnimation()
    const sheet = this.cfg.model.getSheet(anim)
    this.sheetKey = `${sheet.model}:${sheet.animation}`
    this.load.spritesheet(this.sheetKey, sheet.src, {
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
    })
    if (!this.textures.exists(STAR_TEXTURE_KEY)) {
      this.load.image(STAR_TEXTURE_KEY, StarIcon)
    }
  }

  create() {
    const { background } = this.cfg
    this.cameras.main.setBackgroundColor(background)
    const applyWorldSize = (w: number, h: number) => {
      this.worldW = Math.max(1, Math.floor(w))
      this.worldH = Math.max(1, Math.floor(h))
      this.physics.world.setBounds(0, 0, this.worldW, this.worldH, true, true, true, true)
      this.cameras.main.setSize(this.worldW, this.worldH)
      this.cameras.main.setBounds(0, 0, this.worldW, this.worldH)

      const insetTop = Math.min(PLAY_AREA_INSET_PX.top, Math.max(0, this.worldH - 1))
      const insetLeft = Math.min(PLAY_AREA_INSET_PX.left, Math.max(0, this.worldW - 1))
      const insetRight = Math.min(PLAY_AREA_INSET_PX.right, Math.max(0, this.worldW - 1))
      const insetBottom = Math.min(PLAY_AREA_INSET_PX.bottom, Math.max(0, this.worldH - 1))
      this.playArea = {
        x: insetLeft,
        y: insetTop,
        w: Math.max(1, this.worldW - insetLeft - insetRight),
        h: Math.max(1, this.worldH - insetTop - insetBottom),
      }

      if (this.player) {
        this.clampToPlayArea(this.player)
      }
      if (this.star) {
        this.clampToPlayArea(this.star)
      }
    }

    applyWorldSize(this.scale.width, this.scale.height)
    this.onResizeBound = (gameSize) => {
      applyWorldSize(gameSize.width, gameSize.height)
    }
    this.scale.on('resize', this.onResizeBound)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown())

    this.score = 0
    this.remainingSec = Math.max(1, Math.floor(this.cfg.durationSec))

    this.cursors = this.input.keyboard?.createCursorKeys()
    const kbd = this.input.keyboard
    this.wasd =
      kbd
        ? {
            up: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.D),
          }
        : undefined

    const w = this.scale.width
    const h = this.scale.height
    const x = Math.floor(w / 2)
    const y = Math.floor(h / 2)

    const { spriteKey, baseAnimKey, flipForLeft } = this.ensureAnimations()
    this.baseAnimKey = baseAnimKey
    this.flipForLeft = flipForLeft

    const sheet = this.cfg.model.getSheet(this.chooseMovementAnimation())

    this.player = this.physics.add.sprite(x, y, spriteKey)
    this.player.setScale(sheet.scale)
    // Não usamos collideWorldBounds aqui porque a área jogável é "insetada"
    // (o topo é coberto pela UI). O clamp manual mantém o pet dentro da área visível.
    {
      const body = this.player.body as Phaser.Physics.Arcade.Body | null
      if (body) {
        // Usa um body previsível (independente do scale do spritesheet) para o overlap ficar consistente.
        body.setCircle(PLAYER_BODY_RADIUS_PX)
        body.setOffset(
          Math.floor((this.player.width - PLAYER_BODY_RADIUS_PX * 2) / 2),
          Math.floor((this.player.height - PLAYER_BODY_RADIUS_PX * 2) / 2),
        )
      }
    }
    this.applyFacingAndPlay('down')
    this.clampToPlayArea(this.player)

    this.star = this.physics.add.image(x, y, STAR_TEXTURE_KEY)
    this.star.setDepth(2)
    this.star.setImmovable(true)
    // Prefere scale (Arcade body acompanha melhor do que displaySize em alguns casos)
    this.star.setScale(STAR_SIZE_PX / this.star.width)
    {
      const body = this.star.body as Phaser.Physics.Arcade.Body | null
      if (body) {
        body.setCircle(Math.floor(STAR_SIZE_PX / 2))
        body.setOffset(
          Math.floor((this.star.width - Math.floor(STAR_SIZE_PX / 2) * 2) / 2),
          Math.floor((this.star.height - Math.floor(STAR_SIZE_PX / 2) * 2) / 2),
        )
        body.setAllowGravity(false)
      }
    }
    this.spawnStar()

    this.physics.add.overlap(this.player, this.star, () => {
      this.score += 1
      this.spawnStar()
      this.updateHud()
    })

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#EAEAF2',
    }
    this.textScore = this.add.text(12, 10, '', style).setDepth(10)
    this.textTime = this.add.text(12, 28, '', style).setDepth(10)
    this.updateHud()

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.shouldAbortNow()) return
        this.remainingSec -= 1
        this.updateHud()
        if (this.remainingSec <= 0) this.finish()
      },
    })

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.touchActive = true
      this.touchTarget = new Phaser.Math.Vector2(p.worldX, p.worldY)
    })
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.touchActive) return
      this.touchTarget?.set(p.worldX, p.worldY)
    })
    this.input.on('pointerup', () => {
      this.touchActive = false
      this.touchTarget = undefined
    })
  }

  shutdown() {
    if (this.onResizeBound) {
      this.scale.off('resize', this.onResizeBound)
      this.onResizeBound = undefined
    }
  }

  update() {
    if (this.shouldAbortNow()) return
    if (!this.player) return

    const desired = this.readDesiredVelocity()
    this.player.setVelocity(desired.x, desired.y)
    this.clampToPlayArea(this.player)

    const nextDir = this.resolveDirectionFromVelocity(desired)
    if (nextDir && nextDir !== this.currentDirection) {
      this.applyFacingAndPlay(nextDir)
    }
  }

  private clampToPlayArea(obj: Phaser.GameObjects.GameObject) {
    const body = (obj as unknown as { body?: Phaser.Physics.Arcade.Body }).body
    const padX = body ? body.halfWidth : 0
    const padY = body ? body.halfHeight : 0
    const minX = this.playArea.x + padX
    const maxX = this.playArea.x + this.playArea.w - padX
    const minY = this.playArea.y + padY
    const maxY = this.playArea.y + this.playArea.h - padY

    if ('x' in obj && typeof obj.x === 'number') (obj as any).x = Phaser.Math.Clamp((obj as any).x, minX, maxX)
    if ('y' in obj && typeof obj.y === 'number') (obj as any).y = Phaser.Math.Clamp((obj as any).y, minY, maxY)
  }

  private chooseMovementAnimation() {
    if (this.cfg.model.hasAnimation('walk')) return 'walk'
    if (this.cfg.model.hasAnimation('run')) return 'run'
    return this.cfg.model.getDefaultAnimation()
  }

  private ensureAnimations() {
    const sheet = this.cfg.model.getSheet(this.chooseMovementAnimation())
    const key = `${sheet.model}:${sheet.animation}`
    const baseAnimKey = `${key}:minigame`
    const flipForLeft = sheet.directionRows.left === sheet.directionRows.right

    const mk = (dir: DirectionId) => `${baseAnimKey}:${dir}:anim`
    ;(['down', 'up', 'left', 'right'] as const).forEach((dir) => {
      const animKey = mk(dir)
      if (this.anims.exists(animKey)) return
      const resolved: ResolvedSpriteSheetSpec = resolveSheetDirection(sheet, dir)
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(key, {
          start: resolved.startFrame,
          end: resolved.endFrame,
        }),
        frameRate: sheet.frameRate,
        repeat: sheet.repeat,
      })
    })

    return { spriteKey: key, baseAnimKey, flipForLeft }
  }

  private applyFacingAndPlay(dir: DirectionId) {
    if (!this.player || !this.baseAnimKey) return
    this.currentDirection = dir
    if (this.flipForLeft) this.player.setFlipX(dir === 'left')
    else this.player.setFlipX(false)
    this.player.play(`${this.baseAnimKey}:${dir}:anim`, true)
  }

  private updateHud() {
    this.textScore?.setText(`Estrelas: ${this.score}`)
    this.textTime?.setText(`Tempo: ${Math.max(0, this.remainingSec)}s`)
  }

  private spawnStar() {
    if (!this.star || !this.player) return
    const starBody = this.star.body as Phaser.Physics.Arcade.Body | null
    const starPadX = starBody ? starBody.halfWidth : 0
    const starPadY = starBody ? starBody.halfHeight : 0

    const minX = this.playArea.x + STAR_SPAWN_PADDING_PX + starPadX
    const minY = this.playArea.y + STAR_SPAWN_PADDING_PX + starPadY
    const maxX = Math.max(minX, this.playArea.x + this.playArea.w - STAR_SPAWN_PADDING_PX - starPadX)
    const maxY = Math.max(minY, this.playArea.y + this.playArea.h - STAR_SPAWN_PADDING_PX - starPadY)

    const playerPos = new Phaser.Math.Vector2(this.player.x, this.player.y)
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(minX, maxX)
      const y = Phaser.Math.Between(minY, maxY)
      const d = Phaser.Math.Distance.Between(x, y, playerPos.x, playerPos.y)
      if (d < STAR_MIN_DISTANCE_FROM_PLAYER_PX) continue
      this.star.setPosition(x, y)
      return
    }

    this.star.setPosition(
      Phaser.Math.Clamp(playerPos.x + STAR_MIN_DISTANCE_FROM_PLAYER_PX, minX, maxX),
      Phaser.Math.Clamp(playerPos.y, minY, maxY),
    )
  }

  private readDesiredVelocity() {
    const sheet = this.cfg.model.getSheet(this.chooseMovementAnimation())
    const minDim = Math.max(1, Math.min(this.playArea.w, this.playArea.h))
    // Mantém "tempo para atravessar uma fração do espaço" consistente entre telas:
    // speed escala com o menor lado disponível (referência ~desktop).
    const maxSpeed = Math.round(
      sheet.speedPxPerSec * (minDim / SPEED_REFERENCE_MIN_DIM_PX) * SPEED_MULTIPLIER,
    )
    let vx = 0
    let vy = 0

    if (this.touchActive && this.touchTarget && this.player) {
      const dx = this.touchTarget.x - this.player.x
      const dy = this.touchTarget.y - this.player.y
      const dist = Math.hypot(dx, dy)
      if (dist > TOUCH_DEADZONE_PX) {
        const nx = dx / dist
        const ny = dy / dist
        vx = nx * maxSpeed
        vy = ny * maxSpeed
      }
    } else {
      const left = Boolean(this.cursors?.left?.isDown || this.wasd?.left.isDown)
      const right = Boolean(this.cursors?.right?.isDown || this.wasd?.right.isDown)
      const up = Boolean(this.cursors?.up?.isDown || this.wasd?.up.isDown)
      const down = Boolean(this.cursors?.down?.isDown || this.wasd?.down.isDown)

      vx = (right ? 1 : 0) - (left ? 1 : 0)
      vy = (down ? 1 : 0) - (up ? 1 : 0)

      const len = Math.hypot(vx, vy)
      if (len > 0) {
        vx = (vx / len) * maxSpeed
        vy = (vy / len) * maxSpeed
      }
    }

    return new Phaser.Math.Vector2(vx, vy)
  }

  private resolveDirectionFromVelocity(v: Phaser.Math.Vector2): DirectionId | null {
    const ax = Math.abs(v.x)
    const ay = Math.abs(v.y)
    if (ax < 1 && ay < 1) return null
    if (ax >= ay) return v.x >= 0 ? 'right' : 'left'
    return v.y >= 0 ? 'down' : 'up'
  }

  private shouldAbortNow() {
    if (!this.cfg.shouldAbort) return false
    if (!this.cfg.shouldAbort()) return false
    this.abort()
    return true
  }

  private abort() {
    if (!this.scene.isActive()) return
    this.scene.pause()
    this.scene.stop()
    // React decide o que fazer; aqui só garantimos que não aplicaremos resultado.
    this.cfg.onFinished({ score: 0, aborted: true })
  }

  private finish() {
    if (!this.scene.isActive()) return
    this.scene.pause()
    this.scene.stop()
    this.cfg.onFinished({ score: this.score })
  }
}

