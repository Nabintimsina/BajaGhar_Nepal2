import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './CreateCourse.css'

function CreateCourse() {
  const navigate = useNavigate()
  const { expert, isExpert, loading } = useAuth()
  const [form, setForm] = useState({
    title: '',
    description: '',
    level: 'Beginner',
    estimated_duration_minutes: 0,
    what_you_will_learn: '',
    target_audience: '',
    requirements: '',
    is_premium: false,
    is_visible: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const updateField = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      const course = await api.post('courses/', {
        ...form,
        estimated_duration_minutes: Number(form.estimated_duration_minutes) || 0,
      })
      navigate(`/learn/courses/${course.id}`)
    } catch (err) {
      setError(err.message || 'Unable to create this course.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <div className="container course-editor-state"><h2>Checking expert access...</h2></div>
  if (!isExpert) return <div className="container course-editor-state"><h2>Expert access required</h2><p>This course editor is available only to administrator-linked experts.</p><Link to="/experts" className="btn btn-primary">Back to Experts</Link></div>

  return (
    <main className="container course-editor-page">
      <Link to={`/experts/${expert.id}`} className="course-editor-back"><ArrowLeft size={17} /> Back to expert profile</Link>
      <header className="course-editor-header">
        <span className="eyebrow">Expert workspace</span>
        <h1>Create a course</h1>
        <p>Build a learning path for your area of Nepali musical expertise.</p>
      </header>
      <form className="course-editor-form" onSubmit={submit}>
        <label>Course title<input name="title" value={form.title} onChange={updateField} required maxLength={200} /></label>
        <label>Description<textarea name="description" value={form.description} onChange={updateField} rows="4" required /></label>
        <div className="course-editor-grid">
          <label>Level<select name="level" value={form.level} onChange={updateField}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
          <label>Estimated minutes<input name="estimated_duration_minutes" type="number" min="0" value={form.estimated_duration_minutes} onChange={updateField} /></label>
        </div>
        <label>What students will learn<textarea name="what_you_will_learn" value={form.what_you_will_learn} onChange={updateField} rows="4" /></label>
        <label>Target audience<textarea name="target_audience" value={form.target_audience} onChange={updateField} rows="3" /></label>
        <label>Requirements<textarea name="requirements" value={form.requirements} onChange={updateField} rows="3" /></label>
        <div className="course-editor-options"><label className="course-editor-check"><input name="is_premium" type="checkbox" checked={form.is_premium} onChange={updateField} /> Premium course</label><label className="course-editor-check"><input name="is_visible" type="checkbox" checked={form.is_visible} onChange={updateField} /> Publish course</label></div>
        {error && <p className="course-editor-error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={isSaving}><Save size={17} /> {isSaving ? 'Saving course...' : 'Create course'}</button>
      </form>
    </main>
  )
}

export default CreateCourse
