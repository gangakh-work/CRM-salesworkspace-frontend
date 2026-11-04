import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'
import './styles/space.css'
import './styles/overview.css'
import './styles/pages.css'
import App from './App.jsx'
import AuthShell from './auth.jsx'
import './styles/auth.css'
import './styles/theme-overrides.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthShell><App /></AuthShell>
  </StrictMode>,
)
