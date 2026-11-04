import { supabase } from './supabase'
import { unwrap } from './useQuery'

// Enrollments with course info and per-course lesson progress.
export async function fetchMyEnrollments(userId) {
  const [enrollments, progress] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id, enrolled_at, completed_at, course:courses(id, title, slug, subtitle, thumbnail_url, level, category:categories(name, icon, color), teacher:profiles!courses_teacher_id_fkey(full_name, avatar_url), lessons(id))')
      .eq('student_id', userId)
      .order('enrolled_at', { ascending: false }),
    supabase.from('lesson_progress').select('course_id, lesson_id, completed_at').eq('student_id', userId),
  ])
  const done = {}
  const lastActivity = {}
  for (const p of unwrap(progress) || []) {
    done[p.course_id] = (done[p.course_id] || 0) + 1
    if (!lastActivity[p.course_id] || p.completed_at > lastActivity[p.course_id]) lastActivity[p.course_id] = p.completed_at
  }
  return (unwrap(enrollments) || [])
    .filter((e) => e.course)
    .map((e) => {
      const total = e.course.lessons.length
      const completed = done[e.course.id] || 0
      return {
        ...e,
        total,
        completed,
        percent: total ? Math.round((completed / total) * 100) : 0,
        lastActivity: lastActivity[e.course.id] || e.enrolled_at,
      }
    })
}

export async function fetchTeacherCourseIds(userId) {
  const data = unwrap(await supabase.from('courses').select('id, title').eq('teacher_id', userId))
  return data || []
}
