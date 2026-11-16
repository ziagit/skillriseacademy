import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Award, BadgeCheck, BookOpen, ChevronLeft, ChevronRight, CirclePlay, Clock, GraduationCap, Heart, Sparkles, Target,
  Users,
} from 'lucide-react'
import { homePathFor, useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { cn, formatDate, formatNumber } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { COURSE_CARD_SELECT, CategoryIcon, CourseCard, CourseListItem, categoryColor, useCategories } from '../../components/shared'
import { Avatar, Button } from '../../components/ui'

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold sm:text-[28px]">{title}</h2>
        {description && <p className="mt-1.5 max-w-2xl text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function ViewAll({ to, children }) {
  return (
    <Link to={to} className="link inline-flex shrink-0 items-center gap-1 text-sm">
      {children} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
    </Link>
  )
}

const OUTLINE_WHITE = 'bg-transparent text-white ring-1 ring-inset ring-white/70 hover:bg-white/10'

function Slide({ className, eyebrow, title, text, actions, art, heading: Heading = 'h2', label }) {
  return (
    <div role="group" aria-roledescription="slide" aria-label={label} className={cn('relative flex min-h-[300px] shrink-0 basis-[88%] snap-start overflow-hidden rounded-2xl text-white sm:basis-[80%] lg:basis-[calc(50%-8px)] xl:basis-[47%]', className)}>
      <div className="relative z-10 flex flex-col justify-center p-7 sm:max-w-[62%] sm:p-9">
        {eyebrow && <p className="text-sm font-semibold text-amber-300">{eyebrow}</p>}
        <Heading className="mt-2 text-[26px] font-semibold leading-tight text-white sm:text-[32px]">{title}</Heading>
        <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">{text}</p>
        <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
      </div>
      {art}
    </div>
  )
}

// Coursera-style hero carousel: swipe or scroll-snap on touch, arrows and dots on desktop,
// and a slow auto-advance that stops once the visitor interacts.
function HeroCarousel() {
  const { t, dir } = useI18n()
  const { user, profile } = useAuth()
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const firstName = profile?.full_name?.split(' ')[0]

  const slides = [
    user ? (
      <Slide
        key="learn" heading="h1" className="bg-brand-600"
        title={t('home.banner.welcome', { name: firstName || t('portalNav.there') })}
        text={t('home.banner.welcomeText')}
        actions={<Button to={homePathFor(profile?.role)} variant="white">{t('home.banner.continue')} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" /></Button>}
        art={<><Circles a="bg-brand-500/60" b="bg-brand-800/60" /><CertificateArt /></>}
      />
    ) : (
      <Slide
        key="learn" heading="h1" className="bg-brand-600"
        eyebrow={t('home.hero.badge')} title={t('home.banner.title')} text={t('home.banner.text')}
        actions={<><Button to="/signup" variant="white">{t('home.banner.cta')}</Button><Button to="/courses" className={OUTLINE_WHITE}>{t('home.hero.explore')}</Button></>}
        art={<><Circles a="bg-brand-500/60" b="bg-brand-800/60" /><CertificateArt /></>}
      />
    ),
    <Slide
      key="teach" className="bg-slate-950"
      eyebrow={t('nav.forTeachers')} title={t('home.banner.teachTitle')} text={t('home.banner.teachText')}
      actions={<Button to="/teach" className={OUTLINE_WHITE}>{t('home.banner.teachCta')} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" /></Button>}
      art={<><Circles a="bg-amber-400/15" b="bg-white/5" /><TeacherArt /></>}
    />,
    <Slide
      key="cert" className="bg-emerald-700"
      eyebrow={t('home.banner.certEyebrow')} title={t('home.banner.certTitle')} text={t('home.banner.certText')}
      actions={<><Button to="/courses" variant="white">{t('home.hero.explore')}</Button><Button to="/verify" className={OUTLINE_WHITE}>{t('nav.verify')}</Button></>}
      art={<><Circles a="bg-emerald-500/50" b="bg-emerald-900/40" /><IconArt icon={BadgeCheck} tone="text-emerald-600" /></>}
    />,
    <Slide
      key="donate" className="bg-violet-700"
      eyebrow={t('home.banner.donateEyebrow')} title={t('home.banner.donateTitle')} text={t('home.banner.donateText')}
      actions={<Button to="/donate" variant="white"><Heart className="h-4 w-4" /> {t('home.mission.donate')}</Button>}
      art={<><Circles a="bg-violet-500/50" b="bg-violet-900/40" /><IconArt icon={Heart} tone="text-rose-500" /></>}
    />,
  ]
  const [stops, setStops] = useState(() => slides.map((_, i) => i))
  const sign = dir === 'rtl' ? -1 : 1

  // Scroll positions the track can rest at: each slide's start, clamped to the end. On wide
  // screens the last slides share the final position, so there are fewer dots than slides.
  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const box = track.getBoundingClientRect()
    const max = track.scrollWidth - track.clientWidth
    const scrolled = Math.abs(track.scrollLeft)
    const positions = [...track.children].map((el) => {
      const r = el.getBoundingClientRect()
      return Math.min(max, Math.round((dir === 'rtl' ? box.right - r.right : r.left - box.left) + scrolled))
    })
    setStops(positions.filter((x, i) => i === 0 || x > positions[i - 1] + 4))
  }, [dir])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const goTo = useCallback((i) => {
    const n = stops.length
    trackRef.current?.scrollTo({ left: sign * stops[((i % n) + n) % n], behavior: 'smooth' })
  }, [stops, sign])

  const onScroll = () => {
    const x = Math.abs(trackRef.current.scrollLeft)
    setActive(stops.reduce((best, s, i) => (Math.abs(s - x) < Math.abs(stops[best] - x) ? i : best), 0))
  }

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => !document.hidden && goTo(active + 1), 6000)
    return () => clearInterval(id)
  }, [active, paused, goTo])

  const arrow = 'absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 md:flex'
  return (
    <section
      className="container-page pt-6"
      aria-roledescription="carousel"
      aria-label={t('home.banner.carousel')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="relative">
        <div ref={trackRef} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain">
          {slides}
        </div>
        <button type="button" onClick={() => goTo(active - 1)} aria-label={t('home.banner.prev')} className={cn(arrow, '-start-5')}>
          <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" />
        </button>
        <button type="button" onClick={() => goTo(active + 1)} aria-label={t('home.banner.next')} className={cn(arrow, '-end-5')}>
          <ChevronRight className="h-5 w-5 rtl:-scale-x-100" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {stops.map((stop, i) => (
          <button
            key={stop}
            type="button"
            onClick={() => goTo(i)}
            aria-label={t('home.banner.goTo', { n: i + 1 })}
            aria-current={active === i}
            className={cn('h-2 rounded-full transition-all', active === i ? 'w-7 bg-slate-800' : 'w-2 bg-slate-300 hover:bg-slate-400')}
          />
        ))}
      </div>
    </section>
  )
}

