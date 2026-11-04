import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Award, BookOpen, MailCheck, Quote } from 'lucide-react'
import { homePathFor, useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { errorMessage } from '../../lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
import { Logo } from '../../components/shared'
import { Button, Checkbox, Input, PageLoader, Textarea } from '../../components/ui'
import { SetupBanner } from '../../layouts/PublicLayout'

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SetupBanner />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="flex flex-col px-6 py-8 sm:px-12">
          <Logo />
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-slate-600">{footer}</div>}
          </div>
        </div>
        <div className="relative hidden overflow-hidden bg-brand-950 lg:block">
          <div className="absolute inset-0 bg-grid opacity-[0.08] invert" />
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/50 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative flex h-full flex-col justify-center p-16 text-white">
            <Quote className="h-10 w-10 text-amber-300" />
            <p className="mt-6 font-display text-3xl font-semibold leading-snug text-white">
              "The beautiful thing about learning is that nobody can take it away from you."
            </p>
            <p className="mt-4 text-brand-200">B.B. King</p>
            <div className="mt-14 grid max-w-md grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <BookOpen className="h-6 w-6 text-amber-300" />
                <p className="mt-3 font-semibold">Free courses</p>
                <p className="text-sm text-brand-200">in 10+ in-demand skills</p>
              </div>
              <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <Award className="h-6 w-6 text-amber-300" />
                <p className="mt-3 font-semibold">Certificates</p>
                <p className="text-sm text-brand-200">verified online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <PageLoader />
  if (user && profile) return <Navigate to={location.state?.from || homePathFor(profile.role)} replace />

  const submit = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) return toast.error('Enter a valid email address')
    if (!password) return toast.error('Enter your password')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) toast.error(errorMessage(error))
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue learning." footer={<>New to SkillRise? <Link to="/signup" className="font-semibold text-brand-600 hover:underline">Create a free account</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Link to="/forgot-password" className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={busy}>Log in</Button>
      </form>
    </AuthShell>
  )
}

export function Signup() {
  const { user, profile } = useAuth()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', apply_teacher: params.get('teach') === '1', expertise: '', experience: '', portfolio_url: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  if (user && profile) return <Navigate to={homePathFor(profile.role)} replace />

  const submit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) return toast.error('Enter your full name')
    if (!EMAIL_RE.test(form.email.trim())) return toast.error('Enter a valid email address')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    if (form.apply_teacher && !form.expertise.trim()) return toast.error('Tell us your area of expertise')
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
    if (data.session) toast.success('Welcome to SkillRise!')
    else setDone(true)
  }

  if (done) {
    return (
      <AuthShell title="Check your email" footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to log in</Link>}>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="mt-3 text-sm text-emerald-900">
            We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your free account"
      subtitle="Join thousands of learners building skills for the future."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label="Full name" required autoComplete="name" value={form.full_name} onChange={set('full_name')} hint="This name appears on your certificates." />
        <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        <Input label="Password" type="password" required autoComplete="new-password" minLength={8} value={form.password} onChange={set('password')} hint="At least 8 characters." />
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Checkbox label="I also want to teach on SkillRise" description="Your application will be reviewed by our team." checked={form.apply_teacher} onChange={set('apply_teacher')} />
          {form.apply_teacher && (
            <div className="mt-4 space-y-4">
              <Input label="Area of expertise" required placeholder="e.g. Digital marketing" value={form.expertise} onChange={set('expertise')} />
              <Textarea label="Experience" rows={3} value={form.experience} onChange={set('experience')} />
              <Input label="Portfolio / LinkedIn" type="url" placeholder="https://" value={form.portfolio_url} onChange={set('portfolio_url')} />
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" size="lg" loading={busy}>Create account</Button>
        <p className="text-center text-xs text-slate-500">By creating an account you agree to learn, share and respect our community.</p>
      </form>
    </AuthShell>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) return toast.error('Enter a valid email address')
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    setSent(true)
  }
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a secure link to set a new password." footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to log in</Link>}>
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">If an account exists for {email}, a reset link is on its way.</div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full" size="lg" loading={busy}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  )
}

export function ResetPassword() {
  const { session, profile } = useAuth()
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
    if (password.length < 8) return toast.error('Password must be at least 8 characters')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success('Password updated')
    navigate(homePathFor(profile?.role))
  }

  return (
    <AuthShell title="Choose a new password">
      {!ready ? (
        <p className="text-sm text-slate-600">Open the reset link from your email to continue. If it has expired, <Link to="/forgot-password" className="font-semibold text-brand-600">request a new one</Link>.</p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Input label="New password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" className="w-full" size="lg" loading={busy}>Update password</Button>
        </form>
      )}
    </AuthShell>
  )
}
