import { useState } from 'react'
import toast from 'react-hot-toast'
import { Inbox, Mail, Reply, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { cn, errorMessage, formatDateTime, timeAgo } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { useConfirm } from '../../components/shared'
import { Button, Card, EmptyState, PageHeader, PageLoader } from '../../components/ui'

export default function AdminMessages() {
  const { t } = useI18n()
  const confirm = useConfirm()
  const [selectedId, setSelectedId] = useState(null)
  const { data, loading, reload, setData } = useQuery(async () => unwrap(await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })), [])

  const open = async (m) => {
    setSelectedId(m.id)
    if (!m.is_read) {
      setData(data.map((x) => (x.id === m.id ? { ...x, is_read: true } : x)))
      await supabase.from('contact_messages').update({ is_read: true }).eq('id', m.id)
    }
  }

  const remove = async (m) => {
    if (!(await confirm({ title: t('admin.messages.deleteTitle'), message: t('admin.messages.from', { name: m.name }), danger: true, confirmLabel: t('common.delete') }))) return
    const { error } = await supabase.from('contact_messages').delete().eq('id', m.id)
    if (error) return toast.error(errorMessage(error))
    setSelectedId(null)
    reload()
  }

  if (loading) return <PageLoader />
  const selected = data.find((m) => m.id === selectedId)

  return (
    <>
      <PageHeader title={t('portalNav.messages')} description={t('admin.messages.description')} />
      {data.length === 0 ? (
        <EmptyState icon={Inbox} title={t('admin.messages.empty')} />
      ) : (
        <Card className="grid overflow-hidden md:grid-cols-5">
          <ul className={cn('max-h-[70vh] divide-y divide-slate-100 overflow-y-auto border-slate-200 md:col-span-2 md:border-e', selected && 'hidden md:block')}>
            {data.map((m) => (
              <li key={m.id}>
                <button onClick={() => open(m)} className={cn('w-full px-5 py-4 text-start', selectedId === m.id ? 'bg-brand-50' : 'hover:bg-slate-50')}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('truncate text-sm', m.is_read ? 'text-slate-700' : 'font-semibold text-slate-900')}>
                      {!m.is_read && <span className="me-2 inline-block h-2 w-2 rounded-full bg-brand-600" />}
                      {m.name}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400">{timeAgo(m.created_at)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{m.subject || t('admin.noSubject')}</p>
                  <p className="truncate text-xs text-slate-400">{m.message}</p>
                </button>
              </li>
            ))}
          </ul>
          <div className={cn('p-6 md:col-span-3', !selected && 'hidden md:block')}>
            {selected ? (
              <div>
                <button onClick={() => setSelectedId(null)} className="mb-4 text-sm font-medium text-brand-600 md:hidden">{t('admin.messages.all')}</button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 dir="auto" className="text-lg font-semibold">{selected.subject || t('admin.noSubject')}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {selected.name} · <a href={`mailto:${selected.email}`} dir="ltr" className="text-brand-600 hover:underline">{selected.email}</a>
                    </p>
                    <p className="text-xs text-slate-400">{formatDateTime(selected.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || 'Your message to SkillRise Academy'}`)}`}><Reply className="h-4 w-4 rtl:-scale-x-100" /> {t('admin.messages.reply')}</Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => remove(selected)} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p dir="auto" className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-800">{selected.message}</p>
              </div>
            ) : (
              <div className="flex h-full min-h-60 flex-col items-center justify-center text-sm text-slate-400">
                <Mail className="mb-2 h-8 w-8" /> {t('admin.messages.select')}
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  )
}
