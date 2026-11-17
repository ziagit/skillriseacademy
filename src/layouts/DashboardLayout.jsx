import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Award, Bell, BookOpen, ClipboardList, ExternalLink, FileText, FolderOpen, GraduationCap, Inbox, LayoutDashboard,
  LibraryBig, LogOut, Megaphone, Menu, PanelsTopLeft, PenLine, Settings, ShieldCheck, Tags, UserCheck, Users, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import { LanguageSwitcher, Logo } from '../components/shared'
import { Avatar, Badge } from '../components/ui'
import { SetupBanner } from './PublicLayout'

const SECTIONS = [
  {
    title: 'portalNav.learning',
    roles: ['student', 'teacher', 'admin'],
    items: [
      { to: '/student', label: 'portalNav.myDashboard', icon: LayoutDashboard, end: true },
      { to: '/student/courses', label: 'portalNav.myCourses', icon: BookOpen },
      { to: '/student/certificates', label: 'portalNav.certificates', icon: Award },
      { to: '/announcements', label: 'portalNav.announcements', icon: Bell },
    ],
  },
  {
    title: 'portalNav.teaching',
    roles: ['teacher', 'admin'],
    items: [
      { to: '/teacher', label: 'portalNav.teacherOverview', icon: GraduationCap, end: true },
      { to: '/teacher/courses', label: 'portalNav.myCourses', icon: LibraryBig },
      { to: '/teacher/submissions', label: 'portalNav.submissions', icon: ClipboardList },
      { to: '/teacher/blog', label: 'portalNav.myBlogPosts', icon: PenLine },
    ],
  },
  {
    title: 'portalNav.administration',
    roles: ['admin'],
    items: [
      { to: '/admin', label: 'portalNav.overview', icon: ShieldCheck, end: true },
      { to: '/admin/users', label: 'portalNav.users', icon: Users },
      { to: '/admin/applications', label: 'portalNav.applications', icon: UserCheck },
      { to: '/admin/courses', label: 'portalNav.courses', icon: FolderOpen },
      { to: '/admin/categories', label: 'portalNav.categories', icon: Tags },
      { to: '/admin/homepage', label: 'portalNav.homepage', icon: PanelsTopLeft },
      { to: '/admin/blog', label: 'portalNav.blog', icon: FileText },
      { to: '/admin/announcements', label: 'portalNav.announcements', icon: Megaphone },
      { to: '/admin/certificates', label: 'portalNav.certificates', icon: Award },
      { to: '/admin/messages', label: 'portalNav.messages', icon: Inbox },
      { to: '/admin/settings', label: 'portalNav.siteSettings', icon: Settings },
    ],
  },
]

function Sidebar({ onNavigate }) {
  const { profile, signOut } = useAuth()
  const { t } = useI18n()
  const sections = SECTIONS.filter((s) => s.roles.includes(profile?.role))
  // Teachers and admins see their own area first.
  const ordered = profile?.role === 'student' ? sections : [...sections.slice(1).reverse(), sections[0]]

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {ordered.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t(section.title)}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {t(item.label)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <Link to="/courses" onClick={onNavigate} className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <ExternalLink className="h-[18px] w-[18px]" /> {t('portalNav.browseCourses')}
        </Link>
        <NavLink
          to="/settings/profile"
          onClick={onNavigate}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50')}
        >
          <Settings className="h-[18px] w-[18px]" /> {t('portalNav.profileSettings')}
        </NavLink>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700">
          <LogOut className="h-[18px] w-[18px] rtl:-scale-x-100" /> {t('nav.signOut')}
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  const { profile } = useAuth()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen bg-slate-50">
      <SetupBanner />
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 border-e border-slate-200 lg:block">
        <Sidebar />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-72 shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute end-3 top-4 z-10 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label={t('nav.closeMenu')}>
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label={t('nav.openMenu')}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-slate-500 lg:block">
            {t('portalNav.welcomeBack')} <span className="font-semibold text-slate-800">{profile?.full_name?.split(' ')[0] || t('portalNav.there')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/announcements" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label={t('portalNav.announcements')}>
              <Bell className="h-5 w-5" />
            </Link>
            <Link to="/settings/profile" className="flex items-center gap-3">
              <div className="hidden text-end sm:block">
                <p className="text-sm font-semibold leading-tight text-slate-800">{profile?.full_name || t('portalNav.yourProfile')}</p>
                <Badge tone={profile?.role === 'admin' ? 'violet' : profile?.role === 'teacher' ? 'blue' : 'slate'} className="mt-0.5 capitalize">
                  {profile?.role && t(`roles.${profile.role}`)}
                </Badge>
              </div>
              <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
            </Link>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
