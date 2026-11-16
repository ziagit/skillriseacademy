import { useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowRight, CircleCheck, Clock, HeartHandshake, Megaphone, PenLine, Presentation, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDate } from '../../lib/utils'
import { Button, Input, StatusBadge, Textarea } from '../../components/ui'
import { useI18n } from '../../lib/i18n'
import { PageHero } from './About'

export default function Teach() {
  const { user, isTeacher } = useAuth()
  const { t } = useI18n()
  const perks = [
    { icon: Users, title: t('teach.p1Title'), text: t('teach.p1Text') },
    { icon: Presentation, title: t('teach.p2Title'), text: t('teach.p2Text') },
    { icon: PenLine, title: t('teach.p3Title'), text: t('teach.p3Text') },
    { icon: HeartHandshake, title: t('teach.p4Title'), text: t('teach.p4Text') },
  ]
  const steps = t('teach.steps')

  return (
    <>
      <PageHero
        eyebrow={t('teach.eyebrow')}
        title={t('teach.title')}
        description={t('teach.description')}
      >
        <div className="mt-8 flex justify-center gap-3">
          <Button href="#apply" size="lg">{t('teach.apply')} <ArrowRight className="h-5 w-5 rtl:-scale-x-100" /></Button>
        </div>
      </PageHero>

      <section className="container-page py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.title} className="rounded-xl border border-slate-200 p-6">
              <p.icon className="h-7 w-7 text-brand-600" />
              <h3 className="mt-4 font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">{t('home.how.eyebrow')}</h2>
            <ol className="mt-8 space-y-6">
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 font-display font-bold text-white">{t('common.number', { n: i + 1 })}</span>
                  <span className="font-medium text-slate-800">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
              <Megaphone className="h-6 w-6 text-amber-500" />
              <p className="mt-3 text-sm text-slate-600">
                {t('teach.welcome')}
              </p>
            </div>
          </div>
          <div id="apply" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            {!user ? (
              <div className="py-6 text-center">
                <h3 className="text-xl font-bold">{t('teach.ready')}</h3>
                <p className="mt-2 text-slate-600">{t('teach.readyText')}</p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button to="/signup?teach=1">{t('teach.createAndApply')}</Button>
                  <Button to="/login" state={{ from: '/teach' }} variant="secondary">{t('nav.login')}</Button>
                </div>
              </div>
            ) : isTeacher ? (
              <div className="py-6 text-center">
                <CircleCheck className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="mt-4 text-xl font-bold">{t('teach.already')}</h3>
                <Button to="/teacher/courses" className="mt-6">{t('teach.goToCourses')}</Button>
              </div>
            ) : (
              <ApplicationForm userId={user.id} />
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function ApplicationForm({ userId }) {
  const { t } = useI18n()
  const [form, setForm] = useState({ expertise: '', experience: '', portfolio_url: '', motivation: '' })
  const [busy, setBusy] = useState(false)
  const { data: existing, loading, reload } = useQuery(
    async () => unwrap(await supabase.from('teacher_applications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()),
    [userId],
  )
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  if (loading) return null
  if (existing && existing.status !== 'rejected') {
    return (
      <div className="py-6 text-center">
        <Clock className="mx-auto h-12 w-12 text-amber-500" />
        <h3 className="mt-4 text-xl font-bold">{t('teach.received')}</h3>
        <p className="mt-2 text-slate-600">{t('teach.receivedText', { date: formatDate(existing.created_at) })}</p>
        <div className="mt-4"><StatusBadge status={existing.status} /></div>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('teacher_applications').insert({ ...form, user_id: userId })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success(t('teach.submitted'))
    reload()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h3 className="text-xl font-bold">{t('teach.formTitle')}</h3>
        {existing?.status === 'rejected' && <p className="mt-1 text-sm text-amber-700">{t('teach.rejectedBefore')}</p>}
      </div>
      <Input label={t('teach.expertise')} required placeholder={t('teach.expertisePlaceholder')} value={form.expertise} onChange={set('expertise')} />
      <Textarea label={t('teach.experience')} rows={4} placeholder={t('teach.experiencePlaceholder')} value={form.experience} onChange={set('experience')} />
      <Input label={t('teach.portfolio')} type="url" dir="ltr" placeholder="https://" value={form.portfolio_url} onChange={set('portfolio_url')} />
      <Textarea label={t('teach.motivation')} rows={3} value={form.motivation} onChange={set('motivation')} />
      <Button type="submit" loading={busy} className="w-full" size="lg">{t('teach.submit')}</Button>
    </form>
  )
}
