import { Link } from 'react-router-dom'
import { PenLine, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { formatDate } from '../../lib/utils'
import { Button, Card, EmptyState, PageHeader, PageLoader, StatusBadge } from '../../components/ui'

export default function TeacherBlog() {
  const { user } = useAuth()
  const { data, loading } = useQuery(
    async () => unwrap(await supabase.from('blog_posts').select('id, title, slug, status, excerpt, updated_at, published_at, review_note').eq('author_id', user.id).order('updated_at', { ascending: false })),
    [user.id],
  )
  if (loading) return <PageLoader />
  return (
    <>
      <PageHeader title="My blog posts" description="Share tips, tutorials and stories with the SkillRise community." actions={<Button to="/teacher/blog/new"><Plus className="h-4 w-4" /> New post</Button>} />
      {data.length === 0 ? (
        <EmptyState icon={PenLine} title="Write your first post" description="Posts are reviewed by our team before they appear on the public blog." action={<Button to="/teacher/blog/new">Start writing</Button>} />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {data.map((p) => (
              <li key={p.id}>
                <Link to={`/teacher/blog/${p.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{p.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{p.excerpt || 'No excerpt'}</p>
                    {p.review_note && p.status === 'draft' && <p className="mt-1 text-xs text-amber-700">Reviewer note: {p.review_note}</p>}
                  </div>
                  <span className="text-xs text-slate-500">{p.published_at ? `Published ${formatDate(p.published_at)}` : `Edited ${formatDate(p.updated_at)}`}</span>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
