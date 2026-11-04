import { useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowRight, CircleCheck, Clock, HeartHandshake, Megaphone, PenLine, Presentation, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDate } from '../../lib/utils'
import { Button, Input, StatusBadge, Textarea } from '../../components/ui'
import { PageHero } from './About'

export default function Teach() {
  const { user, isTeacher } = useAuth()
  const perks = [
    { icon: Users, title: 'Reach thousands', text: 'Teach motivated learners from around the world.' },
    { icon: Presentation, title: 'Simple course builder', text: 'Add modules, video lessons, quizzes and assignments in minutes.' },
    { icon: PenLine, title: 'Write on our blog', text: 'Share your expertise and build your personal brand.' },
    { icon: HeartHandshake, title: 'Make real impact', text: 'Help people land jobs, freelance clients and start businesses.' },
  ]
  const steps = ['Apply with your expertise', 'Our team reviews your application', 'Build your course with our tools', 'Submit for review and go live']

  return (
    <>
      <PageHero
        eyebrow="Teach on SkillRise"
        title="Volunteer your skills. Change lives."
        description="Join a community of professionals giving back by teaching free courses to learners who need them most."
      >
        <div className="mt-8 flex justify-center gap-3">
          <Button href="#apply" size="lg">Apply to teach <ArrowRight className="h-5 w-5" /></Button>
        </div>
      </PageHero>

      <section className="container-page py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.title} className="rounded-2xl border border-slate-200 p-6">
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
            <h2 className="text-3xl font-bold">How it works</h2>
            <ol className="mt-8 space-y-6">
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 font-display font-bold text-white">{i + 1}</span>
                  <span className="font-medium text-slate-800">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
              <Megaphone className="h-6 w-6 text-amber-500" />
              <p className="mt-3 text-sm text-slate-600">
                We welcome teachers in AI, graphic design, digital marketing, content creation, journalism, computer skills, English, e-commerce, painting, freelancing and more.
              </p>
            </div>
          </div>
          <div id="apply" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            {!user ? (
              <div className="py-6 text-center">
                <h3 className="text-xl font-bold">Ready to apply?</h3>
                <p className="mt-2 text-slate-600">Create a free account and tell us about your expertise. It only takes two minutes.</p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button to="/signup?teach=1">Create account &amp; apply</Button>
                  <Button to="/login" state={{ from: '/teach' }} variant="secondary">Log in</Button>
                </div>
              </div>
            ) : isTeacher ? (
              <div className="py-6 text-center">
                <CircleCheck className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="mt-4 text-xl font-bold">You're already a teacher</h3>
                <Button to="/teacher/courses" className="mt-6">Go to my courses</Button>
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
        <h3 className="mt-4 text-xl font-bold">Application received</h3>
        <p className="mt-2 text-slate-600">Submitted {formatDate(existing.created_at)}. We'll notify you once it has been reviewed.</p>
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
    toast.success('Application submitted!')
    reload()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h3 className="text-xl font-bold">Teacher application</h3>
        {existing?.status === 'rejected' && <p className="mt-1 text-sm text-amber-700">Your previous application wasn't approved. You're welcome to apply again.</p>}
      </div>
      <Input label="Area of expertise" required placeholder="e.g. Graphic design, Amazon FBA, IELTS English" value={form.expertise} onChange={set('expertise')} />
      <Textarea label="Professional experience" rows={4} placeholder="Tell us about your background and work experience" value={form.experience} onChange={set('experience')} />
      <Input label="Portfolio or LinkedIn URL" type="url" placeholder="https://" value={form.portfolio_url} onChange={set('portfolio_url')} />
      <Textarea label="Why do you want to teach with SkillRise?" rows={3} value={form.motivation} onChange={set('motivation')} />
      <Button type="submit" loading={busy} className="w-full" size="lg">Submit application</Button>
    </form>
  )
}
