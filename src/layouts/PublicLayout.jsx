import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Heart, LogOut, Mail, MapPin, Menu, Phone, Search, X } from 'lucide-react'
import { homePathFor, useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { cn } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import { CategoryIcon, LanguageSwitcher, Logo, SOCIALS, SocialIcon, categoryColor, useCategories } from '../components/shared'
import { Avatar, Button } from '../components/ui'

// Thin dark strip above the main header, like Coursera's audience switcher.
const TOP_LINKS = [
  { to: '/', label: 'nav.forLearners', end: true },
  { to: '/teach', label: 'nav.forTeachers' },
  { to: '/about', label: 'nav.about' },
  { to: '/blog', label: 'nav.blog' },
  { to: '/contact', label: 'nav.contact' },
]

function TopBar() {
  const { t } = useI18n()
  return (
    <div className="hidden bg-slate-950 text-sm text-white md:block">
      <div className="container-page flex h-9 items-center justify-between">
        <nav className="flex h-full items-center">
          {TOP_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn('flex h-full items-center px-3 transition first:ps-0', isActive ? 'font-semibold text-white' : 'text-slate-300 hover:text-white')
              }
            >
              {({ isActive }) => <span className={cn('border-b-2 py-1.5', isActive ? 'border-white' : 'border-transparent')}>{t(item.label)}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/verify" className="px-2 text-slate-300 transition hover:text-white">{t('nav.verify')}</Link>
          <Link to="/donate" className="flex items-center gap-1.5 px-2 text-rose-300 transition hover:text-rose-200">
            <Heart className="h-3.5 w-3.5" /> {t('nav.donate')}
          </Link>
          <LanguageSwitcher light className="h-7" />
        </div>
      </div>
    </div>
  )
}

function SearchBar({ className, autoFocus }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const current = pathname === '/courses' ? new URLSearchParams(search).get('q') || '' : ''
  const [q, setQ] = useState(current)
  useEffect(() => setQ(current), [current])

  const submit = (e) => {
    e.preventDefault()
    const query = q.trim()
    navigate(query ? `/courses?q=${encodeURIComponent(query)}` : '/courses')
  }
  return (
    <form onSubmit={submit} role="search" className={cn('relative', className)}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('nav.searchPlaceholder')}
        aria-label={t('nav.searchPlaceholder')}
        autoFocus={autoFocus}
        className="h-11 w-full rounded-full border border-slate-300 bg-white pe-14 ps-5 text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
      />
      <button type="submit" aria-label={t('nav.search')} className="absolute end-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-800">
        <Search className="h-4 w-4" />
      </button>
    </form>
  )
}

function ExploreMenu() {
  const { t } = useI18n()
  const categories = useCategories()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { pathname, search } = useLocation()

  useEffect(() => setOpen(false), [pathname, search])
  useEffect(() => {
    if (!open) return
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cn('flex h-10 items-center gap-1 rounded-md px-3 text-sm font-semibold transition', open ? 'bg-brand-50 text-brand-700' : 'text-brand-600 hover:bg-brand-50')}
      >
        {t('nav.explore')} <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-2 w-[min(92vw,640px)] rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
          <p className="text-sm font-semibold text-slate-900">{t('nav.exploreTitle')}</p>
          <div className="mt-3 grid gap-1 sm:grid-cols-2">
            {categories.map((cat) => {
              const c = categoryColor(cat.color)
              return (
                <Link key={cat.slug} to={`/courses?category=${cat.slug}`} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-brand-700">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', c.bg, c.text)}>
                    <CategoryIcon name={cat.icon} className="h-4 w-4" />
                  </span>
                  <span dir="auto" className="truncate">{cat.name}</span>
                </Link>
              )
            })}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Link to="/courses" className="link text-sm">{t('nav.browseAll')}</Link>
          </div>
        </div>
      )}
    </div>
  )
}

