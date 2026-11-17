import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Award, BadgeCheck, BookOpen, ChevronDown, ChevronLeft, ChevronRight, CirclePlay, GraduationCap, Heart, Quote,
  Star, Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { SLIDE_THEMES } from '../../lib/constants'
import { cn, formatDate, formatNumber, toYouTubeEmbedUrl, toYouTubeThumbnailUrl } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { COURSE_CARD_SELECT, CategoryIcon, CourseCard, CourseListItem, VideoEmbed, categoryColor, useCategories } from '../../components/shared'
import { Avatar, Button, Modal } from '../../components/ui'

const H2 = 'text-xl font-semibold sm:text-2xl lg:text-[28px]'
const SECTION = 'container-page pt-10 md:pt-14'

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
      <div>
        <h2 className={H2}>{title}</h2>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p>}
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

// Like Coursera on phones: a swipeable row that peeks at the next card, turning into a grid from md up.
function Rail({ className, children }) {
  return (
    <div className={cn('no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0', className)}>
      {children}
    </div>
  )
}

function useCarouselTrack(dir, itemCount) {
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)
  const [stops, setStops] = useState([0])
  const sign = dir === 'rtl' ? -1 : 1

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track?.children.length) return
    const box = track.getBoundingClientRect()
    const max = Math.max(0, track.scrollWidth - track.clientWidth)
    const scrolled = Math.abs(track.scrollLeft)
    const positions = [...track.children].map((el) => {
      const rect = el.getBoundingClientRect()
      return Math.min(max, Math.round((dir === 'rtl' ? box.right - rect.right : rect.left - box.left) + scrolled))
    })
    const nextStops = positions.filter((position, i) => i === 0 || position > positions[i - 1] + 4)
    const currentPosition = Math.abs(track.scrollLeft)
    setStops(nextStops)
    setActive(nextStops.reduce((best, stop, i) => (
      Math.abs(stop - currentPosition) < Math.abs(nextStops[best] - currentPosition) ? i : best
    ), 0))
  }, [dir])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [itemCount, measure])

  const goTo = useCallback((index) => {
    const count = stops.length
    if (!count) return
    const stop = stops[((index % count) + count) % count]
    trackRef.current?.scrollTo({ left: sign * stop, behavior: 'smooth' })
  }, [sign, stops])

  const onScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || !stops.length) return
    const position = Math.abs(track.scrollLeft)
    setActive(stops.reduce((best, stop, i) => (
      Math.abs(stop - position) < Math.abs(stops[best] - position) ? i : best
    ), 0))
  }, [stops])

  return { trackRef, active, stops, goTo, onScroll }
}

const RAIL_ITEM = 'shrink-0 snap-start md:basis-auto'

const OUTLINE_WHITE = 'bg-transparent text-white ring-1 ring-inset ring-white/70 hover:bg-white/10'

function Slide({ className, eyebrow, title, text, actions, art, heading: Heading = 'h2', label }) {
  return (
    <div role="group" aria-roledescription="slide" aria-label={label} className={cn('relative flex min-h-[440px] shrink-0 basis-[80%] snap-start flex-col overflow-hidden rounded-2xl text-white sm:min-h-[300px] sm:basis-[80%] sm:flex-row lg:basis-[calc(50%-8px)] xl:basis-[47%]', className)}>
      <div className="relative z-10 flex flex-col p-6 sm:max-w-[62%] sm:justify-center sm:p-9">
        {eyebrow && <p className="text-sm font-semibold text-amber-300">{eyebrow}</p>}
        <Heading className="mt-2 text-2xl font-semibold leading-tight text-white sm:text-[32px]">{title}</Heading>
        <p className="mt-3 hidden text-sm leading-relaxed text-white/80 sm:block sm:text-base">{text}</p>
        <div className="mt-5 flex flex-wrap gap-3 sm:mt-6">{actions}</div>
      </div>
      {art}
    </div>
  )
}

function SlideButton({ url, label, className, variant }) {
  if (!label) return null
  // Site paths stay in the app; anything else is an ordinary link.
  const target = url?.startsWith('/') ? { to: url } : { href: url || '#' }
  return <Button {...target} variant={variant} className={className}>{label}</Button>
}

