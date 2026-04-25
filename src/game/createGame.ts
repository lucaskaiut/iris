import Phaser from 'phaser'
import { PatrolScene, type PatrolSceneConfig } from './PatrolScene'

export type GameMountConfig = {
  parent: HTMLElement
  scene: PatrolSceneConfig
}

export function createGame({ parent, scene }: GameMountConfig) {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.CANVAS,
    parent,
    backgroundColor: scene.background,
    render: { pixelArt: true, antialias: false, roundPixels: true },
    scale: {
      mode: Phaser.Scale.NONE,
      width: parent.clientWidth,
      height: scene.heightPx,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new PatrolScene(scene)],
  }

  const game = new Phaser.Game(config)

  const ro = new ResizeObserver(() => {
    const w = parent.clientWidth
    game.scale.resize(w, scene.heightPx)
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

