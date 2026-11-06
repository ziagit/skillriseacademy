import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from '../locales/en/index.js'
import fa from '../locales/fa/index.js'

export const LANGUAGES = {
  en: { label: 'English', dir: 'ltr', locale: 'en-US', messages: en },
  fa: { label: 'فارسی', dir: 'rtl', locale: 'fa-IR', messages: fa },
}
export const DEFAULT_LANG = 'en'
const STORAGE_KEY = 'skillrise.lang'

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (LANGUAGES[saved]) return saved
  } catch {
    // storage blocked — fall through to the browser language
  }
  const browser = (navigator.languages || [navigator.language]).map((l) => l?.slice(0, 2))
  return browser.find((l) => LANGUAGES[l]) || DEFAULT_LANG
}

// Module-level so plain helpers (formatDate, errorMessage, …) can format without a hook.
let current = typeof window === 'undefined' ? DEFAULT_LANG : detectLang()

export const getLang = () => current
export const getLocale = () => LANGUAGES[current].locale
export const getDir = () => LANGUAGES[current].dir

function lookup(messages, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), messages)
}

function interpolate(str, params) {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (match, name) => {
    const v = params[name]
    if (v == null) return match
    return typeof v === 'number' ? new Intl.NumberFormat(getLocale()).format(v) : String(v)
  })
}

/**
 * t('nav.courses') → string in the active language, falling back to English, then the key.
 * Plural entries are objects keyed by Intl.PluralRules category: { one, other }.
 * Non-string entries (arrays/objects) are returned as-is.
 */
export function t(key, params) {
  let value = lookup(LANGUAGES[current].messages, key)
  if (value == null && current !== DEFAULT_LANG) value = lookup(LANGUAGES[DEFAULT_LANG].messages, key)
  if (value == null) return key
  if (typeof value === 'object' && !Array.isArray(value) && 'other' in value && params?.count != null) {
    value = value[new Intl.PluralRules(getLocale()).select(params.count)] ?? value.other
  }
  return typeof value === 'string' ? interpolate(value, params) : value
}

function applyToDocument(lang) {
  const root = document.documentElement
  root.lang = lang
  root.dir = LANGUAGES[lang].dir
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(current)

  useEffect(() => {
    applyToDocument(lang)
  }, [lang])

  const setLang = useCallback((next) => {
    if (!LANGUAGES[next]) return
    current = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // not persisted; still switches for this visit
    }
    setLangState(next)
  }, [])

  // `t` is stable at module level; a new value object per language re-renders every consumer.
  const value = useMemo(() => ({ lang, setLang, t, dir: LANGUAGES[lang].dir, locale: LANGUAGES[lang].locale }), [lang, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
