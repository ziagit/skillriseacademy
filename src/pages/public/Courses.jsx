import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { DEFAULT_CATEGORIES } from '../../lib/constants'
import { cn, LEVELS } from '../../lib/utils'
import { COURSE_CARD_SELECT, CategoryIcon, CourseCard } from '../../components/shared'
import { EmptyState, PageLoader, SearchInput } from '../../components/ui'

export default function Courses() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const category = params.get('category') || ''
  const level = params.get('level') || ''

  const { data, loading } = useQuery(async () => {
    const [courses, categories, counts] = await Promise.all([
      supabase.from('courses').select(COURSE_CARD_SELECT).eq('status', 'published').order('featured', { ascending: false }).order('published_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.rpc('course_enrollment_counts'),
    ])
    return {
      courses: unwrap(courses) || [],
      categories: unwrap(categories)?.length ? categories.data : DEFAULT_CATEGORIES,
      counts: Object.fromEntries((counts.data || []).map((c) => [c.course_id, c.students])),
    }
  }, [])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.courses || []).filter(
      (c) =>
        (!category || c.category?.slug === category) &&
        (!level || c.level === level) &&
        (!q || c.title.toLowerCase().includes(q) || c.subtitle?.toLowerCase().includes(q) || c.teacher?.full_name?.toLowerCase().includes(q)),
    )
  }, [data, search, category, level])

  const categories = data?.categories || DEFAULT_CATEGORIES

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="container-page py-14">
          <p className="eyebrow">Course catalog</p>
          <h1 className="mt-2 text-4xl font-bold">Explore free courses</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Every course is free, self-paced and includes a verified certificate on completion.</p>
          <div className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <SearchInput value={search} onChange={setSearch} placeholder="Search courses, topics or teachers…" className="flex-1" />
            <select className="input sm:w-48" value={level} onChange={(e) => setParam('level', e.target.value)}>
              <option value="">All levels</option>
              {Object.entries(LEVELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          <CategoryChip active={!category} onClick={() => setParam('category', '')}>All</CategoryChip>
          {categories.map((c) => (
            <CategoryChip key={c.slug} active={category === c.slug} onClick={() => setParam('category', c.slug)}>
              <CategoryIcon name={c.icon} className="h-4 w-4" /> {c.name}
            </CategoryChip>
          ))}
        </div>

        {loading ? (
          <PageLoader label="Loading courses…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={data?.courses?.length ? 'No courses match your filters' : 'New courses are on the way'}
            description={data?.courses?.length ? 'Try a different search or category.' : 'Our teachers are preparing courses right now. Create an account to be notified.'}
          />
        ) : (
          <>
            <p className="mb-5 text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-800">{filtered.length}</span> course{filtered.length === 1 ? '' : 's'}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <CourseCard key={c.id} course={c} students={data.counts[c.id]} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}

function CategoryChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition',
        active ? 'border-brand-600 bg-brand-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
      )}
    >
      {children}
    </button>
  )
}
