import { useEffect, useState } from 'react'
import { ArrowLeft, Box, FileImage, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './CreateCourse.css'

const blankLesson = { title: '', description: '', video_url: '', duration_minutes: 0, order: 1, is_premium: false }

function LessonEditor() {
  const navigate = useNavigate()
  const { courseId, lessonId } = useParams()
  const { isExpert, loading } = useAuth()
  const [course, setCourse] = useState(null)
  const [form, setForm] = useState(blankLesson)
  const [photo, setPhoto] = useState(null)
  const [model3d, setModel3d] = useState(null)
  const [existingMedia, setExistingMedia] = useState({ photo: '', model3d: '' })
  const [removePhoto, setRemovePhoto] = useState(false)
  const [removeModel3d, setRemoveModel3d] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!isExpert) return
    const load = async () => {
      try {
        const ownedCourse = await api.get(`courses/${courseId}/`, { mine: '1' })
        setCourse(ownedCourse)
        if (lessonId) {
          const lesson = await api.get(`lessons/${lessonId}/`)
          setForm({ title: lesson.title || '', description: lesson.description || '', video_url: lesson.video_url || '', duration_minutes: lesson.duration_minutes || 0, order: lesson.order || 1, is_premium: Boolean(lesson.is_premium) })
          setExistingMedia({ photo: lesson.photo || '', model3d: lesson.attachment_3d_model || '' })
        }
      } catch (err) {
        setError(err.message || 'Unable to load this lesson.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [courseId, lessonId, isExpert])

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
      const payload = new FormData()
      Object.entries({ ...form, course: courseId, duration_minutes: Number(form.duration_minutes) || 0, order: Number(form.order) || 1 }).forEach(([key, value]) => payload.append(key, value))
      payload.append('remove_photo', String(removePhoto && !photo))
      payload.append('remove_attachment_3d_model', String(removeModel3d && !model3d))
      if (photo) payload.append('photo', photo)
      if (model3d) payload.append('attachment_3d_model', model3d)
      if (lessonId) await api.patch(`lessons/${lessonId}/`, payload)
      else await api.post('lessons/', payload)
      setSuccess(lessonId ? 'Lesson updated successfully.' : 'Lesson created successfully.')
      window.setTimeout(() => navigate(`/expert-dashboard/courses/${courseId}/edit`, { state: { success: lessonId ? 'Lesson updated successfully.' : 'Lesson created successfully.' } }), 650)
    } catch (err) {
      setError(err.message || 'Unable to save this lesson.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || isLoading) return <div className="container course-editor-state"><h2>Loading lesson...</h2></div>
  if (!isExpert || !course) return <div className="container course-editor-state"><h2>Lesson unavailable</h2><p>{error || 'This lesson is not part of one of your courses.'}</p><Link to="/expert-dashboard" className="btn btn-primary">Back to course studio</Link></div>

  return <main className="container course-editor-page"><header className="course-editor-header"><Link to={`/expert-dashboard/courses/${courseId}/edit`} className="course-editor-back"><ArrowLeft size={17} /> Back to {course.title}</Link><h1>{lessonId ? 'Edit lesson' : 'Add lesson'}</h1><p>Write the lesson learners will follow in <strong>{course.title}</strong>.</p></header><form className="course-editor-form" onSubmit={submit}><label>Lesson title<input name="title" value={form.title} onChange={updateField} required maxLength={220} /></label><label>Lesson description<textarea name="description" value={form.description} onChange={updateField} rows="10" /></label><label>YouTube or video URL<input name="video_url" type="url" value={form.video_url} onChange={updateField} placeholder="https://..." /></label><div className="course-editor-grid"><label>Order<input name="order" type="number" min="1" value={form.order} onChange={updateField} /></label><label>Duration in minutes<input name="duration_minutes" type="number" min="0" value={form.duration_minutes} onChange={updateField} /></label></div><div className="lesson-media-grid"><label className="media-upload"><span><FileImage size={17} /> Lesson photo</span><input type="file" accept="image/*" onChange={(event) => { setPhoto(event.target.files?.[0] || null); setRemovePhoto(false) }} />{photo ? <small>{photo.name}</small> : existingMedia.photo && !removePhoto ? <><a href={existingMedia.photo} target="_blank" rel="noreferrer">View current photo</a><button type="button" className="media-remove" onClick={() => setRemovePhoto(true)}>Remove photo</button></> : <small>No photo selected</small>}</label><label className="media-upload"><span><Box size={17} /> 3D model</span><input type="file" accept=".glb,.gltf,.bin,model/gltf-binary,model/gltf+json" onChange={(event) => { setModel3d(event.target.files?.[0] || null); setRemoveModel3d(false) }} />{model3d ? <small>{model3d.name}</small> : existingMedia.model3d && !removeModel3d ? <><a href={existingMedia.model3d} target="_blank" rel="noreferrer">View current 3D model</a><button type="button" className="media-remove" onClick={() => setRemoveModel3d(true)}>Remove 3D model</button></> : <small>No model selected</small>}</label></div><label className="course-editor-check"><input name="is_premium" type="checkbox" checked={form.is_premium} onChange={updateField} /> Premium lesson</label>{error && <p className="expert-feedback error" role="alert">{error}</p>}{success && <p className="expert-feedback success" role="status">{success}</p>}<div className="course-editor-actions"><button className="btn btn-primary" type="submit" disabled={isSaving}><Save size={17} /> {isSaving ? 'Saving lesson...' : lessonId ? 'Save lesson' : 'Add lesson'}</button><Link className="btn btn-secondary" to={`/expert-dashboard/courses/${courseId}/edit`}>Cancel</Link></div></form></main>
}

export default LessonEditor