function slideArt(slide) {
  if (slide.image_url) {
    return (
      <div aria-hidden className={ART}>
        <img src={slide.image_url} alt="" className="max-h-full max-w-[85%] object-contain sm:max-h-[80%]" />
      </div>
    )
  }
  switch (slide.art) {
    case 'certificate': return <CertificateArt />
    case 'teacher': return <TeacherArt />
    case 'badge': return <IconArt icon={BadgeCheck} tone="text-emerald-600" />
    case 'heart': return <IconArt icon={Heart} tone="text-rose-500" />
    case 'book': return <IconArt icon={BookOpen} tone="text-brand-600" />
    default: return null
  }
}

// Coursera-style hero carousel: swipe or scroll-snap on touch, arrows and dots on desktop,
// and a slow auto-advance that stops once the visitor interacts. Slides come from Admin → Home page.
function HeroCarousel({ items }) {
  const { t, dir } = useI18n()
  const { user, profile } = useAuth()
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [stops, setStops] = useState([0])
  const firstName = profile?.full_name?.split(' ')[0] || t('portalNav.there')

  const visible = (items || []).filter((s) => s.audience === 'all' || (s.audience === 'members') === !!user)
  const slides = visible.map((s, i) => {
    const theme = SLIDE_THEMES[s.theme] || SLIDE_THEMES.blue
    return (
      <Slide
        key={s.id} heading={i === 0 ? 'h1' : 'h2'} className={theme.bg}
        eyebrow={s.eyebrow} title={s.title.replaceAll('{name}', firstName)} text={s.body}
        actions={<><SlideButton url={s.cta_url} label={s.cta_label} variant="white" /><SlideButton url={s.cta2_url} label={s.cta2_label} className={OUTLINE_WHITE} /></>}
        art={<><Circles a={theme.a} b={theme.b} />{slideArt(s)}</>}
      />
    )
  })
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
  }, [measure, slides.length])

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

  if (!items) {
    return (
      <div className="container-page pt-6">
        <div className="min-h-[440px] w-[80%] animate-pulse rounded-2xl bg-slate-100 sm:min-h-[300px] lg:w-[calc(50%-8px)]" />
      </div>
    )
  }
  if (!slides.length) return null

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

const ART = 'pointer-events-none relative mt-auto flex h-48 items-center justify-center sm:absolute sm:inset-y-0 sm:end-0 sm:mt-0 sm:h-auto sm:w-[40%]'

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
    <div aria-hidden className={ART}>
      <div className="flex h-28 w-28 rotate-6 items-center justify-center rounded-3xl bg-white shadow-2xl sm:h-32 sm:w-32">
        <Icon className={cn('h-16 w-16', tone)} strokeWidth={1.75} />
      </div>
    </div>
  )
}

