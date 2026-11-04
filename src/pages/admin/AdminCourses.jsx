import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Archive, BookOpen, Eye, Pencil, Send, Star, Undo2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { cn, errorMessage, timeAgo } from '../../lib/utils'
import { CourseThumbnail } from '../../components/shared'
import { Button, Card, EmptyState, Modal, PageHeader, PageLoader, SearchInput, StatusBadge, Tabs, Textarea } from '../../components/ui'

export default function AdminCourses() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'all'
  const [search, setSearch] = useState('')
  const [rejecting, setRejecting] = useState(null)
  const { data, loading, reload } = useQuery(
    async () => unwrap(await supabase.from('courses').select('id, title, slug, status, featured, thumbnail_url, updated_at, category:categories(name, icon, color), teacher:profiles!courses_teacher_id_fkey(full_name), enrollments(count), lessons(count)').order('updated_at', { ascending: false })),
    [],
  )

  const list = useMemo(() => {
    const q = search.toLowerCase()
    return (data || []).filter((c) => (status === 'all' || c.status === status) && (!q || c.title.toLowerCase().includes(q) || c.teacher?.full_name?.toLowerCase().includes(q)))
  }, [data, status, search])

  const update = async (c, patch, message) => {
    const { error } = await supabase.from('courses').update(patch).eq('id', c.id)
    if (error) return toast.error(errorMessage(error))
    toast.success(message)
    reload()
  }

  if (loading) return <PageLoader />
  const count = (s) => data.filter((c) => c.status === s).length

  return (
    <>
      <PageHeader title="Courses" description="Review, publish and feature courses across the academy." />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Tabs
          value={status}
          onChange={(s) => setParams(s === 'all' ? {} : { status: s })}
          tabs={[
            { value: 'all', label: 'All', count: data.length },
            { value: 'pending', label: 'In review', count: count('pending') },
            { value: 'published', label: 'Published', count: count('published') },
            { value: 'draft', label: 'Drafts', count: count('draft') },
            { value: 'archived', label: 'Archived', count: count('archived') },
          ]}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Search courses or teachers…" className="sm:w-72" />
      </div>
      {list.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses here" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Teacher</th>
                  <th>Lessons</th>
                  <th>Learners</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <CourseThumbnail course={c} className="!w-20 shrink-0 rounded-md" />
                        <div className="min-w-0">
                          <p className="max-w-xs truncate font-medium text-slate-900">{c.title}</p>
                          <p className="text-xs text-slate-500">{c.category?.name || 'Uncategorized'} · {timeAgo(c.updated_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{c.teacher?.full_name}</td>
                    <td>{c.lessons?.[0]?.count || 0}</td>
                    <td>{c.enrollments?.[0]?.count || 0}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title={c.featured ? 'Unfeature' : 'Feature on home page'} onClick={() => update(c, { featured: !c.featured }, c.featured ? 'Removed from featured' : 'Featured on home page')}>
                          <Star className={cn('h-4 w-4', c.featured && 'fill-amber-400 text-amber-500')} />
                        </Button>
                        <Button variant="ghost" size="icon" to={`/courses/${c.slug}`} title="Preview"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" to={`/teacher/courses/${c.id}`} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        {c.status !== 'published' && c.status !== 'archived' && (
                          <Button size="sm" onClick={() => update(c, { status: 'published', review_note: null }, 'Course published')}><Send className="h-3.5 w-3.5" /> Publish</Button>
                        )}
                        {c.status === 'pending' && <Button size="sm" variant="secondary" onClick={() => setRejecting(c)}><Undo2 className="h-3.5 w-3.5" /> Return</Button>}
                        {c.status === 'published' && <Button size="sm" variant="secondary" onClick={() => update(c, { status: 'archived' }, 'Course archived')}><Archive className="h-3.5 w-3.5" /> Archive</Button>}
                        {c.status === 'archived' && <Button size="sm" variant="secondary" onClick={() => update(c, { status: 'published' }, 'Course restored')}>Restore</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <ReturnModal item={rejecting} table="courses" onClose={() => setRejecting(null)} onDone={reload} />
    </>
  )
}

// Sends content back to draft with a note for the author.
export function ReturnModal({ item, table, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    const { error } = await supabase.from(table).update({ status: 'draft', review_note: note || null }).eq('id', item.id)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    toast.success('Returned to author')
    setNote('')
    onClose()
    onDone()
  }
  return (
    <Modal open={!!item} onClose={onClose} title="Return for changes" description={item?.title} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Return to author</Button></>}>
      <Textarea label="Note for the author" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain what needs to change before this can be published." />
    </Modal>
  )
}