function Circles({ a, b }) {
  return (
    <>
      <div aria-hidden className={cn('absolute -bottom-20 -end-16 h-72 w-72 rounded-full', a)} />
      <div aria-hidden className={cn('absolute -top-24 end-28 h-48 w-48 rounded-full', b)} />
    </>
  )
}

function IconArt({ icon: Icon, tone }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 end-0 hidden w-[40%] items-center justify-center sm:flex">
      <div className="flex h-32 w-32 rotate-6 items-center justify-center rounded-3xl bg-white shadow-2xl">
        <Icon className={cn('h-16 w-16', tone)} strokeWidth={1.75} />
      </div>
    </div>
  )
}

function CertificateArt() {
  const { t } = useI18n()
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 end-0 hidden w-[40%] items-center sm:flex">
      <div className="relative w-full">
        <div className="relative mx-auto w-44 rotate-6 rounded-lg bg-white p-4 text-slate-900 shadow-2xl">
          <Award className="h-7 w-7 text-brand-600" />
          <p className="mt-2 text-[10px] font-semibold uppercase text-slate-400">{t('cert.ofCompletion')}</p>
          <div className="mt-2 h-2 w-28 rounded bg-slate-200" />
          <div className="mt-1.5 h-2 w-20 rounded bg-slate-200" />
          <div className="mt-4 flex items-center justify-between">
            <div className="h-1.5 w-12 rounded bg-slate-300" />
            <BadgeCheck className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
        <div className="absolute -top-6 start-2 flex h-20 w-20 -rotate-12 flex-col items-center justify-center rounded-full bg-amber-400 text-center font-extrabold leading-none text-slate-900 shadow-lg">
          <span className="text-xl">100%</span>
          <span className="mt-0.5 text-xs uppercase">{t('common.free')}</span>
        </div>
      </div>
    </div>
  )
}

