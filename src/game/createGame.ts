import Phaser from 'phaser'
import { PatrolScene, type PatrolSceneConfig } from './PatrolScene'
import { StarCatchScene, type StarCatchSceneConfig } from './StarCatchScene'

export type GameMountConfig = {
  parent: HTMLElement
  scene: PatrolSceneConfig | StarCatchSceneConfig
}

export function createGame({ parent, scene }: GameMountConfig) {
  const readParentSize = () => ({
    w: Math.max(1, parent.clientWidth),
    h: Math.max(1, parent.clientHeight || scene.heightPx),
  })
  const initial = readParentSize()
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.CANVAS,
    parent,
    backgroundColor: scene.background,
    render: { pixelArt: true, antialias: false, roundPixels: true },
    scale: {
      mode: Phaser.Scale.NONE,
      width: initial.w,
      height: initial.h,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics:
      'durationSec' in scene
        ? { default: 'arcade', arcade: { debug: false, gravity: { x: 0, y: 0 } } }
        : undefined,
    scene: ['durationSec' in scene ? new StarCatchScene(scene) : new PatrolScene(scene)],
  }

  const game = new Phaser.Game(config)

  const ro = new ResizeObserver(() => {
    const { w, h } = readParentSize()
    game.scale.resize(w, h)
  })
  ro.observe(parent)

  return {
    game,
    destroy() {
      ro.disconnect()
      game.destroy(true)
    },
  }
}

