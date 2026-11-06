import { PageHeader } from '../../components/ui'
import { useI18n } from '../../lib/i18n'
import { AnnouncementComposer } from '../teacher/editor/CourseAnnouncementsTab'

export default function AdminAnnouncements() {
  const { t } = useI18n()
  return (
    <>
      <PageHeader title={t('admin.announcements.title')} description={t('admin.announcements.description')} />
      <AnnouncementComposer courseId={null} description={t('admin.announcements.hint')} />
    </>
  )
}
