import { useState } from 'react'
import toast from 'react-hot-toast'
import { Check, ExternalLink, UserCheck, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDate } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { useConfirm } from '../../components/shared'
import { Avatar, Button, Card, EmptyState, PageHeader, PageLoader, StatusBadge, Tabs } from '../../components/ui'

export default function AdminApplications() {
  const { t } = useI18n()
  const confirm = useConfirm()
  const [tab, setTab] = useState('pending')
  const { data, loading, reload } = useQuery(
    async () => unwrap(await supabase.from('teacher_applications').select('*, user:profiles!teacher_applications_user_id_fkey(full_name, avatar_url, country, role)').order('created_at', { ascending: false })),
    [],
  )

  const review = async (app, approve) => {
    const ok = await confirm({
      title: approve ? t('admin.apps.approveTitle') : t('admin.apps.rejectTitle'),
      message: approve ? t('admin.apps.approveMessage', { name: app.user?.full_name }) : t('admin.apps.rejectMessage', { name: app.user?.full_name }),
      confirmLabel: approve ? t('admin.apps.approve') : t('admin.apps.reject'),
      danger: !approve,
    })
    if (!ok) return
    const { error } = await supabase.rpc('review_teacher_application', { p_application_id: app.id, p_approve: approve })
    if (error) return toast.error(errorMessage(error))
    toast.success(approve ? t('admin.apps.approved') : t('admin.apps.rejected'))
    reload()
  }

  if (loading) return <PageLoader />
  const list = data.filter((a) => tab === 'all' || a.status === tab)

  return (
    <>
      <PageHeader title={t('portalNav.applications')} description={t('admin.apps.description')} />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'pending', label: t('admin.apps.pending'), count: t('common.number', { n: data.filter((a) => a.status === 'pending').length }) },
          { value: 'approved', label: t('status.approved') },
          { value: 'rejected', label: t('status.rejected') },
          { value: 'all', label: t('common.all') },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={UserCheck} title={t('admin.apps.empty')} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((a) => (
            <Card key={a.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar src={a.user?.avatar_url} name={a.user?.full_name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{a.user?.full_name || t('admin.unnamed')}</p>
                  <p className="text-xs text-slate-500">{t('admin.apps.applied', { date: formatDate(a.created_at) })}{a.user?.country && ` · ${a.user.country}`}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-400">{t('teach.expertise')}</dt>
                  <dd className="font-medium text-slate-800">{a.expertise}</dd>
                </div>
                {a.experience && (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-400">{t('auth.signup.experience')}</dt>
                    <dd dir="auto" className="whitespace-pre-line text-slate-600">{a.experience}</dd>
                  </div>
                )}
                {a.motivation && (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-400">{t('admin.apps.motivation')}</dt>
                    <dd dir="auto" className="whitespace-pre-line text-slate-600">{a.motivation}</dd>
                  </div>
                )}
                {a.portfolio_url && (
                  <a href={a.portfolio_url} target="_blank" rel="noreferrer" dir="ltr" className="inline-flex items-center gap-1 break-all font-medium text-brand-600 hover:underline">
                    {a.portfolio_url} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                )}
              </dl>
              {a.status === 'pending' && (
                <div className="mt-auto flex gap-2 pt-5">
                  <Button size="sm" onClick={() => review(a, true)}><Check className="h-4 w-4" /> {t('admin.apps.approve')}</Button>
                  <Button size="sm" variant="secondary" onClick={() => review(a, false)}><X className="h-4 w-4" /> {t('admin.apps.reject')}</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
