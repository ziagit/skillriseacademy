import { useState } from 'react'
import toast from 'react-hot-toast'
import { Archive, Eye, FileText, Pencil, Plus, Send, Undo2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDate } from '../../lib/utils'
import { Avatar, Button, Card, EmptyState, PageHeader, PageLoader, StatusBadge, Tabs } from '../../components/ui'
import { ReturnModal } from './AdminCourses'

export default function AdminBlog() {
  const [tab, setTab] = useState('pending')
  const [returning, setReturning] = useState(null)
  const { data, loading, reload } = useQuery(
    async () => unwrap(await supabase.from('blog_posts').select('id, title, slug, status, excerpt, updated_at, published_at, author:profiles!blog_posts_author_id_fkey(full_name, avatar_url)').order('updated_at', { ascending: false })),
    [],
  )

  const setStatus = async (p, status, message) => {
    const { error } = await supabase.from('blog_posts').update({ status, ...(status === 'published' && { review_note: null }) }).eq('id', p.id)
    if (error) return toast.error(errorMessage(error))
    toast.success(message)
    reload()
  }

  if (loading) return <PageLoader />
  const list = data.filter((p) => tab === 'all' || p.status === tab)
  const count = (s) => data.filter((p) => p.status === s).length

  return (
    <>
      <PageHeader title="Blog" description="Moderate posts written by teachers, or publish your own." actions={<Button to="/teacher/blog/new"><Plus className="h-4 w-4" /> New post</Button>} />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'pending', label: 'In review', count: count('pending') },
          { value: 'published', label: 'Published', count: count('published') },
          { value: 'draft', label: 'Drafts', count: count('draft') },
          { value: 'archived', label: 'Archived', count: count('archived') },
          { value: 'all', label: 'All' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={FileText} title="No posts here" />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {list.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Avatar src={p.author?.avatar_url} name={p.author?.full_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-500">
                    {p.author?.full_name} · {p.published_at ? `published ${formatDate(p.published_at)}` : `updated ${formatDate(p.updated_at)}`}
                  </p>
                </div>
                <StatusBadge status={p.status} />
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" to={`/blog/${p.slug}`} title="Preview"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" to={`/teacher/blog/${p.id}`} title="Edit"><Pencil className="h-4 w-4" /></Button>
                  {p.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => setStatus(p, 'published', 'Post published')}><Send className="h-3.5 w-3.5" /> Publish</Button>
                      <Button size="sm" variant="secondary" onClick={() => setReturning(p)}><Undo2 className="h-3.5 w-3.5" /> Return</Button>
                    </>
                  )}
                  {p.status === 'published' && <Button size="sm" variant="secondary" onClick={() => setStatus(p, 'archived', 'Post archived')}><Archive className="h-3.5 w-3.5" /> Archive</Button>}
                  {p.status === 'archived' && <Button size="sm" variant="secondary" onClick={() => setStatus(p, 'published', 'Post restored')}>Restore</Button>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <ReturnModal item={returning} table="blog_posts" onClose={() => setReturning(null)} onDone={reload} />
    </>
  )
}
