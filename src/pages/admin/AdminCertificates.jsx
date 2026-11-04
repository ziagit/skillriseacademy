import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Award, ExternalLink, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { errorMessage, formatDate } from '../../lib/utils'
import { useConfirm } from '../../components/shared'
import { Avatar, Button, Card, EmptyState, PageHeader, PageLoader, SearchInput } from '../../components/ui'

export default function AdminCertificates() {
  const confirm = useConfirm()
  const [search, setSearch] = useState('')
  const { data, loading, reload } = useQuery(
    async () => unwrap(await supabase.from('certificates').select('id, code, issued_at, course:courses(title), student:profiles!certificates_student_id_fkey(full_name, avatar_url)').order('issued_at', { ascending: false })),
    [],
  )
  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return (data || []).filter((c) => !q || c.code.toLowerCase().includes(q) || c.student?.full_name?.toLowerCase().includes(q) || c.course?.title?.toLowerCase().includes(q))
  }, [data, search])

  const revoke = async (c) => {
    if (!(await confirm({ title: 'Revoke certificate?', message: `${c.code} will no longer verify. The learner can claim a new certificate if they still meet the requirements.`, danger: true, confirmLabel: 'Revoke' }))) return
    const { error } = await supabase.from('certificates').delete().eq('id', c.id)
    if (error) return toast.error(errorMessage(error))
    toast.success('Certificate revoked')
    reload()
  }

  if (loading) return <PageLoader />
  return (
    <>
      <PageHeader title="Certificates" description={`${data.length} certificates issued.`} actions={<SearchInput value={search} onChange={setSearch} placeholder="Search code, learner or course…" className="sm:w-80" />} />
      {rows.length === 0 ? (
        <EmptyState icon={Award} title="No certificates found" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Course</th>
                  <th>Certificate ID</th>
                  <th>Issued</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar src={c.student?.avatar_url} name={c.student?.full_name} size="sm" />
                        <span className="font-medium text-slate-900">{c.student?.full_name}</span>
                      </div>
                    </td>
                    <td>{c.course?.title}</td>
                    <td className="font-mono text-xs">{c.code}</td>
                    <td className="whitespace-nowrap text-slate-500">{formatDate(c.issued_at)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" to={`/certificate/${c.code}`} title="View"><ExternalLink className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => revoke(c)} title="Revoke"><Trash2 className="h-4 w-4" /></Button>
                      </div>
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
