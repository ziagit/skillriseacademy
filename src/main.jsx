import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ConfirmProvider } from './components/shared'
import { I18nProvider, useI18n } from './lib/i18n'
import App from './App'
import './index.css'

function AppToaster() {
  const { dir } = useI18n()
  return <Toaster position={dir === 'rtl' ? 'top-left' : 'top-right'} toastOptions={{ className: '!text-sm !font-medium', duration: 3500 }} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <ConfirmProvider>
              <App />
              <AppToaster />
            </ConfirmProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
)
