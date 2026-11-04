import { Link } from 'react-router-dom'
import {
  ArrowRight, Award, BadgeCheck, BookOpen, CirclePlay, Clock, GraduationCap, Heart, HeartHandshake, Sparkles,
  Target, Users,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { DEFAULT_CATEGORIES, FAQS } from '../../lib/constants'
import { cn, formatDate, formatNumber } from '../../lib/utils'
import { COURSE_CARD_SELECT, CategoryIcon, CourseCard, categoryColor } from '../../components/shared'
import { Avatar, Button } from '../../components/ui'

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
      <div className="container-page relative grid items-center gap-14 pb-20 pt-14 lg:grid-cols-2 lg:pb-28 lg:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
            <HeartHandshake className="h-3.5 w-3.5" /> Non-profit · 100% free learning
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            Learn the skills that <span className="relative whitespace-nowrap text-brand-600">open doors<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none"><path d="M2 9c60-6 150-8 296-3" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" /></svg></span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Free, practical courses in AI, graphic design, digital marketing, English, freelancing and more, taught by real practitioners. Learn at your own pace and earn verified certificates.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/courses" size="lg">
              Explore courses <ArrowRight className="h-5 w-5" />
            </Button>
            <Button to="/signup" size="lg" variant="secondary">
              Create free account
            </Button>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-slate-200 pt-6">
            {[
              ['100%', 'Free forever'],
              ['10+', 'Skill tracks'],
              ['24/7', 'Self-paced'],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="font-display text-2xl font-bold text-slate-900">{v}</dt>
                <dd className="text-sm text-slate-500">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Product collage */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl" />
          <div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-brand-900/10">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="absolute right-5 top-5 rounded-md bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">Module 2 · Lesson 4</div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <CirclePlay className="h-16 w-16 opacity-90" strokeWidth={1.25} />
                <p className="mt-3 font-display text-lg font-semibold">Prompt Engineering Essentials</p>
              </div>
              <div className="absolute inset-x-5 bottom-4">
                <div className="h-1.5 rounded-full bg-white/20">
                  <div className="h-full w-2/3 rounded-full bg-amber-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              {['Introduction to AI tools', 'Writing great prompts', 'Automating your work'].map((t, i) => (
                <div key={t} className={cn('rounded-lg border p-2.5', i === 1 ? 'border-brand-200 bg-brand-50' : 'border-slate-100')}>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">Lesson {i + 3}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-700">{t}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -left-4 -top-6 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 pr-5 shadow-xl sm:flex lg:-left-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Certificate earned</p>
              <p className="text-sm font-semibold text-slate-900">Graphic Design Basics</p>
            </div>
          </div>
          <div className="absolute -bottom-6 right-4 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 pr-5 shadow-xl sm:flex">
            <div className="flex -space-x-2">
              {['Amina K', 'Bilal R', 'Sara M'].map((n) => (
                <Avatar key={n} name={n} size="sm" />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Learners worldwide</p>
              <p className="text-xs text-slate-500">studying right now</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ImpactStats() {
  const { data } = useQuery(async () => unwrap(await supabase.rpc('public_stats')), [])
  const items = [
    { icon: Users, label: 'Learners enrolled', value: data?.students },
    { icon: GraduationCap, label: 'Volunteer teachers', value: data?.teachers },
    { icon: BookOpen, label: 'Free courses', value: data?.courses },
    { icon: BadgeCheck, label: 'Certificates issued', value: data?.certificates },
  ]
  if (!data || items.every((i) => !i.value)) return null
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="container-page grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <i.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-slate-900">{formatNumber(i.value)}</p>
              <p className="text-sm text-slate-500">{i.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionHeading({ eyebrow, title, description, action, center }) {
  return (
    <div className={cn('mb-10 flex flex-col gap-4', center ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between')}>
      <div className={cn(center && 'max-w-2xl')}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 max-w-2xl text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function Categories() {
  const { data } = useQuery(async () => unwrap(await supabase.from('categories').select('*').order('sort_order')), [])
  const categories = data?.length ? data : DEFAULT_CATEGORIES
  return (
    <section className="py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="What you can learn"
          title="Skills for the modern economy"
          description="Pick a track and start today. Every course is designed to help you earn, create or grow."
          action={<Button to="/courses" variant="secondary">All courses <ArrowRight className="h-4 w-4" /></Button>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((cat) => {
            const c = categoryColor(cat.color)
            return (
              <Link key={cat.slug} to={`/courses?category=${cat.slug}`} className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg ring-1', c.bg, c.text, c.ring)}>
                  <CategoryIcon name={cat.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900 group-hover:text-brand-700">{cat.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{cat.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FeaturedCourses() {
  const { data } = useQuery(async () => {
    const courses = unwrap(
      await supabase.from('courses').select(COURSE_CARD_SELECT).eq('status', 'published').order('featured', { ascending: false }).order('published_at', { ascending: false }).limit(6),
    )
    const counts = unwrap(await supabase.rpc('course_enrollment_counts'))
    return { courses, counts: Object.fromEntries((counts || []).map((c) => [c.course_id, c.students])) }
  }, [])
  if (!data?.courses?.length) return null
  return (
    <section className="bg-slate-50 py-20">
      <div className="container-page">
        <SectionHeading eyebrow="Popular right now" title="Start with a featured course" action={<Button to="/courses" variant="secondary">Browse all <ArrowRight className="h-4 w-4" /></Button>} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.courses.map((c) => (
            <CourseCard key={c.id} course={c} students={data.counts[c.id]} />
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { icon: Users, title: 'Create your free account', text: 'Sign up in under a minute. No fees, no credit card, ever.' },
    { icon: CirclePlay, title: 'Learn at your own pace', text: 'Watch video lessons, read notes, take quizzes and submit practical assignments.' },
    { icon: Award, title: 'Earn a verified certificate', text: 'Complete the course to receive a certificate that anyone can verify online.' },
  ]
  return (
    <section className="py-20">
      <div className="container-page">
        <SectionHeading center eyebrow="How it works" title="From first lesson to certificate" description="A simple, structured path designed for busy people learning on any device." />
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-7">
              <span className="absolute right-6 top-6 font-display text-5xl font-extrabold text-slate-100">0{i + 1}</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Mission() {
  return (
    <section className="relative overflow-hidden bg-brand-950 py-20 text-white">
      <div className="absolute inset-0 bg-grid opacity-[0.07] invert" />
      <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
      <div className="container-page relative grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">Our mission</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Quality education shouldn't depend on what you can afford</h2>
          <p className="mt-5 text-lg leading-relaxed text-brand-100/90">
            SkillRise Academy exists to give everyone, everywhere, access to the digital skills that lead to jobs, freelance income and new businesses. Our teachers volunteer their expertise, and generous donors keep the platform running.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/donate" variant="accent" size="lg">
              <Heart className="h-5 w-5" /> Donate today
            </Button>
            <Button to="/about" size="lg" className="bg-white/10 text-white ring-1 ring-inset ring-white/20 hover:bg-white/15">
              Learn about us
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Target, title: 'Job-ready skills', text: 'Practical, project-based lessons focused on real outcomes.' },
            { icon: Sparkles, title: 'Always free', text: 'No paywalls, no upsells. Every learner gets the full course.' },
            { icon: GraduationCap, title: 'Expert volunteers', text: 'Taught by professionals who give back to their communities.' },
            { icon: Clock, title: 'Learn anywhere', text: 'Mobile-friendly lessons that fit around work and family.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <f.icon className="h-6 w-6 text-amber-300" />
              <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-brand-100/80">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function LatestPosts() {
  const { data } = useQuery(
    async () =>
      unwrap(
        await supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, cover_url, published_at, author:profiles!blog_posts_author_id_fkey(full_name, avatar_url)')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(3),
      ),
    [],
  )
  if (!data?.length) return null
  return (
    <section className="bg-slate-50 py-20">
      <div className="container-page">
        <SectionHeading eyebrow="From our teachers" title="Latest from the blog" action={<Button to="/blog" variant="secondary">Read the blog <ArrowRight className="h-4 w-4" /></Button>} />
        <div className="grid gap-6 md:grid-cols-3">
          {data.map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function BlogCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition hover:shadow-lift">
      {post.cover_url ? (
        <img src={post.cover_url} alt="" className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-slate-100 to-brand-100">
          <BookOpen className="h-10 w-10 text-brand-300" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-slate-500">{formatDate(post.published_at)}</p>
        <h3 className="mt-2 line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Avatar src={post.author?.avatar_url} name={post.author?.full_name} size="xs" />
          <span className="text-xs font-medium text-slate-600">{post.author?.full_name}</span>
        </div>
      </div>
    </Link>
  )
}

function Faq() {
  return (
    <section className="py-20">
      <div className="container-page grid gap-12 lg:grid-cols-3">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold">Questions, answered</h2>
          <p className="mt-3 text-slate-600">
            Can't find what you're looking for? <Link to="/contact" className="font-semibold text-brand-600 hover:underline">Contact our team</Link>.
          </p>
        </div>
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white lg:col-span-2">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-slate-900">
                {f.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function TeachCta() {
  return (
    <section className="pb-20">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-700 px-8 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="relative max-w-xl">
            <h2 className="text-3xl font-bold text-white">Share what you know. Change a life.</h2>
            <p className="mt-3 text-brand-100">Join our community of volunteer teachers and help thousands of learners build a better future.</p>
          </div>
          <div className="relative mt-8 flex gap-3 lg:mt-0">
            <Button to="/teach" variant="white" size="lg">
              Become a teacher <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <ImpactStats />
      <Categories />
      <FeaturedCourses />
      <HowItWorks />
      <Mission />
      <LatestPosts />
      <Faq />
      <TeachCta />
    </>
  )
}
