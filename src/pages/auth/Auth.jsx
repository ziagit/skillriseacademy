import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Award, BookOpen, MailCheck } from 'lucide-react'
import { homePathFor, useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { supabase } from '../../lib/supabase'
import { errorMessage } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { LanguageSwitcher, Logo } from '../../components/shared'
import { Button, Checkbox, Input, PageLoader, Textarea } from '../../components/ui'
import { SetupBanner, SocialLinks } from '../../layouts/PublicLayout'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function AuthShell({ title, subtitle, children, footer }) {
  const { t } = useI18n()
  const { settings } = useSettings()
  return (
    <div className="flex min-h-screen flex-col">
      <SetupBanner />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="flex flex-col px-6 py-8 sm:px-12">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <LanguageSwitcher />
          </div>
          <div className="mx-auto mt-3 w-full max-w-sm text-center lg:hidden">
            <p dir="rtl" className="font-semibold text-brand-700">{t('auth.slogan.fa')}</p>
            <p dir="ltr" className="mt-1 text-sm font-medium text-slate-600">{t('auth.slogan.en')}</p>
            <SocialLinks settings={settings} className="mt-3 flex items-center justify-center gap-2" itemClassName="h-8 w-8" iconClassName="h-4 w-4" />
          </div>
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-slate-600">{footer}</div>}
          </div>
        </div>
        <div className="relative hidden overflow-hidden bg-brand-600 lg:block">
          <div className="absolute -end-24 -top-24 h-96 w-96 rounded-full bg-brand-500/60" />
          <div className="absolute -bottom-32 -start-24 h-96 w-96 rounded-full bg-brand-800/50" />
          <div className="relative flex h-full flex-col justify-center p-16 text-white">
            <div className="grid max-w-xl grid-cols-2 gap-5">
              <p dir="rtl" className="font-display text-xl font-bold leading-relaxed text-white">{t('auth.slogan.fa')}</p>
              <p dir="ltr" className="font-display text-xl font-bold leading-relaxed text-white">{t('auth.slogan.en')}</p>
            </div>
            <div className="mt-14 grid max-w-md grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/10 p-5 ring-1 ring-white/15">
                <BookOpen className="h-6 w-6 text-amber-300" />
                <p className="mt-3 font-semibold">{t('auth.freeCourses')}</p>
                <p className="text-sm text-brand-100">{t('auth.freeCoursesHint')}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-5 ring-1 ring-white/15">
                <Award className="h-6 w-6 text-amber-300" />
                <p className="mt-3 font-semibold">{t('auth.certificates')}</p>
                <p className="text-sm text-brand-100">{t('auth.certificatesHint')}</p>
              </div>
            </div>
            <p className="mt-10 text-sm font-medium text-brand-100">{t('auth.follow')}</p>
            <SocialLinks settings={settings} light className="mt-3 flex items-center gap-2" itemClassName="h-10 w-10" iconClassName="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { user, profile, loading } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <PageLoader />
  if (user && profile) return <Navigate to={location.state?.from || homePathFor(profile.role)} replace />

  const submit = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) return toast.error(t('auth.errors.email'))
    if (!password) return toast.error(t('auth.errors.password'))
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) toast.error(errorMessage(error))
  }

  return (
    <AuthShell title={t('auth.login.title')} subtitle={t('auth.login.subtitle')} footer={<>{t('auth.login.new')} <Link to="/signup" className="font-semibold text-brand-600 hover:underline">{t('auth.login.create')}</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label={t('auth.email')} type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <Input label={t('auth.password')} type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Link to="/forgot-password" className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">{t('auth.login.forgot')}</Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={busy}>{t('nav.login')}</Button>
      </form>
    </AuthShell>
  )
}

