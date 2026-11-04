import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Heart, LayoutDashboard, LogOut, Mail, MapPin, Menu, Phone, X } from 'lucide-react'
import { homePathFor, useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { cn } from '../lib/utils'
import { Logo, SOCIALS, SocialIcon } from '../components/shared'
import { Avatar, Button } from '../components/ui'

const NAV = [
  { to: '/courses', label: 'Courses' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/teach', label: 'Teach' },
  { to: '/contact', label: 'Contact' },
]

function Navbar() {
  const { user, profile, signOut } = useAuth()
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
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button to="/donate" variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
            <Heart className="h-4 w-4" /> Donate
          </Button>
          {user ? (
            <>
              <Button to={homePathFor(profile?.role)} variant="secondary" size="sm">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
              <Link to="/settings/profile" title="Profile">
                <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
              </Link>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">Log in</Button>
              <Button to="/signup" size="sm">Join for free</Button>
            </>
          )}
        </div>
        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/donate" className="rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
              Donate
            </NavLink>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {user ? (
                <>
                  <Button to={homePathFor(profile?.role)} variant="secondary">Dashboard</Button>
                  <Button variant="ghost" onClick={signOut}>
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button to="/login" variant="secondary">Log in</Button>
                  <Button to="/signup">Join free</Button>
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
  const socials = SOCIALS.filter((s) => settings[`${s}_url`])
  return (
    <footer className="bg-slate-950 text-slate-400 print:hidden">
      <div className="container-page grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            A non-profit academy helping people learn in-demand digital skills for free, so they can build careers and businesses.
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
        <FooterCol title="Learn" links={[['All courses', '/courses'], ['Blog', '/blog'], ['Verify a certificate', '/verify'], ['Student login', '/login']]} />
        <FooterCol title="Organization" links={[['About us', '/about'], ['Become a teacher', '/teach'], ['Donate', '/donate'], ['Contact', '/contact']]} />
        <div className="md:col-span-4">
          <h4 className="text-sm font-semibold text-white">Get in touch</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {settings.contact_email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-slate-500" />
                <a href={`mailto:${settings.contact_email}`} className="hover:text-white">{settings.contact_email}</a>
              </li>
            )}
            {settings.contact_phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-slate-500" /> {settings.contact_phone}
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-500" /> {settings.address}
              </li>
            )}
          </ul>
          <Button to="/donate" variant="accent" size="sm" className="mt-6">
            <Heart className="h-4 w-4" /> Support our mission
          </Button>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="container-page flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SkillRise Academy. A registered non-profit organization.</p>
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
