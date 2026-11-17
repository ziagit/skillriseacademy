import { getLocale, t } from './i18n'

export function cn(...classes) {
  return classes.flat().filter(Boolean).join(' ')
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function uniqueSlug(text) {
  return `${slugify(text) || 'item'}-${Math.random().toString(36).slice(2, 7)}`
}

export function formatDate(value, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(getLocale(), opts)
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(getLocale(), { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function timeAgo(value) {
  if (!value) return ''
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' })
  for (const [unit, size] of units) {
    const n = Math.floor(seconds / size)
    if (n >= 1) return rtf.format(-n, unit)
  }
  return t('time.justNow')
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?'
}

export function formatMinutes(total) {
  if (!total) return t('time.minutesShort', { m: 0 })
  const h = Math.floor(total / 60)
  const m = total % 60
  if (!h) return t('time.minutesShort', { m })
  return m ? t('time.hoursMinutesShort', { h, m }) : t('time.hoursShort', { h })
}

export function formatNumber(n) {
  return new Intl.NumberFormat(getLocale(), { notation: n >= 10000 ? 'compact' : 'standard' }).format(n || 0)
}

export const LEVEL_KEYS = ['beginner', 'intermediate', 'advanced', 'all_levels']
export const levelLabel = (level) => (level ? t(`levels.${level}`) : '')

// Converts YouTube / Vimeo share links into embeddable player URLs.
export function toEmbedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^www\.|^m\./, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}?rel=0`
    if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
      if (u.pathname.startsWith('/embed/')) return url
      const id = u.searchParams.get('v') || u.pathname.match(/\/(shorts|live)\/([^/?]+)/)?.[2]
      return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.match(/\/(\d+)/)?.[1]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    if (host === 'player.vimeo.com') return url
  } catch {
    return null
  }
  return null
}

export function toYouTubeEmbedUrl(url) {
  const embedUrl = toEmbedUrl(url)
  if (!embedUrl) return null
  try {
    const host = new URL(url.trim()).hostname.toLowerCase().replace(/^(www|m)\./, '')
    return host === 'youtu.be' || host === 'youtube-nocookie.com' || host === 'youtube.com' || host.endsWith('.youtube.com')
      ? embedUrl
      : null
  } catch {
    return null
  }
}

export function toYouTubeThumbnailUrl(url) {
  const embedUrl = toYouTubeEmbedUrl(url)
  const videoId = embedUrl?.match(/\/embed\/([^/?]+)/)?.[1]
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
}

export function errorMessage(error) {
  if (!error) return t('errors.generic')
  return error.message || error.error_description || String(error)
}