function TeacherArt() {
  const { t } = useI18n()
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 end-0 hidden w-[40%] items-center sm:flex">
      <div className="mx-auto w-44 space-y-2">
        {t('home.mock.lessons').map((title, i) => (
          <div key={title} className={cn('flex items-center gap-2 rounded-lg p-2.5 text-xs shadow-lg', i === 1 ? 'bg-brand-600 text-white' : 'bg-white text-slate-700')}>
            <CirclePlay className="h-4 w-4 shrink-0" />
            <span className="truncate">{title}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {t('home.mock.names').map((n) => (
              <Avatar key={n} name={n} size="xs" className="ring-slate-950" />
            ))}
          </div>
          <span className="text-[11px] text-slate-300">{t('home.mock.studying')}</span>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, to, courses }) {
  if (!courses.length) return null
  return (
    <div className="rounded-xl bg-brand-50 p-4">
      <Link to={to} className="group mb-3 inline-flex items-center gap-1.5 font-semibold text-slate-900">
        {title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
      </Link>
      <div className="space-y-2.5">
        {courses.map((c) => (
          <CourseListItem key={c.id} course={c} />
        ))}
      </div>
    </div>
  )
}

function NewAndPopular({ courses, counts }) {
  const { t } = useI18n()
  if (!courses.length) return null
  const popular = [...courses].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0)).slice(0, 3)
  const newest = [...courses].sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0)).slice(0, 3)
  const featured = courses.filter((c) => c.featured).slice(0, 3)
  return (
    <section className="container-page pt-12">
      <h2 className="mb-5 text-2xl font-semibold">{t('home.popular.title')}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Panel title={t('home.popular.mostPopular')} to="/courses?sort=popular" courses={popular} />
        <Panel title={t('home.popular.newest')} to="/courses?sort=newest" courses={newest} />
        <Panel title={t('home.popular.featured')} to="/courses" courses={featured.length ? featured : courses.slice(3, 6)} />
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
  ].filter((i) => i.value > 0)
  if (!items.length) return null
  return (
    <section className="container-page pt-14">
      <h2 className="text-center text-xl font-semibold">{t('home.stats.title')}</h2>
      <div className={cn('mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200', items.length === 3 ? 'grid-cols-3' : 'md:grid-cols-4')}>
        {items.map((i) => (
          <div key={i.label} className="flex flex-col items-center bg-white px-4 py-6 text-center">
            <i.icon className="h-6 w-6 text-brand-600" />
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatNumber(i.value)}</p>
            <p className="text-sm text-slate-600">{i.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ExploreCategories({ courses }) {
  const { t } = useI18n()
  const categories = useCategories()
  const counts = courses.reduce((acc, c) => ({ ...acc, [c.category?.slug]: (acc[c.category?.slug] || 0) + 1 }), {})
  return (
    <section className="container-page pt-14">
      <SectionHeading title={t('home.categories.exploreTitle')} description={t('home.categories.description')} action={<ViewAll to="/courses">{t('home.categories.all')}</ViewAll>} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => {
          const c = categoryColor(cat.color)
          return (
            <Link key={cat.slug} to={`/courses?category=${cat.slug}`} className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-brand-200 hover:shadow-lift">
              <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-white', c.grad)}>
                <CategoryIcon name={cat.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span dir="auto" className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:underline">{cat.name}</span>
                {counts[cat.slug] > 0 && <span className="text-xs text-slate-500">{t('home.categories.courseCount', { count: counts[cat.slug] })}</span>}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function CourseGrid({ courses, counts }) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(4)
  if (!courses.length) return null
  const sorted = [...courses].sort((a, b) => (b.featured - a.featured) || (counts[b.id] || 0) - (counts[a.id] || 0))
  const more = Math.min(8, sorted.length - visible)
  return (
    <section className="container-page pt-14">
      <SectionHeading title={t('home.featured.gridTitle')} description={t('home.featured.gridSubtitle')} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.slice(0, visible).map((c) => (
          <CourseCard key={c.id} course={c} students={counts[c.id]} />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {more > 0 && (
          <Button onClick={() => setVisible((v) => v + 8)}>{t('home.featured.showMore', { count: more })}</Button>
        )}
        <Button to="/courses" variant="outline">{t('home.featured.browse')}</Button>
      </div>
    </section>
  )
}

function WhySkillRise() {
  const { t } = useI18n()
  const values = [
    { icon: Target, title: t('home.mission.f1Title'), text: t('home.mission.f1Text') },
    { icon: Sparkles, title: t('home.mission.f2Title'), text: t('home.mission.f2Text') },
    { icon: GraduationCap, title: t('home.mission.f3Title'), text: t('home.mission.f3Text') },
    { icon: Clock, title: t('home.mission.f4Title'), text: t('home.mission.f4Text') },
  ]
  const steps = [
    { title: t('home.how.step1Title'), text: t('home.how.step1Text') },
    { title: t('home.how.step2Title'), text: t('home.how.step2Text') },
    { title: t('home.how.step3Title'), text: t('home.how.step3Text') },
  ]
  return (
    <section className="mt-16 bg-brand-50/60 py-16">
      <div className="container-page grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold sm:text-[28px]">{t('home.why.title')}</h2>
          <p className="mt-3 max-w-xl text-slate-600">{t('home.mission.text')}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-lg bg-white p-5 shadow-card">
                <v.icon className="h-6 w-6 text-brand-600" />
                <h3 className="mt-3 font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-card sm:p-9">
          <h3 className="text-xl font-semibold">{t('home.how.title')}</h3>
          <p className="mt-2 text-sm text-slate-600">{t('home.how.description')}</p>
          <ol className="mt-7 space-y-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{formatNumber(i + 1)}</span>
                <div>
                  <p className="font-semibold text-slate-900">{s.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
            <Button to="/signup">{t('home.hero.createAccount')}</Button>
            <Button to="/about" variant="outline">{t('home.mission.about')}</Button>
          </div>
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
    <section className="container-page pt-16">
      <SectionHeading title={t('home.blog.title')} action={<ViewAll to="/blog">{t('home.blog.read')}</ViewAll>} />
      <div className="grid gap-5 md:grid-cols-3">
        {data.map((p) => (
          <BlogCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  )
}

export function BlogCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group flex flex-col rounded-lg border border-slate-200 bg-white p-3 transition hover:shadow-lift">
      {post.cover_url ? (
        <img src={post.cover_url} alt="" className="aspect-[16/9] w-full rounded-md object-cover" />
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center rounded-md bg-gradient-to-br from-brand-50 to-brand-100">
          <BookOpen className="h-10 w-10 text-brand-300" />
        </div>
      )}
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <p className="text-xs text-slate-500">{formatDate(post.published_at)}</p>
        <h3 dir="auto" className="mt-1.5 line-clamp-2 font-semibold text-slate-900 group-hover:underline">{post.title}</h3>
        {post.excerpt && <p dir="auto" className="mt-1.5 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>}
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
    <section className="container-page pt-16">
      <h2 className="text-2xl font-semibold sm:text-[28px]">{t('home.faq.title')}</h2>
      <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
        {t('home.faq.items').map((f) => (
          <details key={f.q} className="group py-1 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center gap-4 py-4 text-lg font-semibold text-slate-900 hover:text-brand-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-2xl font-normal leading-none text-slate-600 transition group-open:rotate-45">+</span>
              {f.q}
            </summary>
            <p className="pb-5 ps-10 leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-5 text-slate-600">
        {t('home.faq.notFound')} <Link to="/contact" className="link">{t('home.faq.contact')}</Link>{t('home.faq.period')}
      </p>
    </section>
  )
}

function BottomCta() {
  const { t } = useI18n()
  const { user } = useAuth()
  return (
    <section className="container-page py-16">
      <div className="relative overflow-hidden rounded-2xl bg-brand-600 px-8 py-12 text-white sm:px-12">
        <div className="absolute -bottom-24 -end-10 h-72 w-72 rounded-full bg-brand-500/60" />
        <div className="absolute -top-16 end-48 h-40 w-40 rounded-full bg-brand-800/50" />
        <div className="relative max-w-2xl">
          <h2 className="text-2xl font-semibold leading-snug text-white sm:text-3xl">{t('home.cta.title')}</h2>
          <p className="mt-3 text-brand-100">{t('home.cta.text')}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {!user && <Button to="/signup" variant="white" size="lg">{t('home.banner.cta')}</Button>}
            <Button to="/donate" size="lg" className="bg-transparent text-white ring-1 ring-inset ring-white/70 hover:bg-white/10">
              <Heart className="h-5 w-5" /> {t('home.mission.donate')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { data } = useQuery(async () => {
    const courses = unwrap(
      await supabase.from('courses').select(COURSE_CARD_SELECT).eq('status', 'published').order('featured', { ascending: false }).order('published_at', { ascending: false }).limit(48),
    )
    const counts = unwrap(await supabase.rpc('course_enrollment_counts'))
    return { courses: courses || [], counts: Object.fromEntries((counts || []).map((c) => [c.course_id, c.students])) }
  }, [])
  const courses = data?.courses || []
  const counts = data?.counts || {}
  return (
    <>
      <HeroCarousel />
      <NewAndPopular courses={courses} counts={counts} />
      <ImpactStats />
      <ExploreCategories courses={courses} />
      <CourseGrid courses={courses} counts={counts} />
      <WhySkillRise />
      <LatestPosts />
      <Faq />
      <BottomCta />
    </>
  )
}
