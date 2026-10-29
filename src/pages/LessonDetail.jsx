import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, LockKeyhole } from 'lucide-react'
import VideoTutorial from '../components/VideoTutorial'
import Viewer3D from '../components/Viewer3D'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './LessonDetail.css'

function LessonDetail() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading, subscription } = useAuth()
  const [course, setCourse] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [lessons, setLessons] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [progressError, setProgressError] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [lessonId])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { returnTo: `/learn/courses/${courseId}/lessons/${lessonId}` } })
    }
  }, [courseId, isAuthenticated, lessonId, loading, navigate])

  useEffect(() => {
    if (loading || !isAuthenticated) return undefined
    let isMounted = true

    const loadLesson = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [courseData, lessonData, lessonList] = await Promise.all([
          api.get(`courses/${courseId}/`),
          api.get(`lessons/${lessonId}/`),
          api.get('lessons/', { course: courseId })
        ])
        const courseLessons = Array.isArray(lessonList) ? lessonList : lessonList?.results || []
        let progressData = []
        try {
          const savedProgress = await api.get('auth/progress/')
          progressData = Array.isArray(savedProgress) ? savedProgress : []
        } catch {
          progressData = []
        }
        const lessonProgress = progressData.find((item) => (
          Number(item.course) === Number(courseId)
          && item.lesson_title === lessonData.title
        ))
        if (!lessonProgress) {
          api.post('auth/progress/', {
            course: courseId,
            lesson_title: lessonData.title,
            completion_percentage: 0,
            is_completed: false,
          }).catch(() => {})
        }

        if (isMounted) {
          setCourse(courseData)
          setLesson(lessonData)
          setLessons(courseLessons)
          setIsCompleted(Boolean(lessonProgress?.is_completed))
        }
      } catch (err) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadLesson()
    return () => { isMounted = false }
  }, [courseId, isAuthenticated, lessonId, loading])

  const lessonIndex = lessons.findIndex((item) => Number(item.id) === Number(lessonId))
  const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null
  const nextLesson = lessonIndex >= 0 ? lessons[lessonIndex + 1] : null
  const instructorProfiles = {}

  if (loading) return <div className="container lesson-state"><h2>Checking your account...</h2></div>
  if (!isAuthenticated) return null
  if (isLoading) return <div className="container lesson-state"><h2>Loading lesson...</h2></div>
  if (error || !course || !lesson) return <div className="container lesson-state"><h2>Lesson unavailable</h2><p>{error}</p><Link to={`/learn/courses/${courseId}`} className="btn btn-primary">Back to course</Link></div>

  const lessonVideo = lesson.attachment_type === 'video' && lesson.attachment_video
    ? lesson.attachment_video
    : lesson.video_url
  const matchingTutorial = lessonVideo
    ? [{ id: lesson.id, title: lesson.title, description: lesson.description, video_url: lessonVideo }]
      : []
  const isPremium = Boolean((course.is_premium || lesson.is_premium) && !subscription?.is_premium)
  const lessonPhoto = lesson.attachment_type === 'photo' && lesson.attachment_photo
    ? lesson.attachment_photo
    : lesson.photo
  const lessonModel = lesson.attachment_type === '3d_model' ? lesson.attachment_3d_model : null
  const attachments = lesson.attachments || []

  const handleCompleteLesson = async () => {
    if (isCompleting) return

    setIsCompleting(true)
    setProgressError('')
    const nextCompletedState = !isCompleted
    try {
      await api.post('auth/progress/', {
        course: courseId,
        lesson_title: lesson.title,
        completion_percentage: nextCompletedState ? 100 : 0,
        is_completed: nextCompletedState,
      })
      setIsCompleted(nextCompletedState)
    } catch (err) {
      setProgressError(err.message || 'Unable to save your progress.')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="lesson-detail-page">
      <section className="lesson-course-bar">
        <div className="container lesson-course-bar-inner">
          <div>
            <Link to={`/learn/courses/${courseId}`}><ArrowLeft size={17} /> {course.title}</Link>
            <p>{course.description}</p>
          </div>
          <span>{course.instrument_name || 'BajaGhar course'} · {lessons.length} lessons</span>
        </div>
      </section>
      <main className="container lesson-main">
        <div className="lesson-main-grid">
          <article className="lesson-content-panel">
            <div className="lesson-kicker"><span>Lesson {String(lessonIndex + 1).padStart(2, '0')}</span><span><Clock3 size={14} /> {lesson.duration_minutes || 'Self-paced'}{lesson.duration_minutes ? ' min' : ''}</span></div>
            <h1>{lesson.title}</h1>
            <p className="lesson-description">{lesson.description}</p>
            {lessonPhoto && <img className="lesson-photo" src={lessonPhoto} alt={lesson.title} />}
            {lessonModel && <div className="lesson-attachment-model"><Viewer3D modelSrc={lessonModel} title={lesson.title} /></div>}
            {attachments.length > 0 && <div className="lesson-attachments">
              {attachments.map((attachment) => {
                if (attachment.attachment_type === 'photo' && attachment.photo) {
                  return <img className="lesson-photo" src={attachment.photo} alt={lesson.title} key={attachment.id} />
                }
                if (attachment.attachment_type === '3d_model' && attachment.model_3d) {
                  return <div className="lesson-attachment-model" key={attachment.id}><Viewer3D modelSrc={attachment.model_3d} title={lesson.title} /></div>
                }
                if (attachment.attachment_type === 'video' && attachment.video_url) {
                  return <div className="lesson-attachment-video" key={attachment.id}><VideoTutorial tutorials={[{ id: attachment.id, title: lesson.title, description: lesson.description, video_url: attachment.video_url }]} instructorProfiles={instructorProfiles} compact videoOnly /></div>
                }
                return null
              })}
            </div>}
            {isPremium ? (
              <div className="lesson-locked"><LockKeyhole size={22} /><h2>Premium lesson</h2><p>This lesson is available to Premium members.</p><Link to="/contact" state={{ subject: `Premium access: ${course.title}` }} className="btn btn-secondary">Contact us to subscribe</Link></div>
            ) : matchingTutorial.length > 0 ? <VideoTutorial tutorials={matchingTutorial} instructorProfiles={instructorProfiles} compact videoOnly /> : null}
            {!isPremium && <div className="lesson-completion">
              <button type="button" className="btn btn-primary lesson-completion-button" onClick={handleCompleteLesson} disabled={isCompleting} aria-busy={isCompleting}>
                <CheckCircle2 size={17} />
                <span className="lesson-completion-labels" aria-live="polite">
                  <span className={isCompleted ? 'visible' : ''}>Mark lesson incomplete</span>
                  <span className={!isCompleted ? 'visible' : ''}>Mark lesson complete</span>
                </span>
              </button>
              {progressError && <p role="alert">{progressError}</p>}
            </div>}
          </article>
          <aside className="lesson-side-panel">
            <span className="eyebrow">Course progress</span>
            <h2>{course.title}</h2>
            <p>{lessonIndex + 1} of {lessons.length} lessons</p>
            <div className="lesson-progress-track"><span style={{ width: `${lessons.length ? ((lessonIndex + 1) / lessons.length) * 100 : 0}%` }} /></div>
            <Link to={`/learn/courses/${courseId}`} className="btn btn-primary">Course contents</Link>
          </aside>
        </div>
        <nav className="lesson-navigation" aria-label="Lesson navigation">
          {previousLesson ? <button type="button" onClick={() => navigate(`/learn/courses/${courseId}/lessons/${previousLesson.id}`)}><ArrowLeft size={16} /> Previous lesson</button> : <span />}
          <Link to={`/learn/courses/${courseId}`}>All lessons</Link>
          {nextLesson && <button type="button" onClick={() => navigate(`/learn/courses/${courseId}/lessons/${nextLesson.id}`)}>Next lesson <ArrowRight size={16} /></button>}
        </nav>
      </main>
    </div>
  )
}

export default LessonDetail
