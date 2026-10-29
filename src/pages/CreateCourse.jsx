import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Edit3, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './CreateCourse.css'

const emptyForm = { title: '', description: '', level: 'Beginner', estimated_duration_minutes: 0, what_you_will_learn: '', target_audience: '', requirements: '', is_premium: false, is_visible: false }

function CreateCourse() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { isExpert, loading } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!location.state?.success) return
    setSuccess(location.state.success)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location, navigate])

  useEffect(() => {
    if (!id || !isExpert) return
    const loadCourse = async () => {
      try {
        const [courseData, lessonResponse] = await Promise.all([api.get(`courses/${id}/`, { mine: '1' }), api.get('lessons/', { course: id })])
        setCourse(courseData)
        setForm({ title: courseData.title || '', description: courseData.description || '', level: courseData.level || 'Beginner', estimated_duration_minutes: courseData.estimated_duration_minutes || 0, what_you_will_learn: courseData.what_you_will_learn || '', target_audience: courseData.target_audience || '', requirements: courseData.requirements || '', is_premium: Boolean(courseData.is_premium), is_visible: Boolean(courseData.is_visible) })
        setLessons(Array.isArray(lessonResponse) ? lessonResponse : lessonResponse?.results || [])
      } catch (err) {
        setError(err.message || 'Unable to load this course.')
      } finally {
        setIsLoading(false)
      }
    }
    loadCourse()
  }, [id, isExpert])

  const updateField = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = { ...form, estimated_duration_minutes: Number(form.estimated_duration_minutes) || 0 }
      const savedCourse = id ? await api.patch(`courses/${id}/`, payload) : await api.post('courses/', payload)
      setCourse(savedCourse)
      if (!id) navigate(`/expert-dashboard/courses/${savedCourse.id}/edit`, { replace: true, state: { success: 'Course created successfully.' } })
      else setSuccess('Course details saved successfully.')
    } catch (err) {
      setError(err.message || 'Unable to save this course.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteLesson = async (lesson) => {
    if (!window.confirm(`Delete "${lesson.title}"?`)) return
    try {
      await api.delete(`lessons/${lesson.id}/`)
      setLessons((current) => current.filter((item) => item.id !== lesson.id))
      setSuccess('Lesson deleted successfully.')
    } catch (err) {
      setError(err.message || 'Unable to delete this lesson.')
    }
  }

  if (loading || isLoading) return <div className="container course-editor-state"><h2>{isLoading ? 'Loading course...' : 'Checking expert access...'}</h2></div>
  if (!isExpert) return <div className="container course-editor-state"><h2>Expert access required</h2><p>This course editor is available only to administrator-linked experts.</p><Link to="/experts" className="btn btn-primary">Back to Experts</Link></div>

  return (
    <main className="container course-editor-page">
      <header className="course-editor-header"><Link to="/expert-dashboard" className="course-editor-back"><ArrowLeft size={17} /> Course studio</Link><h1>{id ? 'Edit course' : 'Create a course'}</h1></header>
      <section>
        <div className="course-section-heading"><h2>Course details</h2>{course && <span className={`course-status-label ${course.is_visible ? 'published' : 'draft'}`}>{course.is_visible ? <><Eye size={14} /> Published</> : <><EyeOff size={14} /> Draft</>}</span>}</div>
        <form className="course-editor-form" onSubmit={submit}>
          <label>Course title<input name="title" value={form.title} onChange={updateField} required maxLength={200} /></label><label>Description<textarea name="description" value={form.description} onChange={updateField} rows="4" required /></label>
          <div className="course-editor-grid"><label>Level<select name="level" value={form.level} onChange={updateField}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Estimated minutes<input name="estimated_duration_minutes" type="number" min="0" value={form.estimated_duration_minutes} onChange={updateField} /></label></div>
          <label>What students will learn<textarea name="what_you_will_learn" value={form.what_you_will_learn} onChange={updateField} rows="4" /></label><label>Target audience<textarea name="target_audience" value={form.target_audience} onChange={updateField} rows="3" /></label><label>Requirements<textarea name="requirements" value={form.requirements} onChange={updateField} rows="3" /></label>
          <div className="course-editor-options"><label className="course-editor-check"><input name="is_premium" type="checkbox" checked={form.is_premium} onChange={updateField} /> Premium course</label><label className="course-editor-check"><input name="is_visible" type="checkbox" checked={form.is_visible} onChange={updateField} /> Publish course</label></div>
          {error && <p className="expert-feedback error" role="alert">{error}</p>}{success && <p className="expert-feedback success" role="status">{success}</p>}<button className="btn btn-primary" type="submit" disabled={isSaving}><Save size={17} /> {isSaving ? 'Saving course...' : id ? 'Save course details' : 'Create course'}</button>
        </form>
      </section>
      {course && <section className="lesson-editor-section"><div className="course-section-heading"><h2>Lessons <small>{lessons.length}</small></h2><Link className="btn btn-primary btn-compact" to={`/expert-dashboard/courses/${course.id}/lessons/new`}><Plus size={17} /> Add lesson</Link></div>
        {lessons.length > 0 ? <div className="created-lesson-list">{lessons.map((lesson) => <div key={lesson.id}><span className="lesson-list-title"><BookOpen size={17} /><strong>{lesson.order}. {lesson.title}</strong><small>{lesson.duration_minutes ? `${lesson.duration_minutes} min` : 'Self-paced'}</small></span><span className="lesson-row-actions"><Link className="lesson-action" to={`/expert-dashboard/courses/${course.id}/lessons/${lesson.id}/edit`} title="Edit lesson" aria-label={`Edit ${lesson.title}`}><Edit3 size={15} /></Link><button className="lesson-action danger" type="button" title="Delete lesson" aria-label={`Delete ${lesson.title}`} onClick={() => deleteLesson(lesson)}><Trash2 size={15} /></button></span></div>)}</div> : <div className="lesson-list-empty"><BookOpen size={26} /><p>No lessons yet</p><Link className="btn btn-secondary btn-compact" to={`/expert-dashboard/courses/${course.id}/lessons/new`}>Add first lesson</Link></div>}
      </section>}
    </main>
  )
}

export default CreateCourse