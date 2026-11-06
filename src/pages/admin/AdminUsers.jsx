import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDate } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { useConfirm } from '../../components/shared'
import { Avatar, Button, Card, EmptyState, PageHeader, PageLoader, SearchInput, StatusBadge, Tabs } from '../../components/ui'

export default function AdminUsers() {
  const { user: me } = useAuth()
  const { t } = useI18n()
  const confirm = useConfirm()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const { data, loading, reload } = useQuery(async () => unwrap(await supabase.rpc('admin_list_users')), [])

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return (data || []).filter((u) => (role === 'all' || u.role === role) && (!q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)))
  }, [data, search, role])

  const update = async (u, patch, message) => {
    const { error } = await supabase.from('profiles').update(patch).eq('id', u.id)
    if (error) return toast.error(errorMessage(error))
    toast.success(message)
    reload()
  }

  const changeRole = async (u, newRole) => {
    if (u.id === me.id) return toast.error(t('admin.users.ownRole'))
    const roleName = t(`roles.${newRole}`)
    if (await confirm({ title: t('admin.users.changeRoleTitle', { role: roleName }), message: t('admin.users.changeRoleMessage', { name: u.full_name || u.email, role: roleName }), confirmLabel: t('admin.users.changeRole') })) {
      update(u, { role: newRole }, t('admin.users.roleUpdated'))
    }
  }

  const toggleStatus = async (u) => {
    if (u.id === me.id) return toast.error(t('admin.users.ownSuspend'))
    const suspend = u.status === 'active'
    if (await confirm({ title: suspend ? t('admin.users.suspendTitle') : t('admin.users.reactivateTitle'), message: suspend ? t('admin.users.suspendMessage') : t('admin.users.reactivateMessage'), danger: suspend, confirmLabel: suspend ? t('admin.users.suspend') : t('admin.users.reactivate') })) {
      update(u, { status: suspend ? 'suspended' : 'active' }, suspend ? t('admin.users.suspended') : t('admin.users.reactivated'))
    }
  }

  if (loading) return <PageLoader />
  const count = (r) => (data || []).filter((u) => r === 'all' || u.role === r).length

  return (
    <>
      <PageHeader title={t('portalNav.users')} description={t('admin.users.description')} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Tabs
          value={role}
          onChange={setRole}
          tabs={['all', 'student', 'teacher', 'admin'].map((r) => ({ value: r, label: t(`admin.users.tabs.${r}`), count: t('common.number', { n: count(r) }) }))}
        />
        <SearchInput value={search} onChange={setSearch} placeholder={t('admin.users.search')} className="sm:w-72" />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Users} title={t('admin.users.empty')} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('admin.users.user')}</th>
                  <th>{t('profile.role')}</th>
                  <th>{t('studentsTab.status')}</th>
                  <th>{t('admin.users.joined')}</th>
                  <th>{t('admin.users.lastSignIn')}</th>
                  <th className="text-end">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar_url} name={u.full_name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{u.full_name || '—'}</p>
                          <p dir="ltr" className="text-start text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium capitalize" value={u.role} onChange={(e) => changeRole(u, e.target.value)} disabled={u.id === me.id}>
                        <option value="student">{t('roles.student')}</option>
                        <option value="teacher">{t('roles.teacher')}</option>
                        <option value="admin">{t('roles.admin')}</option>
                      </select>
                    </td>
                    <td><StatusBadge status={u.status} /></td>
                    <td className="whitespace-nowrap text-slate-500">{formatDate(u.created_at)}</td>
                    <td className="whitespace-nowrap text-slate-500">{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : t('admin.users.never')}</td>
                    <td className="text-end">
                      {u.id !== me.id && (
                        <Button size="sm" variant={u.status === 'active' ? 'ghost' : 'soft'} className={u.status === 'active' ? 'text-red-600 hover:bg-red-50' : ''} onClick={() => toggleStatus(u)}>
                          {u.status === 'active' ? t('admin.users.suspend') : t('admin.users.reactivate')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
