import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { BookOpenCheck, Clock3, Trophy, Sparkles } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

function Dashboard() {
  const { user, isAuthenticated, loading, subscription } = useAuth()
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

  const progressSummary = dashboard?.progress || []
  const recent = (dashboard?.recently_viewed || []).filter((item) => ['course', 'lesson'].includes(item.content_type))
  const achievements = dashboard?.achievements || []
  const recommended = dashboard?.recommended_courses || []
  const completedLessons = progressSummary.filter((item) => item.is_completed).length

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
          <div className="dashboard-stat"><BookOpenCheck size={20} /><span>Lessons started</span><strong>{progressSummary.length}</strong></div>
          <div className="dashboard-stat"><span className="dashboard-check-icon">✓</span><span>Lessons completed</span><strong>{completedLessons}</strong></div>
          <div className="dashboard-stat"><Trophy size={20} /><span>Achievements</span><strong>{achievements.length}</strong></div>
        </div>

      <div className="dashboard-grid">
        <section className="detail-box dashboard-card">
          <div className="section-heading section-heading-tight">
            <span className="eyebrow">Continue Learning</span>
            <h2>Your learning path</h2>
          </div>
          {progressSummary.length > 0 ? (
            <div className="stacked-list">
              {progressSummary.map((item) => (
                <div className="dashboard-progress-item" key={item.id}>
                  <div className="mini-card-header">
                    <strong>{item.lesson_title}</strong>
                    <span>{item.completion_percentage}%</span>
                  </div>
                  <div className="progress-bar"><span style={{ width: `${item.completion_percentage}%` }} /></div>
                  <Link className="dashboard-action" to={item.course ? `/learn/courses/${item.course}` : '/learn'}>Continue <span aria-hidden="true">→</span></Link>
                </div>
              ))}
            </div>
          ) : (
            <p>No lessons started yet. Explore the <Link to="/learn">Learn</Link> section to begin.</p>
          )}
        </section>

        <section className="detail-box dashboard-card">
          <div className="section-heading section-heading-tight">
            <span className="eyebrow">Recently viewed</span>
            <h2>Come back to</h2>
          </div>
          {recent.length > 0 ? (
            <div className="recent-course-list">
              {recent.map((item) => (
                <Link className="recent-course-item" to={`/learn/courses/${item.course_id}`} key={`${item.content_type}-${item.object_id}`}>
                  <span className="recent-course-icon"><Clock3 size={16} /></span>
                  <span><strong>{item.title}</strong><small>{item.content_type === 'lesson' ? 'Lesson in your course' : 'Course'}</small></span>
                  <span className="recent-course-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <p>Your recent course visits will appear here.</p>
          )}
        </section>

        <section className="detail-box dashboard-card wide-card">
          <div className="section-heading section-heading-tight">
            <span className="eyebrow">Recommended</span>
            <h2>For you</h2>
          </div>
          {recommended.length > 0 ? (
            <div className="recommendation-grid">
              {recommended.map((course) => (
                <Link className="dashboard-recommendation" to={`/learn/courses/${course.id}`} key={course.id}>
                  <Sparkles size={18} />
                  <strong>{course.title}</strong>
                  <p>{course.description || 'Explore this next step in your musical journey.'}</p>
                  <span className="dashboard-action">View course <span aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
          ) : (
            <p>Keep exploring instruments and lessons to unlock tailored recommendations.</p>
          )}
        </section>

        <section className="detail-box dashboard-card">
          <div className="section-heading section-heading-tight">
            <span className="eyebrow">Achievements</span>
            <h2>Milestones</h2>
          </div>
          {achievements.length > 0 ? (
            <ul className="pill-list">
              {achievements.map((entry) => <li key={entry.id}><Trophy size={14} /> {entry.achievement.title}</li>)}
            </ul>
          ) : (
            <p>Complete your first lesson and first instrument exploration to unlock achievements.</p>
          )}
        </section>
      </div>
    </div>
    </div>
  )
}

export default Dashboard
