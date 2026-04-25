import './App.css'
import PhaserStage from './components/PhaserStage'

function App() {
  return (
    <main className="app">
      <h1>Iris</h1>
      <p className="subtitle">Mini palco estilo plataforma (Phaser)</p>
      <div className="stage">
        <PhaserStage model="fox" animation="walk" />
      </div>
    </main>
  )
}

export default App
