import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BookOpen, LockKeyhole, Play, Search } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Learn.css'

function Learn() {
  const { t, i18n } = useTranslation()
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ne') ? 'ne' : 'en'
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('featured')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadLearningData = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [courseResponse, lessonResponse] = await Promise.all([
          api.get('courses/', { lang: activeLanguage }),
          api.get('lessons/', { lang: activeLanguage })
        ])

        const courseList = Array.isArray(courseResponse) ? courseResponse : courseResponse?.results || []
        const lessonList = Array.isArray(lessonResponse) ? lessonResponse : lessonResponse?.results || []

        if (!isMounted) return

        setCourses(courseList)
        setLessons(lessonList)
      } catch (err) {
        if (isMounted) {
          setError(err.message)
          setCourses([])
          setLessons([])
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadLearningData()

    return () => {
      isMounted = false
    }
  }, [activeLanguage])

  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses

    const normalized = searchTerm.toLowerCase()
    return courses.filter((course) => {
      const title = (course.title || '').toLowerCase()
      const description = (course.description || '').toLowerCase()
      return title.includes(normalized) || description.includes(normalized)
    })
  }, [courses, searchTerm])

  const freeCourses = filteredCourses.filter((course) => !course.is_premium)
  const premiumCourses = filteredCourses.filter((course) => course.is_premium)

  const visibleCourses = useMemo(() => {
    if (activeFilter === 'free') return freeCourses
    if (activeFilter === 'premium') return premiumCourses
    return filteredCourses
  }, [activeFilter, filteredCourses, freeCourses, premiumCourses])

  const handleCourseAction = (course) => {
    if (!isAuthenticated) {
      const returnTo = `/learn/courses/${course.id}`
      navigate('/login', { state: { returnTo, courseId: course.id } })
      return
    }

    navigate(`/learn/courses/${course.id}`)

    api.post('auth/recently-viewed/', {
      content_type: 'course',
      object_id: Number(course.id),
      title: course.title,
    }).catch(() => {})
  }

  const renderCourseCard = (course) => {
    const courseLessons = lessons.filter((lesson) => Number(lesson.course) === Number(course.id))
    const isPremium = Boolean(course.is_premium)

    return (
      <div key={course.id} className="course-card">
        <div className="course-card-header">
          <div>
            <span className="eyebrow">Course</span>
            <h3>{course.title}</h3>
          </div>
          {isPremium && <span className="premium-tag"><LockKeyhole size={13} /> Premium</span>}
        </div>

        <p>{course.description || 'Explore this guided learning path in Nepal’s musical heritage.'}</p>

        <div className="course-meta-row">
          <span><BookOpen size={14} /> {courseLessons.length} Lessons</span>
          <span>{isPremium ? 'Premium' : 'Free'}</span>
          <span>{course.instrument_name || course.slug || 'Beginner'}</span>
        </div>

        <div className="course-card-actions">
          <button type="button" className="btn btn-primary btn-small" onClick={() => handleCourseAction(course)}>
            <Play size={15} /> Start Learning
          </button>
          {!isAuthenticated && isPremium && (
            <button type="button" className="btn btn-secondary btn-small" onClick={() => navigate('/login')}>
              Unlock Premium
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="learn-page">
      <div className="page-header">
        <div className="container">
          <h1>{t('learn.pageTitle')}</h1>
          <p>{t('learn.subtitle')}</p>
        </div>
      </div>

      <div className="learn-content container">
        <aside className="learn-sidebar">
          <div className="search-panel">
            <label htmlFor="course-search">Find your next lesson</label>
            <div className="search-input-wrap">
              <Search size={17} aria-hidden="true" />
            <input
              id="course-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by course"
            />
            </div>
          </div>

          <div className="quick-links">
            <p className="filter-heading">Course library</p>
            <button type="button" className={`quick-link ${activeFilter === 'featured' ? 'active' : ''}`} onClick={() => setActiveFilter('featured')}>
              <span>All courses</span><strong>{filteredCourses.length}</strong>
            </button>
            <button type="button" className={`quick-link ${activeFilter === 'free' ? 'active' : ''}`} onClick={() => setActiveFilter('free')}>
              <span>Free courses</span><strong>{freeCourses.length}</strong>
            </button>
            <button type="button" className={`quick-link ${activeFilter === 'premium' ? 'active' : ''}`} onClick={() => setActiveFilter('premium')}>
              <span>Premium courses</span><strong>{premiumCourses.length}</strong>
            </button>
          </div>
        </aside>

        <main className="learn-main">
          {isLoading ? (
            <div className="content-article">
              <h2>Loading learning journeys...</h2>
            </div>
          ) : error ? (
            <div className="content-article">
              <h2>Unable to load courses</h2>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <section className="content-article">
                <div className="section-heading section-heading-tight">
                  <div>
                    <span className="eyebrow">Course library</span>
                    <h2>{activeFilter === 'free' ? 'Free courses' : activeFilter === 'premium' ? 'Premium courses' : 'Start learning with the music of Nepal'}</h2>
                  </div>
                  {/* <span className="course-count">{visibleCourses.length} {visibleCourses.length === 1 ? 'course' : 'courses'}</span> */}
                </div>
                <div className="course-grid">
                  {visibleCourses.length > 0 ? visibleCourses.map(renderCourseCard) : <p className="empty-state">No courses match this view yet.</p>}
                </div>
              </section>

            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default Learn
