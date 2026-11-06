import { Button } from '../../components/ui'
import { useI18n } from '../../lib/i18n'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-100">{t('common.number', { n: 404 })}</p>
      <h1 className="mt-4 text-3xl font-bold">{t('notFound.title')}</h1>
      <p className="mt-2 max-w-md text-slate-600">{t('notFound.text')}</p>
      <div className="mt-8 flex gap-3">
        <Button to="/">{t('notFound.home')}</Button>
        <Button to="/courses" variant="secondary">{t('portalNav.browseCourses')}</Button>
      </div>
    </div>
  )
}
