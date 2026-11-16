import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import {
  BookOpen, Briefcase, Brush, Camera, Clapperboard, Code, Globe, ImagePlus, Languages, Lightbulb, Megaphone,
  Monitor, Music, Newspaper, Palette, PenLine, Plus, ShoppingCart, Sparkles, Trash2, Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, uploadMedia } from '../lib/supabase'
import { unwrap, useQuery } from '../lib/useQuery'
import { DEFAULT_CATEGORIES } from '../lib/constants'
import { cn, errorMessage, formatMinutes, levelLabel, toEmbedUrl } from '../lib/utils'
import { LANGUAGES, useI18n } from '../lib/i18n'
import { Avatar, Button, Modal, PageLoader } from './ui'

export function Logo({ className, light = false }) {
  return (
    <Link to="/" className={cn('flex shrink-0 items-center', className)}>
      <img src={light ? '/logo-light.png' : '/logo.png'} alt="SkillRise Academy" className="h-10 w-auto" width="610" height="145" />
    </Link>
  )
}

// Cycles to the next language; with two languages it reads as "switch to فارسی / English".
export function LanguageSwitcher({ className, light = false }) {
  const { lang, setLang, t } = useI18n()
  const codes = Object.keys(LANGUAGES)
  const next = codes[(codes.indexOf(lang) + 1) % codes.length]
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      lang={next}
      title={t('common.switchLanguage')}
      aria-label={`${t('common.switchLanguage')}: ${LANGUAGES[next].label}`}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition',
        light ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        className,
      )}
    >
      <Languages className="h-4 w-4" />
      {LANGUAGES[next].label}
    </button>
  )
}

export const CATEGORY_COLORS = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100', grad: 'from-blue-500 to-indigo-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100', grad: 'from-violet-500 to-fuchsia-600' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', ring: 'ring-pink-100', grad: 'from-pink-500 to-rose-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-100', grad: 'from-orange-400 to-red-500' },
  red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100', grad: 'from-red-500 to-rose-700' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200', grad: 'from-slate-600 to-slate-900' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100', grad: 'from-emerald-500 to-teal-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100', grad: 'from-amber-400 to-orange-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'ring-teal-100', grad: 'from-teal-500 to-cyan-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-100', grad: 'from-cyan-500 to-blue-600' },
}

// Live categories, falling back to the seeded defaults so menus render before (or without) data.
export function useCategories() {
  const { data } = useQuery(async () => unwrap(await supabase.from('categories').select('*').order('sort_order')), [])
  return data?.length ? data : DEFAULT_CATEGORIES
}

export function categoryColor(color) {
  return CATEGORY_COLORS[color] || CATEGORY_COLORS.blue
}

export const CATEGORY_ICONS = {
  BookOpen, Briefcase, Brush, Camera, Clapperboard, Code, Globe, Languages, Lightbulb, Megaphone,
  Monitor, Music, Newspaper, Palette, PenLine, ShoppingCart, Sparkles,
}

export function CategoryIcon({ name, className }) {
  const Icon = CATEGORY_ICONS[name] || BookOpen
  return <Icon className={className} />
}

export function CourseThumbnail({ course, className }) {
  const c = categoryColor(course?.category?.color)
  if (course?.thumbnail_url) {
    return <img src={course.thumbnail_url} alt="" className={cn('aspect-video w-full object-cover', className)} />
  }
  return (
    <div className={cn('relative flex aspect-video w-full items-center justify-center overflow-hidden bg-gradient-to-br', c.grad, className)}>
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-4 h-32 w-32 rounded-full bg-black/10" />
      <CategoryIcon name={course?.category?.icon} className="relative h-12 w-12 text-white/90" />
    </div>
  )
}

function courseMinutes(course) {
  return (course.lessons ?? []).reduce((s, l) => s + (l.duration_minutes || 0), 0)
}

