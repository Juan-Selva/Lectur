import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AjustesProvider } from './lib/ajustes.jsx'
import { AuthProvider } from './lib/auth.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AjustesProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </AjustesProvider>
  </StrictMode>,
)
