import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, Bookmark, BookOpen, CheckCircle2, Compass, Sparkles } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth()
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    api.get('auth/dashboard/').then((data) => setDashboard(data)).catch(() => setDashboard(null))
  }, [isAuthenticated])

  if (loading) {
    return <div className="container py-5"><p>Loading your BajaGhar journey…</p></div>
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const courseProgress = dashboard?.course_progress || []
  const favoriteCourses = dashboard?.favorite_courses || []
  const completedCourses = courseProgress.filter((item) => item.is_completed).length

  return (
    <div className="dashboard-page">
      <header className="dashboard-header page-header">
        <div className="container dashboard-header-inner">
          <div className="dashboard-welcome-copy">
            <span className="eyebrow">Learning hub</span>
            <h1>Namaste, {user.first_name || user.username || 'friend'} 👋</h1>
            <p>Continue your journey into Nepal&apos;s traditional musical heritage.</p>
          </div>
          <div className="dashboard-header-art" aria-hidden="true"><div className="dashboard-art-ring"><Compass size={34} /></div><span className="dashboard-art-note note-one">♪</span><span className="dashboard-art-note note-two">♫</span></div>
        </div>
      </header>

      <div className="dashboard-shell container">
        <div className="dashboard-stats">
          <div className="dashboard-stat stat-progress"><span className="dashboard-stat-icon"><BookOpen size={20} /></span><span>Courses in progress</span><strong>{courseProgress.length}</strong></div>
          <div className="dashboard-stat stat-complete"><span className="dashboard-stat-icon"><CheckCircle2 size={20} /></span><span>Courses completed</span><strong>{completedCourses}</strong></div>
        </div>

      <div className="dashboard-grid">
        <section className="detail-box dashboard-card wide-card">
          <div className="section-heading section-heading-tight">
            <span className="eyebrow">Your courses</span>
            <h2>Course progress</h2>
          </div>
          {courseProgress.length > 0 ? (
            <div className="course-progress-grid">
              {courseProgress.map((item) => (
                <article className="course-progress-card" key={item.course}>
                  <div className="mini-card-header">
                    <span className="course-progress-title"><BookOpen size={16} /><strong>{item.title}</strong></span>
                    <span className="progress-ring" style={{ '--progress': `${item.percentage}%` }}><b>{item.percentage}%</b></span>
                  </div>
                  <div className="progress-bar" aria-label={`${item.percentage}% complete`}><span style={{ width: `${item.percentage}%` }} /></div>
                  <div className="course-progress-meta"><span>{item.completed_lessons} of {item.total_lessons} lessons</span><Link className="dashboard-action" to={`/learn/courses/${item.course}`}>{item.is_completed ? 'Review course' : 'Continue'} <ArrowRight size={15} /></Link></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty"><span className="dashboard-empty-icon"><Sparkles size={22} /></span><p>You have not started a course yet.</p><Link className="btn btn-primary" to="/learn">Explore courses</Link></div>
          )}
        </section>

        <section className="detail-box dashboard-card wide-card">
          <div className="section-heading section-heading-tight">
            <span className="eyebrow">Saved courses</span>
            <h2>Your favorites</h2>
          </div>
          {favoriteCourses.length > 0 ? (
            <div className="recommendation-grid">
              {favoriteCourses.map((course) => (
                <Link className="dashboard-recommendation" to={`/learn/courses/${course.id}`} key={course.id}>
                  <span className="favorite-course-icon"><Bookmark size={18} /></span>
                  <strong>{course.title}</strong>
                  <p>{course.description || 'Return to this saved learning path.'}</p>
                  <span className="dashboard-action">Open course <ArrowRight size={15} /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty"><span className="dashboard-empty-icon"><Bookmark size={22} /></span><p>Your favorite courses will appear here.</p><Link className="btn btn-secondary" to="/learn">Browse courses</Link></div>
          )}
        </section>

      </div>
    </div>
    </div>
  )
}

export default Dashboard
