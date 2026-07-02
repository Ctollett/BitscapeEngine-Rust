import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ShowcasePanel } from './components/ShowcasePanel.tsx'
import { MobileGate } from './components/MobileGate.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/showcase" element={<ShowcasePanel />} />
        </Routes>
      </BrowserRouter>
    </MobileGate>
  </StrictMode>,
)
