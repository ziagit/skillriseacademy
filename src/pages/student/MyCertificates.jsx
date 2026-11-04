import { Award, ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { unwrap, useQuery } from '../../lib/useQuery'
import { formatDate } from '../../lib/utils'
import { Button, Card, EmptyState, PageHeader, PageLoader } from '../../components/ui'

export default function MyCertificates() {
  const { user } = useAuth()
  const { data, loading } = useQuery(
    async () => unwrap(await supabase.from('certificates').select('id, code, issued_at, course:courses(title, slug)').eq('student_id', user.id).order('issued_at', { ascending: false })),
    [user.id],
  )
  if (loading) return <PageLoader />
  return (
    <>
      <PageHeader title="My certificates" description="Share these with employers. Each one can be verified online." />
      {data.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" description="Complete all lessons and pass all quizzes in a course to earn a certificate." action={<Button to="/student/courses">Go to my courses</Button>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-brand-700 to-brand-950">
                <div className="absolute inset-3 rounded-lg border border-amber-300/40" />
                <Award className="h-12 w-12 text-amber-300" />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900">{c.course?.title}</h3>
                <p className="mt-1 text-xs text-slate-500">Issued {formatDate(c.issued_at)}</p>
                <p className="mt-3 inline-block rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">{c.code}</p>
                <Button to={`/certificate/${c.code}`} variant="secondary" size="sm" className="mt-4 w-full">
                  View &amp; download <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