export function Signup() {
  const { user, profile } = useAuth()
  const { t } = useI18n()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', apply_teacher: params.get('teach') === '1', expertise: '', experience: '', portfolio_url: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  if (user && profile) return <Navigate to={homePathFor(profile.role)} replace />

  const submit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) return toast.error(t('auth.errors.name'))
    if (!EMAIL_RE.test(form.email.trim())) return toast.error(t('auth.errors.email'))
    if (form.password.length < 8) return toast.error(t('auth.errors.passwordLength'))
    if (form.apply_teacher && !form.expertise.trim()) return toast.error(t('auth.errors.expertise'))
    setBusy(true)
    const { email, password, apply_teacher, ...rest } = form
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { ...rest, apply_teacher: apply_teacher ? 'true' : 'false' },
      },
    })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    if (data.session) toast.success(t('auth.signup.welcome'))
    else setDone(true)
  }

  if (done) {
    return (
      <AuthShell title={t('auth.signup.checkEmail')} footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">{t('auth.backToLogin')}</Link>}>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="mt-3 text-sm text-emerald-900">
            {t('auth.signup.sentBefore')} <strong dir="ltr">{form.email}</strong>{t('auth.signup.sentAfter')}
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth.signup.title')}
      subtitle={t('auth.signup.subtitle')}
      footer={<>{t('auth.signup.haveAccount')} <Link to="/login" className="font-semibold text-brand-600 hover:underline">{t('nav.login')}</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label={t('contact.fullName')} required autoComplete="name" value={form.full_name} onChange={set('full_name')} hint={t('auth.signup.nameHint')} />
        <Input label={t('auth.email')} type="email" dir="ltr" required autoComplete="email" value={form.email} onChange={set('email')} />
        <Input label={t('auth.password')} type="password" dir="ltr" required autoComplete="new-password" minLength={8} value={form.password} onChange={set('password')} hint={t('auth.signup.passwordHint')} />
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Checkbox label={t('auth.signup.alsoTeach')} description={t('auth.signup.alsoTeachHint')} checked={form.apply_teacher} onChange={set('apply_teacher')} />
          {form.apply_teacher && (
            <div className="mt-4 space-y-4">
              <Input label={t('teach.expertise')} required placeholder={t('auth.signup.expertisePlaceholder')} value={form.expertise} onChange={set('expertise')} />
              <Textarea label={t('auth.signup.experience')} rows={3} value={form.experience} onChange={set('experience')} />
              <Input label={t('auth.signup.portfolio')} type="url" dir="ltr" placeholder="https://" value={form.portfolio_url} onChange={set('portfolio_url')} />
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" size="lg" loading={busy}>{t('auth.signup.submit')}</Button>
        <p className="text-center text-xs text-slate-500">{t('auth.signup.agree')}</p>
      </form>
    </AuthShell>
  )
}

export function ForgotPassword() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) return toast.error(t('auth.errors.email'))
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    setSent(true)
  }
  return (
    <AuthShell title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">{t('auth.backToLogin')}</Link>}>
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">{t('auth.forgot.sent', { email })}</div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Input label={t('auth.email')} type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full" size="lg" loading={busy}>{t('auth.forgot.submit')}</Button>
        </form>
      )}
    </AuthShell>
  )
}

export function ResetPassword() {
  const { session, profile } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // The recovery link signs the user in; wait for that session.
    if (session) setReady(true)
  }, [session])

  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return toast.error(t('auth.errors.passwordLength'))
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success(t('auth.reset.updated'))
    navigate(homePathFor(profile?.role))
  }

  return (
    <AuthShell title={t('auth.reset.title')}>
      {!ready ? (
        <p className="text-sm text-slate-600">{t('auth.reset.openLink')} <Link to="/forgot-password" className="font-semibold text-brand-600">{t('auth.reset.requestNew')}</Link>{t('home.faq.period')}</p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Input label={t('auth.reset.newPassword')} type="password" dir="ltr" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" className="w-full" size="lg" loading={busy}>{t('auth.reset.submit')}</Button>
        </form>
      )}
    </AuthShell>
  )
}