function CertificateArt() {
  const { t } = useI18n()
  return (
    <div aria-hidden className={ART}>
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
    <div aria-hidden className={ART}>
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
    <div className={cn(RAIL_ITEM, 'basis-[88%] rounded-xl bg-brand-50 p-4 sm:basis-[60%]')}>
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
    <section className="container-page pt-8 md:pt-12">
      <h2 className="mb-4 text-xl font-semibold sm:mb-5 sm:text-2xl">{t('home.popular.title')}</h2>
      <Rail className="md:grid-cols-2 lg:grid-cols-3">
        <Panel title={t('home.popular.mostPopular')} to="/courses?sort=popular" courses={popular} />
        <Panel title={t('home.popular.newest')} to="/courses?sort=newest" courses={newest} />
        <Panel title={t('home.popular.featured')} to="/courses" courses={featured.length ? featured : courses.slice(3, 6)} />
      </Rail>
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
    <section className={SECTION}>
      <h2 className="text-center text-lg font-semibold sm:text-xl">{t('home.stats.title')}</h2>
      <div className={cn('mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200', items.length === 3 ? 'grid-cols-3' : 'md:grid-cols-4')}>
        {items.map((i) => (
          <div key={i.label} className="flex flex-col items-center bg-white px-3 py-5 text-center sm:px-4 sm:py-6">
            <i.icon className="h-6 w-6 text-brand-600" />
            <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{formatNumber(i.value)}</p>
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
    <section className={SECTION}>
      <SectionHeading title={t('home.categories.exploreTitle')} description={t('home.categories.description')} action={<ViewAll to="/courses">{t('home.categories.all')}</ViewAll>} />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:hidden">
        {categories.map((cat) => (
          <Link key={cat.slug} to={`/courses?category=${cat.slug}`} className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand-50 px-4 text-sm font-medium text-slate-900 transition hover:bg-brand-100">
            <CategoryIcon name={cat.icon} className="h-4 w-4 text-brand-700" />
            <span dir="auto" className="whitespace-nowrap">{cat.name}</span>
          </Link>
        ))}
      </div>
      <div className="hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-5">
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
    <section className={SECTION}>
      <SectionHeading title={t('home.featured.gridTitle')} description={t('home.featured.gridSubtitle')} />
      <Rail className="md:grid-cols-2 md:gap-5 lg:grid-cols-4">
        {sorted.slice(0, visible).map((c) => (
          <CourseCard key={c.id} course={c} students={counts[c.id]} className={cn(RAIL_ITEM, 'basis-[72%] sm:basis-[45%]')} />
        ))}
      </Rail>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {more > 0 && (
          <Button onClick={() => setVisible((v) => v + 8)}>{t('home.featured.showMore', { count: more })}</Button>
        )}
        <Button to="/courses" variant="outline">{t('home.featured.browse')}</Button>
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
    <section className={SECTION}>
      <SectionHeading title={t('home.blog.title')} action={<ViewAll to="/blog">{t('home.blog.read')}</ViewAll>} />
      <Rail className="md:grid-cols-3 md:gap-5">
        {data.map((p) => (
          <BlogCard key={p.id} post={p} className={cn(RAIL_ITEM, 'basis-[80%] sm:basis-[45%]')} />
        ))}
      </Rail>
    </section>
  )
}

export function BlogCard({ post, className }) {
  return (
    <Link to={`/blog/${post.slug}`} className={cn('group flex flex-col rounded-lg border border-slate-200 bg-white p-3 transition hover:shadow-lift', className)}>
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

function Organizations({ orgs }) {
  const { t, dir } = useI18n()
  const { trackRef, active, stops, goTo, onScroll } = useCarouselTrack(dir, orgs?.length || 0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || stops.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      if (!document.hidden) goTo(active + 1)
    }, 5000)
    return () => clearInterval(id)
  }, [active, goTo, paused, stops.length])

  if (!orgs?.length) return null
  return (
    <section
      className={SECTION}
      aria-roledescription="carousel"
      aria-label={t('home.partners.carousel')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onTouchStart={() => setPaused(true)}
    >
      <SectionHeading title={t('home.partners.title')} />
      <ul
        ref={trackRef}
        onScroll={onScroll}
        dir={dir}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:px-0"
      >
        {orgs.map((org) => {
          const body = (
            <>
              {org.logo_url ? (
                <img src={org.logo_url} alt="" className="h-7 w-7 shrink-0 rounded object-contain" />
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-brand-600 text-xs font-bold text-white">{org.name.charAt(0)}</span>
              )}
              <span dir="auto" className="min-w-0 truncate text-sm font-semibold text-slate-900">{org.name}</span>
            </>
          )
          const pill = 'flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 transition'
          return (
            <li key={org.id} className="w-[240px] shrink-0 snap-start">
              {org.website_url ? (
                <a href={org.website_url} target="_blank" rel="noreferrer" className={cn(pill, 'hover:border-brand-200 hover:shadow-lift')}>{body}</a>
              ) : (
                <div className={pill}>{body}</div>
              )}
            </li>
          )
        })}
      </ul>
      {stops.length > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => { setPaused(true); goTo(active - 1) }}
            aria-label={t('home.partners.prev')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          >
            <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" />
          </button>
          <div className="flex items-center justify-center gap-2">
            {stops.map((stop, i) => (
              <button
                key={stop}
                type="button"
                onClick={() => { setPaused(true); goTo(i) }}
                aria-label={t('home.partners.goTo', { n: i + 1 })}
                aria-current={active === i}
                className={cn('h-2 rounded-full transition-all', active === i ? 'w-7 bg-slate-800' : 'w-2 bg-slate-300 hover:bg-slate-400')}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => { setPaused(true); goTo(active + 1) }}
            aria-label={t('home.partners.next')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          >
            <ChevronRight className="h-5 w-5 rtl:-scale-x-100" />
          </button>
        </div>
      )}
    </section>
  )
}

function YouTubeVideos() {
  const { t, dir } = useI18n()
  const { data: videos, loading, error } = useQuery(
    async () => unwrap(await supabase.from('home_videos').select('id, title, channel, youtube_url, thumbnail_url').eq('published', true).order('sort_order').order('created_at')),
    [],
  )
  const items = videos || []
  const { trackRef, active, stops, goTo, onScroll } = useCarouselTrack(dir, items.length)
  const [paused, setPaused] = useState(false)
  const [playingVideoId, setPlayingVideoId] = useState(null)
  const desktopCarousel = items.length > 3

  useEffect(() => {
    if (paused || playingVideoId || stops.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      if (!document.hidden) goTo(active + 1)
    }, 6000)
    return () => clearInterval(id)
  }, [active, goTo, paused, playingVideoId, stops.length])

  const cardLayout = desktopCarousel ? 'md:basis-[calc(33.333%-0.834rem)]' : 'md:basis-auto'
  if (loading) {
    return (
      <section className={SECTION} aria-busy="true">
        <SectionHeading title={t('home.videos.title')} description={t('home.videos.description')} />
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="aspect-video animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      </section>
    )
  }

  return (
    <section
      className={SECTION}
      aria-roledescription="carousel"
      aria-label={t('home.videos.carousel')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onTouchStart={() => setPaused(true)}
    >
      <SectionHeading title={t('home.videos.title')} description={t('home.videos.description')} />
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{t('home.videos.error')}</p>
      ) : items.length ? (
        <>
          <div
            ref={trackRef}
            onScroll={onScroll}
            dir={dir}
            className={cn(
              'no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:px-0',
              desktopCarousel ? 'md:flex' : 'md:grid md:grid-cols-3 md:overflow-visible',
            )}
          >
            {items.map((video) => {
              const thumbnail = video.thumbnail_url || toYouTubeThumbnailUrl(video.youtube_url)
              const embedUrl = toYouTubeEmbedUrl(video.youtube_url)
              const isPlaying = playingVideoId === video.id
              return (
                <article key={video.id} className={cn('flex shrink-0 basis-full snap-start flex-col rounded-xl border border-slate-200 bg-white p-3', cardLayout)}>
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                    {isPlaying && embedUrl ? (
                      <iframe
                        src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&playsinline=1`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full border-0"
                      />
                    ) : embedUrl ? (
                      <button
                        type="button"
                        onClick={() => setPlayingVideoId(video.id)}
                        aria-label={t('home.videos.watch', { title: video.title })}
                        className="group absolute inset-0 block w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-500/60"
                      >
                        {thumbnail && <img src={thumbnail} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />}
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/20 text-white transition group-hover:bg-slate-950/35">
                          <CirclePlay className="h-14 w-14 drop-shadow-lg" />
                        </span>
                      </button>
                    ) : (
                      <a href={video.youtube_url} target="_blank" rel="noreferrer" className="flex h-full items-center justify-center text-sm text-white underline">
                        {t('course.openVideo')}
                      </a>
                    )}
                  </div>
                  <h3 dir="auto" className="mt-3 font-semibold text-slate-900">{video.title}</h3>
                  {video.channel && <p dir="auto" className="mt-1 text-sm text-slate-500">{video.channel}</p>}
                </article>
              )
            })}
          </div>
          {items.length > 1 && (
            <div className={cn('mt-4 flex items-center justify-between gap-4', desktopCarousel ? '' : 'md:hidden')}>
              <button
                type="button"
                onClick={() => { setPaused(true); goTo(active - 1) }}
                aria-label={t('home.videos.prev')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
              >
                <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" />
              </button>
              <div className="flex items-center justify-center gap-2">
                {stops.map((stop, i) => (
                  <button
                    key={stop}
                    type="button"
                    onClick={() => { setPaused(true); goTo(i) }}
                    aria-label={t('home.videos.goTo', { n: i + 1 })}
                    aria-current={active === i}
                    className={cn('h-2 rounded-full transition-all', active === i ? 'w-7 bg-slate-800' : 'w-2 bg-slate-300 hover:bg-slate-400')}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { setPaused(true); goTo(active + 1) }}
                aria-label={t('home.videos.next')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
              >
                <ChevronRight className="h-5 w-5 rtl:-scale-x-100" />
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-600">
          {t('home.videos.empty')}
        </p>
      )}
    </section>
  )
}

function Teachers({ counts }) {
  const { t, dir } = useI18n()
  const [paused, setPaused] = useState(false)
  const [videoTeacher, setVideoTeacher] = useState(null)
  const { data } = useQuery(
    async () => unwrap(await supabase.from('profiles').select('id, full_name, avatar_url, headline, youtube_url, courses:courses!courses_teacher_id_fkey(id, status)').eq('role', 'teacher').eq('show_on_home', true)),
    [],
  )
  const teachers = (data || [])
    .map((p) => {
      const published = p.courses.filter((c) => c.status === 'published')
      return { ...p, courseCount: published.length, learners: published.reduce((sum, c) => sum + (counts[c.id] || 0), 0) }
    })
    .filter((p) => p.courseCount > 0)
    .sort((a, b) => b.learners - a.learners || b.courseCount - a.courseCount)
    .slice(0, 8)
  const { trackRef, active, stops, goTo, onScroll } = useCarouselTrack(dir, teachers.length)
  const cardBasis = teachers.length === 2 ? 'sm:basis-[52%] md:basis-[52%] xl:basis-[52%]' : 'md:basis-[34%] xl:basis-[26%]'

  useEffect(() => {
    if (paused || stops.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      if (!document.hidden) goTo(active + 1)
    }, 5000)
    return () => clearInterval(id)
  }, [active, goTo, paused, stops.length])

  if (!teachers.length) return null
  return (
    <>
    <section
      className={SECTION}
      aria-roledescription="carousel"
      aria-label={t('home.teachers.carousel')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onTouchStart={() => setPaused(true)}
    >
      <SectionHeading title={t('home.teachers.title')} description={t('home.teachers.description')} action={<ViewAll to="/teach">{t('home.teachers.join')}</ViewAll>} />
      <div
        ref={trackRef}
        onScroll={onScroll}
        dir={dir}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:px-0"
      >
        {teachers.map((p, index) => (
          <article key={p.id} role="group" aria-roledescription="slide" aria-label={t('home.teachers.slide', { n: index + 1, total: teachers.length })} className={cn('flex shrink-0 basis-[62%] snap-start flex-col rounded-lg border border-slate-200 bg-white p-4 text-center transition hover:shadow-lift sm:basis-[40%]', cardBasis)}>
            {toYouTubeEmbedUrl(p.youtube_url) ? (
              <button
                type="button"
                onClick={() => setVideoTeacher(p)}
                aria-label={t('home.teachers.watchVideo', { name: p.full_name })}
                className="group relative block aspect-[4/5] w-full overflow-hidden rounded-md bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50">
                    <Avatar name={p.full_name} size="xl" className="ring-4 ring-white" />
                  </span>
                )}
                <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white transition group-hover:bg-slate-900/25 group-focus-visible:bg-slate-900/25">
                  <CirclePlay className="h-12 w-12 drop-shadow-lg" />
                </span>
              </button>
            ) : (
              <div className="aspect-[4/5] w-full overflow-hidden rounded-md bg-slate-100">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50">
                    <Avatar name={p.full_name} size="xl" className="ring-4 ring-white" />
                  </span>
                )}
              </div>
            )}
            <h3 dir="auto" className="mt-2 font-semibold text-slate-900">{p.full_name}</h3>
            {p.headline && <p dir="auto" className="mt-1 line-clamp-2 text-sm text-slate-600">{p.headline}</p>}
            <p className="mt-auto flex flex-wrap justify-center gap-x-1.5 pt-3 text-xs text-slate-500">
              <span>{t('home.categories.courseCount', { count: p.courseCount })}</span>
              {p.learners > 0 && <span>· {t('course.learners', { count: p.learners })}</span>}
            </p>
          </article>
        ))}
      </div>
      {stops.length > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <button type="button" onClick={() => { setPaused(true); goTo(active - 1) }} aria-label={t('home.teachers.prev')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-600">
            <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" />
          </button>
          <div className="flex items-center justify-center gap-2">
            {stops.map((stop, i) => (
              <button key={stop} type="button" onClick={() => { setPaused(true); goTo(i) }} aria-label={t('home.teachers.goTo', { n: i + 1 })} aria-current={active === i} className={cn('h-2 rounded-full transition-all', active === i ? 'w-7 bg-slate-800' : 'w-2 bg-slate-300 hover:bg-slate-400')} />
            ))}
          </div>
          <button type="button" onClick={() => { setPaused(true); goTo(active + 1) }} aria-label={t('home.teachers.next')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-600">
            <ChevronRight className="h-5 w-5 rtl:-scale-x-100" />
          </button>
        </div>
      )}
    </section>
    <Modal open={!!videoTeacher} onClose={() => setVideoTeacher(null)} title={t('home.teachers.videoTitle', { name: videoTeacher?.full_name || '' })} size="xl">
      {videoTeacher && <VideoEmbed url={videoTeacher.youtube_url} title={t('home.teachers.videoTitle', { name: videoTeacher.full_name })} />}
    </Modal>
    </>
  )
}

function Reviews({ reviews }) {
  const { t } = useI18n()
  if (!reviews?.length) return null
  return (
    <section className={SECTION}>
      <SectionHeading title={t('home.reviews.title')} description={t('home.reviews.description')} />
      <Rail className="md:grid-cols-2 lg:grid-cols-4">
        {reviews.map((r) => (
          <figure key={r.id} className={cn(RAIL_ITEM, 'flex basis-[85%] flex-col rounded-lg border border-slate-200 bg-white p-5 sm:basis-[60%]')}>
            <div className="flex items-center gap-3">
              <Avatar src={r.photo_url} name={r.name} size="lg" />
              <figcaption className="min-w-0">
                <p dir="auto" className="font-semibold text-slate-900">{r.name}</p>
                {r.role && <p dir="auto" className="line-clamp-2 text-sm text-slate-500">{r.role}</p>}
              </figcaption>
            </div>
            <div className="mt-4 flex gap-0.5 text-amber-500" aria-hidden>
              {Array.from({ length: r.rating }, (_, n) => <Star key={n} className="h-4 w-4 fill-current" />)}
            </div>
            <blockquote dir="auto" className="relative mt-3 text-[15px] leading-relaxed text-slate-700">
              <Quote className="absolute -top-1 end-0 h-6 w-6 text-brand-100" aria-hidden />
              “{r.quote}”
            </blockquote>
          </figure>
        ))}
      </Rail>
    </section>
  )
}

function Faq({ items }) {
  const { t } = useI18n()
  if (!items?.length) return null
  return (
    <section className={SECTION}>
      <h2 className={H2}>{t('home.faq.title')}</h2>
      <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200 sm:mt-6">
        {items.map((f) => (
          <details key={f.id} className="group py-1 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center gap-3 py-3.5 text-base font-semibold text-slate-900 hover:text-brand-700 sm:gap-4 sm:py-4 sm:text-lg">
              <ChevronDown className="h-5 w-5 shrink-0 text-slate-700 transition group-open:rotate-180" />
              <span dir="auto">{f.question}</span>
            </summary>
            <p dir="auto" className="whitespace-pre-line pb-5 ps-8 text-sm leading-relaxed text-slate-600 sm:ps-9 sm:text-base">{f.answer}</p>
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
    <section className="container-page py-12 md:py-16">
      <div className="relative overflow-hidden rounded-2xl bg-brand-600 px-6 py-10 text-white sm:px-12 sm:py-12">
        <div className="absolute -bottom-24 -end-10 h-72 w-72 rounded-full bg-brand-500/60" />
        <div className="absolute -top-16 end-48 h-40 w-40 rounded-full bg-brand-800/50" />
        <div className="relative max-w-2xl">
          <h2 className="text-xl font-semibold leading-snug text-white sm:text-3xl">{t('home.cta.title')}</h2>
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
  // Admin-managed home content. Filter on published explicitly: admins can also read hidden rows.
  const { lang } = useI18n()
  const { data: content, error: contentError } = useQuery(async () => {
    const tables = ['home_slides', 'partners', 'testimonials', 'faqs']
    const results = await Promise.all(tables.map((table) => supabase.from(table).select('*').eq('published', true).order('sort_order').order('created_at')))
    const [slides, partners, reviews, faqs] = results.map(unwrap)
    return { slides, partners, reviews, faqs }
  }, [])
  const inLang = (rows) => rows?.filter((r) => !r.lang || r.lang === lang)
  const courses = data?.courses || []
  const counts = data?.counts || {}
  return (
    <>
      <HeroCarousel items={contentError ? [] : inLang(content?.slides)} />
      <NewAndPopular courses={courses} counts={counts} />
      <YouTubeVideos />
      <ExploreCategories courses={courses} />
      <CourseGrid courses={courses} counts={counts} />
      <Teachers counts={counts} />
      <ImpactStats />
      <Reviews reviews={inLang(content?.reviews)} />
      <LatestPosts />
      <Organizations orgs={content?.partners} />
      <BottomCta />
    </>
  )
}
