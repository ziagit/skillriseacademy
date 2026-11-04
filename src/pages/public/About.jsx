import { ArrowRight, Eye, Globe2, HandHeart, Lightbulb, Scale, Target, Users } from 'lucide-react'
import { Button } from '../../components/ui'

export function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50/70 to-white">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="container-page relative py-16 text-center sm:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">{title}</h1>
        {description && <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">{description}</p>}
        {children}
      </div>
    </section>
  )
}

export default function About() {
  const values = [
    { icon: HandHeart, title: 'Free for everyone', text: 'Education is a right, not a privilege. We will never charge learners for our courses.' },
    { icon: Target, title: 'Practical outcomes', text: 'Every course is designed to help learners earn, create or grow, not just to watch videos.' },
    { icon: Scale, title: 'Inclusive by design', text: 'Mobile-friendly, low-bandwidth lessons in plain language, for learners of every background.' },
    { icon: Lightbulb, title: 'Learn by doing', text: 'Quizzes, assignments and feedback from teachers turn knowledge into real skill.' },
  ]
  return (
    <>
      <PageHero
        eyebrow="About SkillRise Academy"
        title="Helping people rise through skills"
        description="We're a non-profit online academy that gives anyone with an internet connection free access to the digital skills today's economy demands."
      />

      <section className="container-page grid gap-12 py-20 lg:grid-cols-2">
        <div className="space-y-5 text-lg leading-relaxed text-slate-600">
          <h2 className="text-3xl font-bold text-slate-900">Our story</h2>
          <p>
            SkillRise Academy started with a simple belief: talent is everywhere, but opportunity is not. Millions of people are ready to work, freelance or start a business, but they can't afford expensive courses.
          </p>
          <p>
            So we built a place where professionals volunteer to teach what they know, from AI and graphic design to English, journalism and e-commerce, and where learners can study for free, at their own pace, on any device.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-brand-600 p-7 text-white">
            <Target className="h-7 w-7 text-amber-300" />
            <h3 className="mt-4 text-xl font-bold text-white">Mission</h3>
            <p className="mt-2 text-brand-100">To provide free, high-quality skills education that helps people find work, earn income and build better lives.</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-7 text-white">
            <Eye className="h-7 w-7 text-amber-300" />
            <h3 className="mt-4 text-xl font-bold text-white">Vision</h3>
            <p className="mt-2 text-slate-300">A world where anyone, anywhere, can learn the skills they need to thrive, regardless of income or location.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-7 sm:col-span-2">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Globe2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Global, online, community-powered</h3>
                <p className="text-sm text-slate-600">Our teachers and learners come from many countries and backgrounds.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Our values</p>
            <h2 className="mt-2 text-3xl font-bold">What guides our work</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <v.icon className="h-7 w-7 text-brand-600" />
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-8">
            <Users className="h-8 w-8 text-brand-600" />
            <h3 className="mt-4 text-2xl font-bold">Teach with us</h3>
            <p className="mt-2 text-slate-600">Share your expertise with learners who need it most. We'll support you every step of the way.</p>
            <Button to="/teach" className="mt-6">Become a teacher <ArrowRight className="h-4 w-4" /></Button>
          </div>
          <div className="rounded-2xl bg-amber-50 p-8 ring-1 ring-amber-200">
            <HandHeart className="h-8 w-8 text-amber-600" />
            <h3 className="mt-4 text-2xl font-bold">Fund the mission</h3>
            <p className="mt-2 text-slate-700">Your donation keeps every course free and helps us reach more learners.</p>
            <Button to="/donate" variant="accent" className="mt-6">Donate now <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </section>
    </>
  )
}
