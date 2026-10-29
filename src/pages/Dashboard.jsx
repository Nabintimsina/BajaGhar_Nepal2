import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Bookmark, BookOpen, CheckCircle2 } from 'lucide-react'
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
          <div>
            <h1>Namaste, {user.first_name || user.username || 'friend'} 👋</h1>
            <p>Continue your journey into Nepal&apos;s traditional musical heritage.</p>
          </div>
        </div>
      </header>

      <div className="dashboard-shell container">
        <div className="dashboard-stats">
          <div className="dashboard-stat"><BookOpen size={20} /><span>Courses in progress</span><strong>{courseProgress.length}</strong></div>
          <div className="dashboard-stat"><CheckCircle2 size={20} /><span>Courses completed</span><strong>{completedCourses}</strong></div>
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
                    <strong>{item.title}</strong>
                    <span>{item.percentage}%</span>
                  </div>
                  <div className="progress-bar" aria-label={`${item.percentage}% complete`}><span style={{ width: `${item.percentage}%` }} /></div>
                  <div className="course-progress-meta"><span>{item.completed_lessons} of {item.total_lessons} lessons</span><Link className="dashboard-action" to={`/learn/courses/${item.course}`}>{item.is_completed ? 'Review course' : 'Continue'} <span aria-hidden="true">→</span></Link></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty"><BookOpen size={24} /><p>You have not started a course yet.</p><Link className="btn btn-primary" to="/learn">Explore courses</Link></div>
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
                  <Bookmark size={18} />
                  <strong>{course.title}</strong>
                  <p>{course.description || 'Return to this saved learning path.'}</p>
                  <span className="dashboard-action">Open course <span aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty"><Bookmark size={24} /><p>Your favorite courses will appear here.</p><Link className="btn btn-secondary" to="/learn">Browse courses</Link></div>
          )}
        </section>

      </div>
    </div>
    </div>
  )
}

export default Dashboard
