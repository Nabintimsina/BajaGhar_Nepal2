import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, LockKeyhole, Play, UserRound } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './CourseDetail.css'

function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, subscription } = useAuth()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [relatedCourses, setRelatedCourses] = useState([])
  const [progress, setProgress] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    let isMounted = true

    const loadCourse = async () => {
      setIsLoading(true)
      setError('')

      try {
        const courseData = await api.get(`courses/${id}/`)
        const lessonData = await api.get('lessons/', { course: id })
        const courseList = await api.get('courses/')
        const courseLessons = Array.isArray(lessonData) ? lessonData : lessonData?.results || []
        const allCourses = Array.isArray(courseList) ? courseList : courseList?.results || []

        let progressData = []
        if (isAuthenticated) {
          try {
            progressData = await api.get('auth/progress/')
          } catch {
            progressData = []
          }
        }

        if (isMounted) {
          setCourse(courseData)
          setLessons(courseLessons)
          setRelatedCourses(allCourses.filter((item) => Number(item.id) !== Number(id)).slice(0, 3))
          setProgress(Array.isArray(progressData) ? progressData : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
          setCourse(null)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadCourse()

    return () => {
      isMounted = false
    }
  }, [id, isAuthenticated])

  const completedLessonTitles = useMemo(() => new Set(
    progress
      .filter((item) => Number(item.course) === Number(id) && item.is_completed)
      .map((item) => item.lesson_title)
  ), [id, progress])

  const completedCount = lessons.filter((lesson) => completedLessonTitles.has(lesson.title)).length
  const progressPercentage = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0
  const hasPremiumAccess = Boolean(subscription?.is_premium)
  const totalDuration = lessons.reduce((total, lesson) => total + (Number(lesson.duration_minutes) || 0), 0)
  const firstAvailableLesson = lessons.find((lesson) => (!course?.is_premium && !lesson.is_premium) || hasPremiumAccess)

  const isLessonLocked = (lesson) => Boolean((course?.is_premium || lesson.is_premium) && !hasPremiumAccess)

  const handleStartLearning = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: `/learn/courses/${id}` } })
      return
    }

    if (firstAvailableLesson) {
      navigate(`/learn/courses/${id}/lessons/${firstAvailableLesson.id}`)
    }
  }

  const toggleLesson = (lesson) => {
    if (isLessonLocked(lesson)) {
      navigate('/contact', { state: { subject: `Premium access: ${course?.title || 'Course'}` } })
      return
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: `/learn/courses/${id}` } })
      return
    }

    navigate(`/learn/courses/${id}/lessons/${lesson.id}`)
  }

  if (isLoading) {
    return <div className="container course-state"><h2>Loading course...</h2></div>
  }

  if (error || !course) {
    return (
      <div className="container course-state">
        <h2>Course unavailable</h2>
        <p>{error || 'This course is not currently published.'}</p>
        <Link to="/learn" className="btn btn-primary">Back to Learn</Link>
      </div>
    )
  }

  const instructor = course?.reference_expert
  const courseStatus = course.is_premium ? 'Premium course' : 'Free course'

  return (
    <div className="course-detail-page">
      <section className="course-hero">
        <div className="container">
          <Link to="/learn" className="course-back-link"><ArrowLeft size={18} /> Back to Learn</Link>
          <div className="course-hero-grid">
            <div className="course-hero-copy">
              <span className="eyebrow">BajaGhar course</span>
              <h1>{course.title}</h1>
              <p>{course.description || 'A guided course in Nepali musical heritage.'}</p>
              <div className="course-facts">
                <span><BookOpen size={16} /> {course.level || 'Beginner'}</span>
                <span><BookOpen size={16} /> {lessons.length} lessons</span>
                <span><Clock3 size={16} /> {course.estimated_duration_minutes || totalDuration || 'Self-paced'}{course.estimated_duration_minutes || totalDuration ? ' min' : ''}</span>
                <span className={course.is_premium ? 'fact-premium' : 'fact-free'}>{courseStatus}</span>
              </div>
              <div className="course-hero-actions">
                {course.is_premium && !hasPremiumAccess ? (
                  <Link to="/contact" state={{ subject: `Premium access: ${course.title}` }} className="btn btn-secondary btn-large">
                    Contact us to subscribe
                  </Link>
                ) : <button type="button" className="btn btn-secondary btn-large" onClick={handleStartLearning}>
                  <Play size={17} /> {completedCount > 0 ? 'Continue Learning' : 'Start Learning'}
                </button>}
                {!isAuthenticated && <span className="login-note">Log in to save your progress</span>}
              </div>
            </div>
            <div className="course-progress-card">
              <div className="progress-card-top">
                <span>Your progress</span>
                <strong>{progressPercentage}%</strong>
              </div>
              <div className="progress-track" aria-label={`${progressPercentage}% complete`}>
                <span style={{ width: `${progressPercentage}%` }} />
              </div>
              <p>{completedCount}/{lessons.length} lessons completed</p>
              {course.photo && <img src={course.photo} alt={course.title} />}
            </div>
          </div>
        </div>
      </section>

      <main className="container course-main">
        <div className="course-main-grid">
          <div className="course-primary-column">
            <section className="course-panel overview-panel">
              <div className="panel-heading"><span className="eyebrow">Course overview</span></div>
              <div className="overview-grid">
                <div><h3>What you will learn</h3><p>{course.what_you_will_learn || 'Understand the instrument, its cultural place, and the practical foundations needed to begin playing with confidence.'}</p></div>
                <div><h3>Who this is for</h3><p>{course.target_audience || 'Curious beginners, culture learners, and new musicians who want a welcoming first path into Nepali music.'}</p></div>
                <div><h3>Requirements</h3><p>{course.requirements || 'No previous experience is required.'}</p></div>
              </div>
            </section>

            <section className="course-panel content-panel">
              <div className="panel-heading content-heading">
                <div><span className="eyebrow">Course content</span><h2>Lessons in this course</h2></div>
                <span className="lesson-total">{lessons.length} lessons</span>
              </div>
              <div className="lesson-accordion">
                {lessons.length > 0 ? lessons.map((lesson, index) => {
                  const locked = isLessonLocked(lesson)
                  const completed = completedLessonTitles.has(lesson.title)
                  return (
                    <article className={`course-lesson ${locked ? 'locked' : ''}`} id={`lesson-${lesson.id}`} key={lesson.id}>
                      <button type="button" className="lesson-toggle" onClick={() => toggleLesson(lesson)}>
                        <span className="lesson-index">{String(index + 1).padStart(2, '0')}</span>
                        <span className="lesson-copy"><strong>{lesson.title}</strong>{lesson.description && <small>{lesson.description}</small>}</span>
                        <span className="lesson-status">
                          {lesson.duration_minutes > 0 && <span><Clock3 size={14} /> {lesson.duration_minutes} min</span>}
                          {locked ? <LockKeyhole size={17} /> : completed ? <CheckCircle2 size={18} /> : <span className="lesson-open-label">{isAuthenticated ? 'Open' : 'Log in to start'}</span>}
                        </span>
                      </button>
                      {locked && <div className="locked-message"><LockKeyhole size={15} /> Premium lesson. <Link to="/contact" state={{ subject: `Premium access: ${course.title}` }}>Contact us to subscribe.</Link></div>}
                    </article>
                  )
                }) : <p className="empty-course-state">Lessons will appear here as they are published from Django.</p>}
              </div>
            </section>
          </div>

          <aside className="course-sidebar">
            {instructor && (
              <section className="course-panel instructor-panel">
                <span className="eyebrow">Your instructor</span>
                <div className="instructor-profile">
                  <div className="instructor-image">{instructor.photo ? <img src={instructor.photo} alt={instructor.name} /> : <UserRound size={28} />}</div>
                  <div><h3>{instructor.name}</h3><p>{instructor.expertise}</p></div>
                </div>
                <p className="instructor-intro">Learn from an experienced voice connected to the living traditions behind this instrument.</p>
                <Link to={`/experts/${instructor.id}`} className="btn btn-secondary btn-small">View Expert</Link>
              </section>
            )}

            <section className="course-panel related-panel">
              <span className="eyebrow">Keep learning</span>
              <h2>Related courses</h2>
              <div className="related-course-list">
                {relatedCourses.map((related) => <Link to={`/learn/courses/${related.id}`} key={related.id}><span>{related.title}</span><ArrowLeft size={15} /></Link>)}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default CourseDetail
