import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Eye, Send, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, slugify, uniqueSlug } from '../../lib/utils'
import { ImageUpload, Markdown, useConfirm } from '../../components/shared'
import { Button, Card, CardHeader, Input, PageLoader, StatusBadge, Tabs, Textarea } from '../../components/ui'

export default function BlogEditor() {
  const { id } = useParams()
  const isNew = id === 'new'
  const { data: post, loading } = useQuery(async () => (isNew ? null : unwrap(await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle())), [id])
  if (loading) return <PageLoader />
  return <EditorForm key={post?.id || 'new'} post={post} />
}

function EditorForm({ post }) {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [mode, setMode] = useState('write')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    cover_url: post?.cover_url || '',
    tags: post?.tags?.join(', ') || '',
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const back = isAdmin && post && post.author_id !== user.id ? '/admin/blog' : '/teacher/blog'

  const save = async (status) => {
    if (!form.title.trim()) return toast.error('Add a title first')
    setBusy(true)
    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt,
      content: form.content,
      cover_url: form.cover_url || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      ...(status && { status }),
    }
    let result
    if (post) {
      result = await supabase.from('blog_posts').update(payload).eq('id', post.id).select('id').single()
    } else {
      const { data: taken } = await supabase.from('blog_posts').select('id').eq('slug', slugify(payload.title)).maybeSingle()
      result = await supabase
        .from('blog_posts')
        .insert({ ...payload, author_id: user.id, slug: taken ? uniqueSlug(payload.title) : slugify(payload.title) || uniqueSlug('post') })
        .select('id')
        .single()
    }
    setBusy(false)
    if (result.error) return toast.error(errorMessage(result.error))
    toast.success(status === 'pending' ? 'Submitted for review' : status === 'published' ? 'Published!' : 'Saved')
    if (!post || status) navigate(back)
  }

  const remove = async () => {
    if (!(await confirm({ title: 'Delete post?', message: 'This cannot be undone.', danger: true, confirmLabel: 'Delete' }))) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', post.id)
    if (error) return toast.error(errorMessage(error))
    navigate(back)
  }

  const status = post?.status || 'draft'

  return (
    <>
      <div className="mb-6">
        <Link to={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{post ? 'Edit post' : 'New post'}</h1>
            <StatusBadge status={status} />
          </div>
          <div className="flex flex-wrap gap-2">
            {post?.status === 'published' && <Button to={`/blog/${post.slug}`} variant="secondary" size="sm"><Eye className="h-4 w-4" /> View</Button>}
            {post && (isAdmin || status !== 'published') && (
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={remove} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
            )}
            <Button variant="secondary" size="sm" loading={busy} onClick={() => save()}>Save {status === 'published' ? 'changes' : 'draft'}</Button>
            {isAdmin
              ? status !== 'published' && <Button size="sm" loading={busy} onClick={() => save('published')}><Send className="h-4 w-4" /> Publish</Button>
              : status === 'draft' && <Button size="sm" loading={busy} onClick={() => save('pending')}><Send className="h-4 w-4" /> Submit for review</Button>}
          </div>
        </div>
        {post?.review_note && status === 'draft' && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Reviewer note: {post.review_note}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="space-y-5 p-5">
            <input className="w-full border-0 p-0 font-display text-3xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0" placeholder="Post title" value={form.title} onChange={set('title')} />
            <Tabs value={mode} onChange={setMode} tabs={[{ value: 'write', label: 'Write' }, { value: 'preview', label: 'Preview' }]} />
            {mode === 'write' ? (
              <Textarea rows={22} className="font-mono" hint="Markdown supported: # Heading, **bold**, *italic*, - lists, [links](https://…), ![images](https://…)" value={form.content} onChange={set('content')} />
            ) : (
              <div className="min-h-[400px]">{form.content ? <Markdown>{form.content}</Markdown> : <p className="text-sm text-slate-400">Nothing to preview yet.</p>}</div>
            )}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Cover image" />
            <div className="p-5">
              <ImageUpload value={form.cover_url} onChange={(v) => setForm({ ...form, cover_url: v })} folder="blog" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Details" />
            <div className="space-y-5 p-5">
              <Textarea label="Excerpt" rows={3} hint="A short summary shown on blog cards." value={form.excerpt} onChange={set('excerpt')} />
              <Input label="Tags" placeholder="design, career, ai" hint="Separate with commas." value={form.tags} onChange={set('tags')} />
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
