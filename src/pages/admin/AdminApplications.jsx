import { useState } from 'react'
import toast from 'react-hot-toast'
import { Check, ExternalLink, UserCheck, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDate } from '../../lib/utils'
import { useConfirm } from '../../components/shared'
import { Avatar, Button, Card, EmptyState, PageHeader, PageLoader, StatusBadge, Tabs } from '../../components/ui'

export default function AdminApplications() {
  const confirm = useConfirm()
  const [tab, setTab] = useState('pending')
  const { data, loading, reload } = useQuery(
    async () => unwrap(await supabase.from('teacher_applications').select('*, user:profiles!teacher_applications_user_id_fkey(full_name, avatar_url, country, role)').order('created_at', { ascending: false })),
    [],
  )

  const review = async (app, approve) => {
    const ok = await confirm({
      title: approve ? 'Approve teacher?' : 'Reject application?',
      message: approve ? `${app.user?.full_name} will be able to create courses and write blog posts.` : `${app.user?.full_name} will be able to apply again later.`,
      confirmLabel: approve ? 'Approve' : 'Reject',
      danger: !approve,
    })
    if (!ok) return
    const { error } = await supabase.rpc('review_teacher_application', { p_application_id: app.id, p_approve: approve })
    if (error) return toast.error(errorMessage(error))
    toast.success(approve ? 'Teacher approved' : 'Application rejected')
    reload()
  }

  if (loading) return <PageLoader />
  const list = data.filter((a) => tab === 'all' || a.status === tab)

  return (
    <>
      <PageHeader title="Teacher applications" description="Review people who want to teach on SkillRise." />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'pending', label: 'Pending', count: data.filter((a) => a.status === 'pending').length },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'all', label: 'All' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon={UserCheck} title="No applications here" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((a) => (
            <Card key={a.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar src={a.user?.avatar_url} name={a.user?.full_name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{a.user?.full_name || 'Unnamed user'}</p>
                  <p className="text-xs text-slate-500">Applied {formatDate(a.created_at)}{a.user?.country && ` · ${a.user.country}`}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-400">Expertise</dt>
                  <dd className="font-medium text-slate-800">{a.expertise}</dd>
                </div>
                {a.experience && (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-400">Experience</dt>
                    <dd className="whitespace-pre-line text-slate-600">{a.experience}</dd>
                  </div>
                )}
                {a.motivation && (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-400">Motivation</dt>
                    <dd className="whitespace-pre-line text-slate-600">{a.motivation}</dd>
                  </div>
                )}
                {a.portfolio_url && (
                  <a href={a.portfolio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all font-medium text-brand-600 hover:underline">
                    {a.portfolio_url} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                )}
              </dl>
              {a.status === 'pending' && (
                <div className="mt-auto flex gap-2 pt-5">
                  <Button size="sm" onClick={() => review(a, true)}><Check className="h-4 w-4" /> Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => review(a, false)}><X className="h-4 w-4" /> Reject</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
