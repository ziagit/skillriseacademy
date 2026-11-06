import { Bell, Megaphone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { formatDate } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { Avatar, Badge, Card, EmptyState, PageHeader, PageLoader } from '../../components/ui'

export default function Announcements() {
  const { t } = useI18n()
  const { data, loading } = useQuery(
    async () =>
      unwrap(
        await supabase
          .from('announcements')
          .select('*, course:courses(title, slug), author:profiles!announcements_author_id_fkey(full_name, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(100),
      ),
    [],
  )
  if (loading) return <PageLoader />
  return (
    <>
      <PageHeader title={t('portalNav.announcements')} description={t('announcements.description')} />
      {data.length === 0 ? (
        <EmptyState icon={Bell} title={t('announcements.empty')} description={t('announcements.emptyHint')} />
      ) : (
        <div className="space-y-4">
          {data.map((a) => (
            <Card key={a.id} className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar src={a.author?.avatar_url} name={a.author?.full_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{a.author?.full_name}</p>
                  <p className="text-xs text-slate-500">{formatDate(a.created_at)}</p>
                </div>
                {a.course ? <Badge tone="blue">{a.course.title}</Badge> : <Badge tone="violet"><Megaphone className="h-3 w-3" /> {t('announcements.brand')}</Badge>}
              </div>
              <h3 dir="auto" className="mt-4 text-lg font-semibold">{a.title}</h3>
              <p dir="auto" className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{a.body}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
