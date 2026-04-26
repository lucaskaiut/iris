import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupTheme } from './theme'

const rootEl = document.getElementById('root')!
setupTheme().finally(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
