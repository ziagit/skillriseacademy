import { Link } from 'react-router-dom'
import {
  ArrowRight, Award, BadgeCheck, BookOpen, CirclePlay, Clock, GraduationCap, Heart, HeartHandshake, Sparkles,
  Target, Users,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { DEFAULT_CATEGORIES } from '../../lib/constants'
import { cn, formatDate, formatNumber } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { COURSE_CARD_SELECT, CategoryIcon, CourseCard, categoryColor } from '../../components/shared'
import { Avatar, Button } from '../../components/ui'

function Hero() {
  const { t } = useI18n()
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
      <div className="container-page relative grid items-center gap-14 pb-20 pt-14 lg:grid-cols-2 lg:pb-28 lg:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
            <HeartHandshake className="h-3.5 w-3.5" /> {t('home.hero.badge')}
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            {t('home.hero.titleBefore')}<span className="relative whitespace-nowrap text-brand-600">{t('home.hero.titleHighlight')}<svg className="absolute -bottom-2 start-0 w-full" viewBox="0 0 300 12" fill="none"><path d="M2 9c60-6 150-8 296-3" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" /></svg></span>{t('home.hero.titleAfter')}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            {t('home.hero.subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/courses" size="lg">
              {t('home.hero.explore')} <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
            </Button>
            <Button to="/signup" size="lg" variant="secondary">
              {t('home.hero.createAccount')}
            </Button>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-slate-200 pt-6">
            {[
              [t('home.hero.stat1Value'), t('home.hero.stat1')],
              [t('home.hero.stat2Value'), t('home.hero.stat2')],
              [t('home.hero.stat3Value'), t('home.hero.stat3')],
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
              <div className="absolute end-5 top-5 rounded-md bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">{t('home.mock.position')}</div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <CirclePlay className="h-16 w-16 opacity-90" strokeWidth={1.25} />
                <p className="mt-3 font-display text-lg font-semibold">{t('home.mock.course')}</p>
              </div>
              <div className="absolute inset-x-5 bottom-4">
                <div className="h-1.5 rounded-full bg-white/20">
                  <div className="h-full w-2/3 rounded-full bg-amber-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              {t('home.mock.lessons').map((title, i) => (
                <div key={title} className={cn('rounded-lg border p-2.5', i === 1 ? 'border-brand-200 bg-brand-50' : 'border-slate-100')}>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">{t('home.mock.lesson', { n: i + 3 })}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-700">{title}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -start-4 -top-6 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 pe-5 shadow-xl sm:flex lg:-start-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('home.mock.certEarned')}</p>
              <p className="text-sm font-semibold text-slate-900">{t('home.mock.certCourse')}</p>
            </div>
          </div>
          <div className="absolute -bottom-6 end-4 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 pe-5 shadow-xl sm:flex">
            <div className="flex -space-x-2">
              {t('home.mock.names').map((n) => (
                <Avatar key={n} name={n} size="sm" />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{t('home.mock.learners')}</p>
              <p className="text-xs text-slate-500">{t('home.mock.studying')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ImpactStats() {
  const { t } = useI18n()
  const { data } = useQuery(async () => unwrap(await supabase.rpc('public_stats')), [])
  const items = [
    { icon: Users, label: t('home.stats.learners'), value: data?.students },
    { icon: GraduationCap, label: t('home.stats.teachers'), value: data?.teachers },
    { icon: BookOpen, label: t('home.stats.courses'), value: data?.courses },
    { icon: BadgeCheck, label: t('home.stats.certificates'), value: data?.certificates },
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
  const { t } = useI18n()
  const { data } = useQuery(async () => unwrap(await supabase.from('categories').select('*').order('sort_order')), [])
  const categories = data?.length ? data : DEFAULT_CATEGORIES
  return (
    <section className="py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow={t('home.categories.eyebrow')}
          title={t('home.categories.title')}
          description={t('home.categories.description')}
          action={<Button to="/courses" variant="secondary">{t('home.categories.all')} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" /></Button>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((cat) => {
            const c = categoryColor(cat.color)
            return (
              <Link key={cat.slug} to={`/courses?category=${cat.slug}`} className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg ring-1', c.bg, c.text, c.ring)}>
                  <CategoryIcon name={cat.icon} className="h-5 w-5" />
                </div>
                <h3 dir="auto" className="mt-4 text-sm font-semibold text-slate-900 group-hover:text-brand-700">{cat.name}</h3>
                <p dir="auto" className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{cat.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FeaturedCourses() {
  const { t } = useI18n()
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
        <SectionHeading eyebrow={t('home.featured.eyebrow')} title={t('home.featured.title')} action={<Button to="/courses" variant="secondary">{t('home.featured.browse')} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" /></Button>} />
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
  const { t } = useI18n()
  const steps = [
    { icon: Users, title: t('home.how.step1Title'), text: t('home.how.step1Text') },
    { icon: CirclePlay, title: t('home.how.step2Title'), text: t('home.how.step2Text') },
    { icon: Award, title: t('home.how.step3Title'), text: t('home.how.step3Text') },
  ]
  return (
    <section className="py-20">
      <div className="container-page">
        <SectionHeading center eyebrow={t('home.how.eyebrow')} title={t('home.how.title')} description={t('home.how.description')} />
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-7">
              <span className="absolute end-6 top-6 font-display text-5xl font-extrabold text-slate-100">{t('home.how.stepNumber', { n: i + 1 })}</span>
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
  const { t } = useI18n()
  return (
    <section className="relative overflow-hidden bg-brand-950 py-20 text-white">
      <div className="absolute inset-0 bg-grid opacity-[0.07] invert" />
      <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
      <div className="container-page relative grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">{t('home.mission.eyebrow')}</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('home.mission.title')}</h2>
          <p className="mt-5 text-lg leading-relaxed text-brand-100/90">
            {t('home.mission.text')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/donate" variant="accent" size="lg">
              <Heart className="h-5 w-5" /> {t('home.mission.donate')}
            </Button>
            <Button to="/about" size="lg" className="bg-white/10 text-white ring-1 ring-inset ring-white/20 hover:bg-white/15">
              {t('home.mission.about')}
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Target, title: t('home.mission.f1Title'), text: t('home.mission.f1Text') },
            { icon: Sparkles, title: t('home.mission.f2Title'), text: t('home.mission.f2Text') },
            { icon: GraduationCap, title: t('home.mission.f3Title'), text: t('home.mission.f3Text') },
            { icon: Clock, title: t('home.mission.f4Title'), text: t('home.mission.f4Text') },
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
  const { t } = useI18n()
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
        <SectionHeading eyebrow={t('home.blog.eyebrow')} title={t('home.blog.title')} action={<Button to="/blog" variant="secondary">{t('home.blog.read')} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" /></Button>} />
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
        <h3 dir="auto" className="mt-2 line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">{post.title}</h3>
        {post.excerpt && <p dir="auto" className="mt-2 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Avatar src={post.author?.avatar_url} name={post.author?.full_name} size="xs" />
          <span className="text-xs font-medium text-slate-600">{post.author?.full_name}</span>
        </div>
      </div>
    </Link>
  )
}

function Faq() {
  const { t } = useI18n()
  return (
    <section className="py-20">
      <div className="container-page grid gap-12 lg:grid-cols-3">
        <div>
          <p className="eyebrow">{t('home.faq.eyebrow')}</p>
          <h2 className="mt-2 text-3xl font-bold">{t('home.faq.title')}</h2>
          <p className="mt-3 text-slate-600">
            {t('home.faq.notFound')} <Link to="/contact" className="font-semibold text-brand-600 hover:underline">{t('home.faq.contact')}</Link>{t('home.faq.period')}
          </p>
        </div>
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white lg:col-span-2">
          {t('home.faq.items').map((f) => (
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
  const { t } = useI18n()
  return (
    <section className="pb-20">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-700 px-8 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between">
          <div className="absolute -end-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="relative max-w-xl">
            <h2 className="text-3xl font-bold text-white">{t('home.teach.title')}</h2>
            <p className="mt-3 text-brand-100">{t('home.teach.text')}</p>
          </div>
          <div className="relative mt-8 flex gap-3 lg:mt-0">
            <Button to="/teach" variant="white" size="lg">
              {t('home.teach.cta')} <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
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
