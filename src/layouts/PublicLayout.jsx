import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Heart, LayoutDashboard, LogOut, Mail, MapPin, Menu, Phone, X } from 'lucide-react'
import { homePathFor, useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { cn } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import { LanguageSwitcher, Logo, SOCIALS, SocialIcon } from '../components/shared'
import { Avatar, Button } from '../components/ui'

const NAV = [
  { to: '/courses', label: 'nav.courses' },
  { to: '/about', label: 'nav.about' },
  { to: '/blog', label: 'nav.blog' },
  { to: '/teach', label: 'nav.teach' },
  { to: '/contact', label: 'nav.contact' },
]

function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('sticky top-0 z-40 print:hidden border-b bg-white/90 backdrop-blur transition', scrolled ? 'border-slate-200 shadow-sm' : 'border-transparent')}>
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2 text-sm font-medium transition', isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900')
              }
            >
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <Button to="/donate" variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
            <Heart className="h-4 w-4" /> {t('nav.donate')}
          </Button>
          {user ? (
            <>
              <Button to={homePathFor(profile?.role)} variant="secondary" size="sm">
                <LayoutDashboard className="h-4 w-4" /> {t('nav.dashboard')}
              </Button>
              <Link to="/settings/profile" title={t('nav.profile')}>
                <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
              </Link>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">{t('nav.login')}</Button>
              <Button to="/signup" size="sm">{t('nav.joinFree')}</Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher />
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={() => setOpen(!open)} aria-label={t('nav.toggleMenu')}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {t(item.label)}
              </NavLink>
            ))}
            <NavLink to="/donate" className="rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
              {t('nav.donate')}
            </NavLink>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {user ? (
                <>
                  <Button to={homePathFor(profile?.role)} variant="secondary">{t('nav.dashboard')}</Button>
                  <Button variant="ghost" onClick={signOut}>
                    <LogOut className="h-4 w-4 rtl:-scale-x-100" /> {t('nav.signOut')}
                  </Button>
                </>
              ) : (
                <>
                  <Button to="/login" variant="secondary">{t('nav.login')}</Button>
                  <Button to="/signup">{t('nav.joinFreeShort')}</Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function Footer() {
  const { settings } = useSettings()
  const { t, locale } = useI18n()
  const socials = SOCIALS.filter((s) => settings[`${s}_url`])
  return (
    <footer className="bg-slate-950 text-slate-400 print:hidden">
      <div className="container-page grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            {t('footer.blurb')}
          </p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a key={s} href={settings[`${s}_url`]} target="_blank" rel="noreferrer" className="rounded-lg bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label={s}>
                  <SocialIcon name={s} className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <FooterCol title={t('footer.learn')} links={[[t('footer.allCourses'), '/courses'], [t('nav.blog'), '/blog'], [t('footer.verify'), '/verify'], [t('footer.studentLogin'), '/login']]} />
        <FooterCol title={t('footer.organization')} links={[[t('footer.aboutUs'), '/about'], [t('footer.becomeTeacher'), '/teach'], [t('nav.donate'), '/donate'], [t('nav.contact'), '/contact']]} />
        <div className="md:col-span-4">
          <h4 className="text-sm font-semibold text-white">{t('footer.getInTouch')}</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {settings.contact_email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-slate-500" />
                <a href={`mailto:${settings.contact_email}`} dir="ltr" className="hover:text-white">{settings.contact_email}</a>
              </li>
            )}
            {settings.contact_phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-slate-500" /> <span dir="ltr">{settings.contact_phone}</span>
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-500" /> {settings.address}
              </li>
            )}
          </ul>
          <Button to="/donate" variant="accent" size="sm" className="mt-6">
            <Heart className="h-4 w-4" /> {t('footer.support')}
          </Button>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="container-page flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.copyright', { year: new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(new Date()) })}</p>
          <p>skillriseacademy.org</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }) {
  return (
    <div className="md:col-span-2">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="transition hover:text-white">{label}</Link>
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
