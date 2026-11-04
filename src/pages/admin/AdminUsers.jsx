import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDate } from '../../lib/utils'
import { useConfirm } from '../../components/shared'
import { Avatar, Button, Card, EmptyState, PageHeader, PageLoader, SearchInput, StatusBadge, Tabs } from '../../components/ui'

export default function AdminUsers() {
  const { user: me } = useAuth()
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
    if (u.id === me.id) return toast.error("You can't change your own role")
    if (await confirm({ title: `Change role to ${newRole}?`, message: `${u.full_name || u.email} will become a ${newRole}.`, confirmLabel: 'Change role' })) {
      update(u, { role: newRole }, 'Role updated')
    }
  }

  const toggleStatus = async (u) => {
    if (u.id === me.id) return toast.error("You can't suspend yourself")
    const suspend = u.status === 'active'
    if (await confirm({ title: suspend ? 'Suspend user?' : 'Reactivate user?', message: suspend ? 'They will lose access to their dashboard until reactivated.' : 'They will regain full access.', danger: suspend, confirmLabel: suspend ? 'Suspend' : 'Reactivate' })) {
      update(u, { status: suspend ? 'suspended' : 'active' }, suspend ? 'User suspended' : 'User reactivated')
    }
  }

  if (loading) return <PageLoader />
  const count = (r) => (data || []).filter((u) => r === 'all' || u.role === r).length

  return (
    <>
      <PageHeader title="Users" description="Manage roles and access for everyone on the platform." />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Tabs
          value={role}
          onChange={setRole}
          tabs={['all', 'student', 'teacher', 'admin'].map((r) => ({ value: r, label: r === 'all' ? 'All' : `${r[0].toUpperCase()}${r.slice(1)}s`, count: count(r) }))}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" className="sm:w-72" />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last sign-in</th>
                  <th className="text-right">Actions</th>
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
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium capitalize" value={u.role} onChange={(e) => changeRole(u, e.target.value)} disabled={u.id === me.id}>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td><StatusBadge status={u.status} /></td>
                    <td className="whitespace-nowrap text-slate-500">{formatDate(u.created_at)}</td>
                    <td className="whitespace-nowrap text-slate-500">{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'Never'}</td>
                    <td className="text-right">
                      {u.id !== me.id && (
                        <Button size="sm" variant={u.status === 'active' ? 'ghost' : 'soft'} className={u.status === 'active' ? 'text-red-600 hover:bg-red-50' : ''} onClick={() => toggleStatus(u)}>
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
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