// Coursera-style vertical card: inset thumbnail, teacher line, title, then a quiet meta line.
export function CourseCard({ course, students }) {
  const { t } = useI18n()
  const lessons = course.lessons ?? []
  const minutes = courseMinutes(course)
  const meta = [levelLabel(course.level), t('course.type'), minutes ? formatMinutes(minutes) : lessons.length > 0 && t('course.lessonCount', { count: lessons.length })].filter(Boolean)
  return (
    <Link to={`/courses/${course.slug}`} className="group flex flex-col rounded-lg border border-slate-200 bg-white p-3 transition hover:shadow-lift">
      <div className="relative overflow-hidden rounded-md">
        <CourseThumbnail course={course} className="transition duration-500 group-hover:scale-[1.03]" />
        <span className="absolute start-2 top-2 rounded bg-white px-2 py-0.5 text-xs font-semibold text-slate-900 shadow-sm">{t('common.free')}</span>
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar src={course.teacher?.avatar_url} name={course.teacher?.full_name} size="xs" className="rounded-md ring-1 ring-slate-200" />
          <span className="truncate text-sm text-slate-600">{course.teacher?.full_name}</span>
        </div>
        <h3 dir="auto" className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:underline">{course.title}</h3>
        {course.subtitle && <p dir="auto" className="mt-1.5 line-clamp-2 text-sm text-slate-600">{course.subtitle}</p>}
        <div className="mt-auto space-y-1.5 pt-3 text-sm text-slate-600">
          {students > 0 && (
            <p className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {t('course.learners', { count: students })}
            </p>
          )}
          <p className="text-slate-500">{meta.join(' · ')}</p>
        </div>
      </div>
    </Link>
  )
}

