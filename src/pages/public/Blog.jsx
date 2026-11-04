import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Newspaper } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { formatDate } from '../../lib/utils'
import { Markdown } from '../../components/shared'
import { Avatar, Badge, EmptyState, PageLoader, SearchInput } from '../../components/ui'
import { BlogCard } from './Home'
import { PageHero } from './About'
import NotFound from './NotFound'

const AUTHOR = 'author:profiles!blog_posts_author_id_fkey(full_name, avatar_url, headline, bio)'

export function BlogList() {
  const [search, setSearch] = useState('')
  const { data, loading } = useQuery(
    async () => unwrap(await supabase.from('blog_posts').select(`id, title, slug, excerpt, cover_url, tags, published_at, ${AUTHOR}`).eq('status', 'published').order('published_at', { ascending: false })),
    [],
  )
  const posts = useMemo(() => {
    const q = search.toLowerCase()
    return (data || []).filter((p) => !q || p.title.toLowerCase().includes(q) || p.tags?.some((t) => t.toLowerCase().includes(q)))
  }, [data, search])

  return (
    <>
      <PageHero eyebrow="SkillRise blog" title="Insights from our teachers" description="Tips, tutorials and career advice from the practitioners who teach at SkillRise Academy.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search articles…" className="mx-auto mt-8 max-w-md text-left" />
      </PageHero>
      <section className="container-page py-14">
        {loading ? (
          <PageLoader />
        ) : posts.length === 0 ? (
          <EmptyState icon={Newspaper} title="No articles yet" description="Our teachers are writing. Check back soon!" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

export function BlogPost() {
  const { slug } = useParams()
  const { data, loading } = useQuery(async () => unwrap(await supabase.from('blog_posts').select(`*, ${AUTHOR}`).eq('slug', slug).maybeSingle()), [slug])
  if (loading) return <PageLoader />
  if (!data) return <NotFound />
  return (
    <article className="pb-20">
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          {data.status !== 'published' && <Badge tone="amber" className="ml-3 capitalize">{data.status}</Badge>}
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">{data.title}</h1>
          {data.excerpt && <p className="mt-4 text-lg text-slate-600">{data.excerpt}</p>}
          <div className="mt-6 flex items-center gap-3">
            <Avatar src={data.author?.avatar_url} name={data.author?.full_name} />
            <div>
              <p className="text-sm font-semibold text-slate-900">{data.author?.full_name}</p>
              <p className="text-xs text-slate-500">{formatDate(data.published_at || data.created_at, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {data.cover_url && <img src={data.cover_url} alt="" className="mt-10 aspect-[16/9] w-full rounded-2xl object-cover" />}
        <Markdown className="prose-lg mt-10">{data.content}</Markdown>
        {data.tags?.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {data.tags.map((t) => (
              <Badge key={t}>#{t}</Badge>
            ))}
          </div>
        )}
        {data.author?.bio && (
          <div className="mt-12 flex gap-4 rounded-2xl border border-slate-200 p-6">
            <Avatar src={data.author.avatar_url} name={data.author.full_name} size="lg" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Written by</p>
              <p className="font-semibold text-slate-900">{data.author.full_name}</p>
              {data.author.headline && <p className="text-sm text-brand-700">{data.author.headline}</p>}
              <p className="mt-2 text-sm text-slate-600">{data.author.bio}</p>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
