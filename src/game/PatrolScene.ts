import Phaser from 'phaser';
import type {
  DirectionId,
  ResolvedSpriteSheetSpec,
  SpriteSheetSpec,
} from './models';
import { getSpriteSheetSpec, resolveSheetDirection } from './models';
import { getAnimationUrl } from './assets';

export type PatrolSceneConfig = {
  sheet: SpriteSheetSpec;
  direction?: DirectionId;
  patrolWidthRatio: number;
  heightPx: number;
  background: number;
};

export class PatrolScene extends Phaser.Scene {
  private readonly cfg: PatrolSceneConfig;
  private sprite?: Phaser.GameObjects.Sprite;
  private moveDir: -1 | 0 | 1 = 0;
  private minX = 0;
  private maxX = 0;
  private turningMsLeft = 0;
  private flipForLeft = false;

  constructor(cfg: PatrolSceneConfig) {
    super('patrol');
    this.cfg = cfg;
  }

  preload() {
    const { sheet } = this.cfg;
    this.load.spritesheet(`${sheet.model}:${sheet.animation}`, sheet.src, {
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
    });
  }

  create() {
    const { sheet, background } = this.cfg;
    this.cameras.main.setBackgroundColor(background);
    this.flipForLeft = sheet.directionRows.left === sheet.directionRows.right;

    const ensureAnim = (animation: string, direction: DirectionId) => {
      const key = `${sheet.model}:${animation}`;
      const animKey = `${key}:${direction}:anim`;
      if (this.anims.exists(animKey)) return animKey;
      const resolvedSheet = getSpriteSheetSpec(sheet.model, animation);
      const resolved: ResolvedSpriteSheetSpec = resolveSheetDirection(
        resolvedSheet,
        direction,
      );
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(key, {
          start: resolved.startFrame,
          end: resolved.endFrame,
        }),
        frameRate: resolvedSheet.frameRate,
        repeat: resolvedSheet.repeat,
      });
      return animKey;
    };

    const w = this.scale.width;
    const h = this.scale.height;
    const patrolW = Math.max(80, Math.floor(w * this.cfg.patrolWidthRatio));
    const left = Math.floor((w - patrolW) / 2);
    const right = left + patrolW;

    this.minX = left + sheet.paddingPx;
    this.maxX = right - sheet.paddingPx;

    const y = Math.floor(h * 0.72);
    const startX = Math.floor((this.minX + this.maxX) / 2);

    const initialDirection: DirectionId = this.cfg.direction ?? 'right';
    const initialResolved = resolveSheetDirection(sheet, initialDirection);
    const initialAnimKey = ensureAnim(sheet.animation, initialDirection);

    this.sprite = this.add.sprite(
      startX,
      y,
      `${sheet.model}:${sheet.animation}`,
      initialResolved.startFrame,
    );
    this.sprite.setScale(sheet.scale);
    this.sprite.play(initialAnimKey);

    if (!this.cfg.direction) {
      const faceAnim = ensureAnim(sheet.animation, 'down');
      this.sprite.play(faceAnim, true);
    }

    const groundY = Math.floor(h * 0.84);
    const g = this.add.graphics();
    g.lineStyle(2, 0x2e303a, 0.8);
    g.beginPath();
    g.moveTo(left, groundY);
    g.lineTo(right, groundY);
    g.strokePath();

    if (!this.cfg.direction) {
      this.game.events.on('move', this.onMove, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.game.events.off('move', this.onMove, this);
      });
    }
  }

  update(_: number, deltaMs: number) {
    if (!this.sprite) return;

    const sheet = this.cfg.sheet;

    if (this.cfg.direction) return;

    if (this.turningMsLeft > 0) {
      this.turningMsLeft = Math.max(0, this.turningMsLeft - deltaMs);
      if (this.turningMsLeft === 0) {
        const direction: DirectionId =
          this.moveDir === -1 ? 'left' : this.moveDir === 1 ? 'right' : 'down';
        const animKey = this.ensureAnimFor(
          sheet.model,
          sheet.animation,
          direction,
        );
        this.sprite.play(animKey, true);
      }
      return;
    }

    if (this.moveDir === 0) return;

    const dt = deltaMs / 1000;
    const nextX = this.sprite.x + this.moveDir * sheet.speedPxPerSec * dt;
    if (nextX <= this.minX) {
      this.sprite.x = this.minX;
      this.beginTurn();
    } else if (nextX >= this.maxX) {
      this.sprite.x = this.maxX;
      this.beginTurn();
    } else {
      this.sprite.x = nextX;
    }
  }

  private beginTurn() {
    if (!this.sprite) return;

    this.turningMsLeft = 220;

    const faceDir: DirectionId = 'down';
    this.switchAnimation(this.cfg.sheet.animation, faceDir);
  }

  private onMove(dir: unknown) {
    if (!this.sprite || this.cfg.direction) return;
    const d = dir === -1 || dir === 0 || dir === 1 ? (dir as -1 | 0 | 1) : 0;
    if (d === this.moveDir) return;

    this.moveDir = d;
    this.turningMsLeft = 0;

    const face: DirectionId = d === 0 ? 'down' : d === -1 ? 'left' : 'right';
    const baseAnimation = this.cfg.sheet.animation;
    const nextAnimation =
      d === 0
        ? baseAnimation
        : getAnimationUrl(this.cfg.sheet.model, 'walk')
          ? 'walk'
          : baseAnimation;
    this.switchAnimation(nextAnimation, face);
  }

  private switchAnimation(animation: string, face: DirectionId) {
    if (!this.sprite) return;
    const model = this.cfg.sheet.model;

    if (!this.textures.exists(`${model}:${animation}`)) {
      const nextSheet = getSpriteSheetSpec(model, animation);
      this.load.spritesheet(`${model}:${animation}`, nextSheet.src, {
        frameWidth: nextSheet.frameWidth,
        frameHeight: nextSheet.frameHeight,
      });

      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        const animKey = this.ensureAnimFor(model, animation, face);
        this.sprite?.setTexture(`${model}:${animation}`);
        this.applyFacing(face);
        this.sprite?.play(animKey, true);
      });
      this.load.start();
      return;
    }

    const animKey = this.ensureAnimFor(model, animation, face);
    this.sprite.setTexture(`${model}:${animation}`);
    this.applyFacing(face);
    this.sprite.play(animKey, true);
  }

  private applyFacing(face: DirectionId) {
    if (!this.sprite) return;
    if (!this.flipForLeft) {
      this.sprite.setFlipX(false);
      return;
    }
    this.sprite.setFlipX(face === 'left');
  }

  private ensureAnimFor(
    model: string,
    animation: string,
    direction: DirectionId,
  ) {
    const key = `${model}:${animation}`;
    const animKey = `${key}:${direction}:anim`;
    if (this.anims.exists(animKey)) return animKey;
    const sheet = getSpriteSheetSpec(model, animation);
    const resolved: ResolvedSpriteSheetSpec = resolveSheetDirection(
      sheet,
      direction,
    );
    this.anims.create({
      key: animKey,
      frames: this.anims.generateFrameNumbers(key, {
        start: resolved.startFrame,
        end: resolved.endFrame,
      }),
      frameRate: sheet.frameRate,
      repeat: sheet.repeat,
    });
    return animKey;
  }
}