function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { t } = useI18n()
  // Phones get Coursera's compact header: menu at the start, search behind an icon at the end.
  const [panel, setPanel] = useState(null)
  const location = useLocation()
  const toggle = (name) => setPanel((p) => (p === name ? null : name))

  useEffect(() => {
    setPanel(null)
  }, [location.pathname, location.search])

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <TopBar />
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-16 items-center gap-3 lg:gap-5">
          <button className="-ms-2 rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => toggle('menu')} aria-label={t('nav.toggleMenu')} aria-expanded={panel === 'menu'}>
            {panel === 'menu' ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Logo className="[&_img]:h-8 md:[&_img]:h-9" />
          <div className="hidden md:block">
            <ExploreMenu />
          </div>
          <SearchBar className="hidden max-w-xl flex-1 md:block" />
          <div className="ms-auto hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link to={homePathFor(profile?.role)} className="whitespace-nowrap px-2 text-sm font-semibold text-slate-700 transition hover:text-brand-600">
                  {t('nav.myLearning')}
                </Link>
                <Link to="/settings/profile" title={t('nav.profile')}>
                  <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="whitespace-nowrap px-3 text-sm font-semibold text-brand-600 transition hover:text-brand-800 hover:underline">
                  {t('nav.login')}
                </Link>
                <Button to="/signup" variant="outline">{t('nav.joinFree')}</Button>
              </>
            )}
          </div>
          <button className="-me-2 ms-auto rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => toggle('search')} aria-label={t('nav.search')} aria-expanded={panel === 'search'}>
            {panel === 'search' ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {panel === 'search' && (
        <div className="border-b border-slate-200 bg-white py-3 shadow-lg md:hidden">
          <div className="container-page">
            <SearchBar autoFocus />
          </div>
        </div>
      )}
      {panel === 'menu' && <MobileMenu user={user} profile={profile} signOut={signOut} />}
    </header>
  )
}

function MobileMenu({ user, profile, signOut }) {
  const { t } = useI18n()
  const categories = useCategories()
  return (
    <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg md:hidden">
      <div className="container-page space-y-5 py-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('nav.explore')}</p>
          <div className="grid grid-cols-2 gap-x-2">
            {categories.map((cat) => (
              <Link key={cat.slug} to={`/courses?category=${cat.slug}`} className="truncate rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50" dir="auto">
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
        <nav className="flex flex-col border-t border-slate-100 pt-3">
          {[...TOP_LINKS.slice(1), { to: '/verify', label: 'nav.verify' }].map((item) => (
            <NavLink key={item.to} to={item.to} className="rounded-md px-2 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t(item.label)}
            </NavLink>
          ))}
          <NavLink to="/donate" className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
            <Heart className="h-4 w-4" /> {t('nav.donate')}
          </NavLink>
        </nav>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <LanguageSwitcher />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {user ? (
            <>
              <Button to={homePathFor(profile?.role)}>{t('nav.myLearning')}</Button>
              <Button variant="secondary" onClick={signOut}>
                <LogOut className="h-4 w-4 rtl:-scale-x-100" /> {t('nav.signOut')}
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="outline">{t('nav.login')}</Button>
              <Button to="/signup">{t('nav.joinFreeShort')}</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Footer() {
  const { settings } = useSettings()
  const { t, locale } = useI18n()
  const categories = useCategories()
  const socials = SOCIALS.filter((s) => settings[`${s}_url`])
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-700 print:hidden">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <FooterCol title={t('footer.categories')} links={categories.slice(0, 6).map((c) => [c.name, `/courses?category=${c.slug}`])} />
        <FooterCol title={t('footer.learn')} links={[[t('footer.allCourses'), '/courses'], [t('footer.verify'), '/verify'], [t('footer.studentLogin'), '/login'], [t('nav.joinFree'), '/signup']]} />
        <FooterCol title={t('footer.community')} links={[[t('footer.becomeTeacher'), '/teach'], [t('nav.blog'), '/blog'], [t('nav.donate'), '/donate']]} />
        <FooterCol title={t('footer.organization')} links={[[t('footer.aboutUs'), '/about'], [t('nav.contact'), '/contact']]} />
        <div>
          <h4 className="text-base font-bold text-slate-900">{t('footer.getInTouch')}</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {settings.contact_email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                <a href={`mailto:${settings.contact_email}`} dir="ltr" className="break-all hover:text-brand-600 hover:underline">{settings.contact_email}</a>
              </li>
            )}
            {settings.contact_phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-slate-500" /> <span dir="ltr">{settings.contact_phone}</span>
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /> {settings.address}
              </li>
            )}
          </ul>
          <Button to="/donate" size="sm" className="mt-5">
            <Heart className="h-4 w-4" /> {t('footer.support')}
          </Button>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="container-page flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Logo className="[&_img]:h-8" />
            <p className="max-w-md text-xs leading-relaxed text-slate-500">
              {t('footer.copyright', { year: new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(new Date()) })}
            </p>
          </div>
          {socials.length > 0 && (
            <div className="flex gap-1">
              {socials.map((s) => (
                <a key={s} href={settings[`${s}_url`]} target="_blank" rel="noreferrer" className="rounded-full p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900" aria-label={s}>
                  <SocialIcon name={s} className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} dir="auto" className="transition hover:text-brand-600 hover:underline">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SetupBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div className="bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900 print:hidden">
      Supabase isn't connected yet. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code> (see README).
    </div>
  )
}

export default function PublicLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <SetupBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