// Compact horizontal row used inside the home page's "New and popular" panels.
export function CourseListItem({ course }) {
  const { t } = useI18n()
  return (
    <Link to={`/courses/${course.slug}`} className="group flex items-center gap-3 rounded-lg bg-white p-2.5 shadow-card transition hover:shadow-lift">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md">
        <CourseThumbnail course={course} className="h-full [&_svg]:h-6 [&_svg]:w-6" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-600">{course.teacher?.full_name}</p>
        <p dir="auto" className="mt-0.5 truncate text-sm font-semibold text-slate-900 group-hover:underline">{course.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{t('course.type')} · {levelLabel(course.level)}</p>
      </div>
    </Link>
  )
}

export const COURSE_CARD_SELECT = 'id, title, slug, subtitle, level, thumbnail_url, featured, published_at, category:categories(name, slug, icon, color), teacher:profiles!courses_teacher_id_fkey(full_name, avatar_url), lessons(duration_minutes)'

export function Markdown({ children, className }) {
  return (
    <div dir="auto" className={cn('prose prose-slate max-w-none prose-headings:font-display prose-a:text-brand-600 prose-img:rounded-xl', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ''}</ReactMarkdown>
    </div>
  )
}

export function VideoEmbed({ url, title }) {
  const { t } = useI18n()
  const embed = toEmbedUrl(url)
  if (!embed) {
    return url ? (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-sm text-slate-300">
        <a href={url} target="_blank" rel="noreferrer" className="underline">{t('course.openVideo')}</a>
      </div>
    ) : null
  }
  return (
    <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
      <iframe src={embed} title={title || t('course.lessonVideo')} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
    </div>
  )
}

export function ImageUpload({ value, onChange, folder = 'uploads', aspect = 'aspect-video', label }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const handle = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error(t('upload.tooLarge'))
    setBusy(true)
    try {
      onChange(await uploadMedia(file, user.id, folder))
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn('group relative flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-brand-400 hover:bg-brand-50/40', aspect)}
      >
        {value ? (
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-sm text-slate-500">
            <ImagePlus className="h-7 w-7 text-slate-400" />
            {busy ? t('upload.uploading') : label ?? t('upload.uploadImage')}
            <span className="text-xs text-slate-400">{t('upload.hint')}</span>
          </span>
        )}
        {value && <span className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">{busy ? t('upload.uploading') : t('upload.change')}</span>}
      </button>
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-xs font-medium text-red-600 hover:underline">
          {t('upload.remove')}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handle} />
    </div>
  )
}

// Editable list of short strings (course outcomes, requirements, …).
export function ListEditor({ label, items, onChange, placeholder }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="input"
            value={item}
            placeholder={placeholder}
            onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={t('common.remove')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="soft" size="sm" onClick={() => onChange([...items, ''])}>
        <Plus className="h-4 w-4" /> {t('common.addItem')}
      </Button>
    </div>
  )
}

export function RequireAuth({ roles, children }) {
  const { user, profile, loading } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  if (loading || (user && profile === undefined)) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">{t('auth.profileError.title')}</h1>
          <p className="mt-2 text-slate-600">{t('auth.profileError.body')}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>{t('common.tryAgain')}</Button>
        </div>
      </div>
    )
  }
  if (profile?.status === 'suspended') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">{t('auth.suspended.title')}</h1>
          <p className="mt-2 text-slate-600">{t('auth.suspended.body')}</p>
          <Button to="/contact" className="mt-6">{t('common.contactUs')}</Button>
        </div>
      </div>
    )
  }
  if (roles && !roles.includes(profile.role)) return <Navigate to="/dashboard" replace />
  return children
}

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const { t } = useI18n()
  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setState({ ...opts, resolve })
      }),
    [],
  )
  const close = (result) => {
    state?.resolve(result)
    setState(null)
  }
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => close(false)}
        size="sm"
        title={state?.title || t('confirm.title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>{t('common.cancel')}</Button>
            <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
              {state?.confirmLabel || t('confirm.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">{state?.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)

const socialPaths = {
  facebook: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z',
  instagram: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm6.4-8.4a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0ZM21.9 8c-.1-1.6-.4-3-1.6-4.2C19 2.6 17.6 2.2 16 2.1 14.4 2 9.6 2 8 2.1c-1.6.1-3 .4-4.2 1.6C2.6 5 2.2 6.4 2.1 8 2 9.6 2 14.4 2.1 16c.1 1.6.4 3 1.6 4.2C5 21.4 6.4 21.8 8 21.9c1.6.1 6.4.1 8 0 1.6-.1 3-.4 4.2-1.6 1.2-1.2 1.6-2.6 1.6-4.2.1-1.6.1-6.4.1-8Zm-2.1 9.9a3.3 3.3 0 0 1-1.8 1.8c-1.3.5-4.3.4-5.9.4s-4.6.1-5.9-.4a3.3 3.3 0 0 1-1.8-1.8c-.5-1.3-.4-4.3-.4-5.9s-.1-4.6.4-5.9A3.3 3.3 0 0 1 6.1 4.3C7.4 3.8 10.4 3.9 12 3.9s4.6-.1 5.9.4a3.3 3.3 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.9s.2 4.6-.3 5.9Z',
  youtube: 'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15V9l5.7 3-5.7 3Z',
  linkedin: 'M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5v6.3ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.5H3.6V9h3.5v11.5ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z',
  x: 'M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.9 2.3h7l4.8 6.4 5.5-6.4Zm-1.2 17.9h1.9L7.1 4.2H5.1l11.9 16Z',
  whatsapp: 'M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5v-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4ZM12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm8.4-18.2A11.8 11.8 0 0 0 1.7 17.9L0 24l6.3-1.7a11.8 11.8 0 0 0 5.7 1.5A11.8 11.8 0 0 0 20.4 3.6Z',
}

export function SocialIcon({ name, className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={socialPaths[name]} />
    </svg>
  )
}

export const SOCIALS = ['facebook', 'instagram', 'youtube', 'linkedin', 'x', 'whatsapp']
