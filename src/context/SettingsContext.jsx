import { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const DEFAULTS = {
  site_name: 'SkillRise Academy',
  tagline: 'Free skills for a better future',
  contact_email: 'info@skillriseacademy.org',
}

const SettingsContext = createContext({ settings: DEFAULTS, reload: () => {} })

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)

  const load = async () => {
    if (!isSupabaseConfigured) return
    const { data } = await supabase.from('site_settings').select('key, value')
    if (data) {
      setSettings({ ...DEFAULTS, ...Object.fromEntries(data.filter((r) => r.value).map((r) => [r.key, r.value])) })
    }
  }

  useEffect(() => {
    load()
  }, [])

  return <SettingsContext.Provider value={{ settings, reload: load }}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
