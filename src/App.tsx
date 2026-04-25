import { useMemo, useState } from 'react'
import './App.css'
import PhaserStage from './components/PhaserStage'
import { getAvailableAnimations, getAvailableModels } from './game/assets'

function App() {
  const models = useMemo(() => getAvailableModels(), [])
  const [model, setModel] = useState<string>(() => models[0] ?? 'fox')
  const animations = useMemo(
    () => getAvailableAnimations(model, { exclude: ['death'] }),
    [model],
  )
  const [animation, setAnimation] = useState<string>('idle')
  const [moveDir, setMoveDir] = useState<-1 | 0 | 1>(0)

  const resolvedAnimation = useMemo(() => {
    if (animations.length === 0) return 'idle'
    if (animations.includes(animation)) return animation
    if (animations.includes('idle')) return 'idle'
    return animations[0]
  }, [animations, animation])

  return (
    <main className="app">
      <h1>Iris</h1>
      <p className="subtitle">Mini palco estilo plataforma (Phaser)</p>
      <div className="model-picker">
        <label className="panel-label" htmlFor="model">
          Modelo
        </label>
        <select
          id="model"
          className="select"
          value={model}
          onChange={(e) => {
            setMoveDir(0)
            setModel(e.target.value)
          }}
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="stage">
        <PhaserStage model={model} animation={resolvedAnimation} moveDir={moveDir} />
      </div>

      <div className="panel">
        <div className="panel-inner">
          <span className="panel-label">Mover</span>
          <div className="panel-buttons">
            <button
              type="button"
              className={moveDir === -1 ? 'panel-btn panel-btn-active' : 'panel-btn'}
              onPointerDown={() => setMoveDir(-1)}
              onPointerUp={() => setMoveDir(0)}
              onPointerCancel={() => setMoveDir(0)}
              onPointerLeave={() => setMoveDir(0)}
            >
              ←
            </button>
            <button
              type="button"
              className={moveDir === 1 ? 'panel-btn panel-btn-active' : 'panel-btn'}
              onPointerDown={() => setMoveDir(1)}
              onPointerUp={() => setMoveDir(0)}
              onPointerCancel={() => setMoveDir(0)}
              onPointerLeave={() => setMoveDir(0)}
            >
              →
            </button>
          </div>

          <span className="panel-label">Animações</span>
          <div className="panel-buttons">
            {animations.map((a) => (
              <button
                key={a}
                type="button"
                className={a === resolvedAnimation ? 'panel-btn panel-btn-active' : 'panel-btn'}
                onClick={() => setAnimation(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
