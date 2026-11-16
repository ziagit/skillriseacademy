import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { cn, LEVEL_KEYS, levelLabel } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { COURSE_CARD_SELECT, CourseCard, useCategories } from '../../components/shared'
import { Button, EmptyState, PageLoader, SearchInput } from '../../components/ui'

const SORTS = ['best', 'popular', 'newest']

export default function Courses() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const level = params.get('level') || ''
  const sort = SORTS.includes(params.get('sort')) ? params.get('sort') : 'best'
  const [search, setSearch] = useState(q)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const categories = useCategories()

  // The header search bar navigates here with ?q=, so keep the local field in sync with the URL.
  useEffect(() => setSearch(q), [q])

  const { data, loading } = useQuery(async () => {
    const [courses, counts] = await Promise.all([
      supabase.from('courses').select(COURSE_CARD_SELECT).eq('status', 'published').order('featured', { ascending: false }).order('published_at', { ascending: false }),
      supabase.rpc('course_enrollment_counts'),
    ])
    return {
      courses: unwrap(courses) || [],
      counts: Object.fromEntries((counts.data || []).map((c) => [c.course_id, c.students])),
    }
  }, [])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const onSearch = (value) => {
    setSearch(value)
    setParam('q', value)
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const counts = data?.counts || {}
    const list = (data?.courses || []).filter(
      (c) =>
        (!category || c.category?.slug === category) &&
        (!level || c.level === level) &&
        (!needle || c.title.toLowerCase().includes(needle) || c.subtitle?.toLowerCase().includes(needle) || c.teacher?.full_name?.toLowerCase().includes(needle)),
    )
    if (sort === 'popular') return [...list].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
    if (sort === 'newest') return [...list].sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
    return list
  }, [data, q, category, level, sort])

  const activeCategory = categories.find((c) => c.slug === category)
  const hasFilters = !!(category || level || q)
  const clearAll = () => setParams({}, { replace: true })

  const filters = (
    <div className="space-y-7">
      <FilterGroup title={t('courses.filters.category')}>
        <FilterOption name="category" checked={!category} onChange={() => setParam('category', '')} label={t('courses.all')} />
        {categories.map((c) => (
          <FilterOption
            key={c.slug}
            name="category"
            checked={category === c.slug}
            onChange={() => setParam('category', c.slug)}
            label={c.name}
            count={data?.courses.filter((x) => x.category?.slug === c.slug).length}
          />
        ))}
      </FilterGroup>
      <FilterGroup title={t('courses.filters.level')}>
        <FilterOption name="level" checked={!level} onChange={() => setParam('level', '')} label={t('courses.all')} />
        {LEVEL_KEYS.map((v) => (
          <FilterOption key={v} name="level" checked={level === v} onChange={() => setParam('level', v)} label={levelLabel(v)} />
        ))}
      </FilterGroup>
    </div>
  )

  return (
    <>
      <section className="border-b border-slate-200 bg-brand-50/60">
        <div className="container-page py-10">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {q ? t('courses.resultsFor', { q }) : activeCategory ? <span dir="auto">{activeCategory.name}</span> : t('courses.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">{activeCategory?.description || t('courses.subtitle')}</p>
          <SearchInput value={search} onChange={onSearch} placeholder={t('courses.searchPlaceholder')} className="mt-6 max-w-xl [&_input]:h-11 [&_input]:rounded-full [&_input]:ps-10" />
        </div>
      </section>

      <section className="container-page grid gap-8 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('courses.filters.title')}</h2>
              {hasFilters && <button onClick={clearAll} className="link text-sm">{t('courses.filters.clear')}</button>}
            </div>
            {filters}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-slate-600">
              {!loading && t('courses.results', { count: filtered.length })}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" /> {t('courses.filters.title')}
              </Button>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span className="hidden sm:inline">{t('courses.sort.label')}</span>
                <select className="input h-9 w-auto py-1 pe-8" value={sort} onChange={(e) => setParam('sort', e.target.value === 'best' ? '' : e.target.value)}>
                  {SORTS.map((s) => (
                    <option key={s} value={s}>{t(`courses.sort.${s}`)}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {hasFilters && (
            <div className="mb-5 flex flex-wrap gap-2">
              {q && <Chip onRemove={() => onSearch('')}>“{q}”</Chip>}
              {activeCategory && <Chip onRemove={() => setParam('category', '')}>{activeCategory.name}</Chip>}
              {level && <Chip onRemove={() => setParam('level', '')}>{levelLabel(level)}</Chip>}
            </div>
          )}

          {loading ? (
            <PageLoader label={t('courses.loading')} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={data?.courses?.length ? t('courses.noMatch') : t('courses.comingSoon')}
              description={data?.courses?.length ? t('courses.noMatchHint') : t('courses.comingSoonHint')}
              action={hasFilters && <Button variant="outline" onClick={clearAll}>{t('courses.filters.clear')}</Button>}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <CourseCard key={c.id} course={c} students={data.counts[c.id]} />
              ))}
            </div>
          )}
        </div>
      </section>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">{t('courses.filters.title')}</h2>
              <button onClick={() => setFiltersOpen(false)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label={t('common.close')}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{filters}</div>
            <div className="flex gap-2 border-t border-slate-200 p-4">
              <Button variant="outline" className="flex-1" onClick={clearAll}>{t('courses.filters.clear')}</Button>
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>{t('courses.filters.show', { count: filtered.length })}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function FilterGroup({ title, children }) {
  return (
    <fieldset>
      <legend className="mb-2 text-base font-semibold text-slate-900">{title}</legend>
      <div className="space-y-0.5">{children}</div>
    </fieldset>
  )
}

function FilterOption({ name, checked, onChange, label, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 text-sm text-slate-700 hover:text-slate-900">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 border-slate-400 text-brand-600 focus:ring-brand-500" />
      <span dir="auto" className={cn('flex-1', checked && 'font-semibold text-slate-900')}>{label}</span>
      {count > 0 && <span className="text-xs text-slate-500">{count}</span>}
    </label>
  )
}

function Chip({ children, onRemove }) {
  const { t } = useI18n()
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pe-1.5 ps-3 text-sm font-medium text-brand-800">
      <span dir="auto">{children}</span>
      <button onClick={onRemove} className="rounded-full p-0.5 hover:bg-brand-100" aria-label={t('common.remove')}>
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}
