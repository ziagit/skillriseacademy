import { PageHeader } from '../../components/ui'
import { AnnouncementComposer } from '../teacher/editor/CourseAnnouncementsTab'

export default function AdminAnnouncements() {
  return (
    <>
      <PageHeader title="Site-wide announcements" description="Messages shown to every signed-in student and teacher." />
      <AnnouncementComposer courseId={null} description="Everyone with an account will see this." />
    </>
  )
}
