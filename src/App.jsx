import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { homePathFor, useAuth } from './context/AuthContext'
import { RequireAuth } from './components/shared'
import { PageLoader } from './components/ui'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import Home from './pages/public/Home'
import Courses from './pages/public/Courses'
import CourseDetail from './pages/public/CourseDetail'
import About from './pages/public/About'
import { BlogList, BlogPost } from './pages/public/Blog'
import Donate from './pages/public/Donate'
import Contact from './pages/public/Contact'
import Teach from './pages/public/Teach'
import { CertificateView, VerifyCertificate } from './pages/public/Certificate'
import NotFound from './pages/public/NotFound'
import { ForgotPassword, Login, ResetPassword, Signup } from './pages/auth/Auth'

// Portals are split into their own chunks so the public site stays fast.
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'))
const MyCourses = lazy(() => import('./pages/student/MyCourses'))
const MyCertificates = lazy(() => import('./pages/student/MyCertificates'))
const CoursePlayer = lazy(() => import('./pages/student/CoursePlayer'))
const Announcements = lazy(() => import('./pages/shared/Announcements'))
const ProfileSettings = lazy(() => import('./pages/shared/ProfileSettings'))
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const TeacherCourses = lazy(() => import('./pages/teacher/TeacherCourses'))
const CourseEditor = lazy(() => import('./pages/teacher/CourseEditor'))
const Submissions = lazy(() => import('./pages/teacher/Submissions'))
const TeacherBlog = lazy(() => import('./pages/teacher/TeacherBlog'))
const BlogEditor = lazy(() => import('./pages/teacher/BlogEditor'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications'))
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminBlog = lazy(() => import('./pages/admin/AdminBlog'))
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'))
const AdminCertificates = lazy(() => import('./pages/admin/AdminCertificates'))
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminHomepage = lazy(() => import('./pages/admin/AdminHomepage'))

function DashboardRedirect() {
  const { profile } = useAuth()
  return <Navigate to={homePathFor(profile?.role)} replace />
}

const TEACHER = ['teacher', 'admin']
const ADMIN = ['admin']

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:slug" element={<CourseDetail />} />
          <Route path="about" element={<About />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="donate" element={<Donate />} />
          <Route path="contact" element={<Contact />} />
          <Route path="teach" element={<Teach />} />
          <Route path="verify" element={<VerifyCertificate />} />
          <Route path="certificate/:code" element={<CertificateView />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        <Route path="learn/:slug" element={<RequireAuth><CoursePlayer /></RequireAuth>} />

        <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
          <Route path="dashboard" element={<DashboardRedirect />} />
          <Route path="student" element={<StudentDashboard />} />
          <Route path="student/courses" element={<MyCourses />} />
          <Route path="student/certificates" element={<MyCertificates />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="settings/profile" element={<ProfileSettings />} />

          <Route path="teacher" element={<RequireAuth roles={TEACHER}><TeacherDashboard /></RequireAuth>} />
          <Route path="teacher/courses" element={<RequireAuth roles={TEACHER}><TeacherCourses /></RequireAuth>} />
          <Route path="teacher/courses/:id" element={<RequireAuth roles={TEACHER}><CourseEditor /></RequireAuth>} />
          <Route path="teacher/submissions" element={<RequireAuth roles={TEACHER}><Submissions /></RequireAuth>} />
          <Route path="teacher/blog" element={<RequireAuth roles={TEACHER}><TeacherBlog /></RequireAuth>} />
          <Route path="teacher/blog/:id" element={<RequireAuth roles={TEACHER}><BlogEditor /></RequireAuth>} />

          <Route path="admin" element={<RequireAuth roles={ADMIN}><AdminDashboard /></RequireAuth>} />
          <Route path="admin/users" element={<RequireAuth roles={ADMIN}><AdminUsers /></RequireAuth>} />
          <Route path="admin/applications" element={<RequireAuth roles={ADMIN}><AdminApplications /></RequireAuth>} />
          <Route path="admin/courses" element={<RequireAuth roles={ADMIN}><AdminCourses /></RequireAuth>} />
          <Route path="admin/categories" element={<RequireAuth roles={ADMIN}><AdminCategories /></RequireAuth>} />
          <Route path="admin/blog" element={<RequireAuth roles={ADMIN}><AdminBlog /></RequireAuth>} />
          <Route path="admin/announcements" element={<RequireAuth roles={ADMIN}><AdminAnnouncements /></RequireAuth>} />
          <Route path="admin/certificates" element={<RequireAuth roles={ADMIN}><AdminCertificates /></RequireAuth>} />
          <Route path="admin/messages" element={<RequireAuth roles={ADMIN}><AdminMessages /></RequireAuth>} />
          <Route path="admin/homepage" element={<RequireAuth roles={ADMIN}><AdminHomepage /></RequireAuth>} />
          <Route path="admin/settings" element={<RequireAuth roles={ADMIN}><AdminSettings /></RequireAuth>} />
        </Route>
      </Routes>
    </Suspense>
  )
}
