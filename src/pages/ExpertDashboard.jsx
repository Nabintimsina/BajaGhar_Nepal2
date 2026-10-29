import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Edit3, Eye, EyeOff, Plus, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './ExpertDashboard.css'

function ExpertDashboard() {
  const { isExpert, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState([])
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCourses = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await api.get('courses/', { mine: '1' })
      setCourses(Array.isArray(response) ? response : response?.results || [])
    } catch (err) {
      setError(err.message || 'Unable to load your courses.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isExpert) loadCourses()
  }, [isExpert])

  const visibleCourses = useMemo(() => {
    if (filter === 'published') return courses.filter((course) => course.is_visible)
    if (filter === 'unpublished') return courses.filter((course) => !course.is_visible)
    return courses
  }, [courses, filter])

  if (authLoading) return <div className="container expert-dashboard-state"><h2>Checking expert access...</h2></div>
  if (!isExpert) return <div className="container expert-dashboard-state"><h2>Expert access required</h2><p>Only linked experts can manage learning courses.</p><Link to="/experts" className="btn btn-primary">Back to Experts</Link></div>

  return (
    <main className="container expert-dashboard-page">
      <header className="expert-dashboard-header">
        <div><span className="eyebrow">Expert workspace</span><h1>Course studio</h1><p>Publish, refine, and build lessons for your learners.</p></div>
        <div className="expert-dashboard-actions"><button className="icon-button" type="button" onClick={loadCourses} title="Refresh courses" aria-label="Refresh courses"><RefreshCw size={18} /></button><Link className="btn btn-primary" to="/expert-dashboard/courses/new"><Plus size={17} /> New course</Link></div>
      </header>
      {success && <p className="expert-feedback success" role="status">{success}</p>}
      {error && <p className="expert-feedback error" role="alert">{error}</p>}
      <div className="expert-dashboard-stats"><div><strong>{courses.length}</strong><span>Total courses</span></div><div><strong>{courses.filter((course) => course.is_visible).length}</strong><span>Published</span></div><div><strong>{courses.filter((course) => !course.is_visible).length}</strong><span>Unpublished</span></div></div>
      <div className="course-filter" role="tablist" aria-label="Course status"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')} type="button">All courses</button><button className={filter === 'published' ? 'active' : ''} onClick={() => setFilter('published')} type="button">Published</button><button className={filter === 'unpublished' ? 'active' : ''} onClick={() => setFilter('unpublished')} type="button">Unpublished</button></div>
      {isLoading ? <div className="expert-dashboard-empty">Loading your courses...</div> : visibleCourses.length === 0 ? <div className="expert-dashboard-empty"><BookOpen size={32} /><h2>{filter === 'all' ? 'Your studio is empty' : `No ${filter} courses`}</h2><p>Create a course and add lessons to start teaching.</p><Link className="btn btn-primary" to="/expert-dashboard/courses/new"><Plus size={17} /> Create a course</Link></div> : <div className="course-studio-grid">{visibleCourses.map((course) => <article className="studio-course-card" key={course.id}>{course.photo && <img className="studio-course-image" src={course.photo} alt={course.title} />}<div className="studio-course-card-top"><span className={`course-status ${course.is_visible ? 'published' : 'draft'}`}>{course.is_visible ? <><Eye size={14} /> Published</> : <><EyeOff size={14} /> Draft</>}</span><span>{course.level || 'Beginner'}</span></div><h2>{course.title}</h2><p>{course.description || 'No description yet.'}</p><div className="studio-course-meta"><span><BookOpen size={15} /> {course.lessons_count || 'Lessons'}</span><span>{course.is_premium ? 'Premium' : 'Free'}</span></div><Link className="btn btn-secondary studio-edit-link" to={`/expert-dashboard/courses/${course.id}/edit`}><Edit3 size={16} /> Edit course</Link></article>)}</div>}
    </main>
  )
}

export default ExpertDashboard