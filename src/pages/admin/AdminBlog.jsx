import { useState } from 'react'
import toast from 'react-hot-toast'
import { Archive, Eye, FileText, Pencil, Plus, Send, Undo2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDate } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { Avatar, Button, Card, EmptyState, PageHeader, PageLoader, StatusBadge, Tabs } from '../../components/ui'
import { ReturnModal } from './AdminCourses'

export default function AdminBlog() {
  const { t } = useI18n()
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
      <PageHeader title={t('portalNav.blog')} description={t('admin.blog.description')} actions={<Button to="/teacher/blog/new"><Plus className="h-4 w-4" /> {t('tblog.newPost')}</Button>} />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'pending', label: t('status.pending'), count: t('common.number', { n: count('pending') }) },
          { value: 'published', label: t('status.published'), count: t('common.number', { n: count('published') }) },
          { value: 'draft', label: t('admin.drafts'), count: t('common.number', { n: count('draft') }) },
          { value: 'archived', label: t('status.archived'), count: t('common.number', { n: count('archived') }) },
          { value: 'all', label: t('common.all') },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={FileText} title={t('admin.blog.empty')} />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {list.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Avatar src={p.author?.avatar_url} name={p.author?.full_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="font-medium text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-500">
                    {p.author?.full_name} · {p.published_at ? t('admin.blog.publishedOn', { date: formatDate(p.published_at) }) : t('teacher.updated', { time: formatDate(p.updated_at) })}
                  </p>
                </div>
                <StatusBadge status={p.status} />
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" to={`/blog/${p.slug}`} title={t('courseDetail.preview')}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" to={`/teacher/blog/${p.id}`} title={t('common.edit')}><Pencil className="h-4 w-4" /></Button>
                  {p.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => setStatus(p, 'published', t('admin.blog.published'))}><Send className="h-3.5 w-3.5 rtl:-scale-x-100" /> {t('teacher.editor.publish')}</Button>
                      <Button size="sm" variant="secondary" onClick={() => setReturning(p)}><Undo2 className="h-3.5 w-3.5 rtl:-scale-x-100" /> {t('admin.return')}</Button>
                    </>
                  )}
                  {p.status === 'published' && <Button size="sm" variant="secondary" onClick={() => setStatus(p, 'archived', t('admin.blog.archived'))}><Archive className="h-3.5 w-3.5" /> {t('admin.archive')}</Button>}
                  {p.status === 'archived' && <Button size="sm" variant="secondary" onClick={() => setStatus(p, 'published', t('admin.blog.restored'))}>{t('admin.restore')}</Button>}
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
