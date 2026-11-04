import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ConfirmProvider } from './components/shared'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ConfirmProvider>
            <App />
            <Toaster position="top-right" toastOptions={{ className: '!text-sm !font-medium', duration: 3500 }} />
          </ConfirmProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
