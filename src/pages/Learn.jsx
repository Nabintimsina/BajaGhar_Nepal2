import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Bookmark, BookOpen, Check, LockKeyhole, Play, Search } from 'lucide-react'
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
  const [sessionExpired, setSessionExpired] = useState(false)
  const [progress, setProgress] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())

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

        if (isAuthenticated) {
          const [progressResponse, favoritesResponse] = await Promise.allSettled([
            api.get('auth/progress/'),
            api.get('auth/favorites/'),
          ])
          if ([progressResponse, favoritesResponse].some((result) => result.status === 'rejected' && result.reason?.code === 'AUTH_EXPIRED')) setSessionExpired(true)
          if (progressResponse.status === 'fulfilled') setProgress(Array.isArray(progressResponse.value) ? progressResponse.value : [])
          if (favoritesResponse.status === 'fulfilled') {
            setFavoriteIds(new Set((favoritesResponse.value || []).filter((item) => item.content_type === 'course').map((item) => Number(item.object_id))))
          }
        }
      } catch (err) {
        if (isMounted) {
          setSessionExpired(err.code === 'AUTH_EXPIRED')
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
  }, [activeLanguage, isAuthenticated])

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

  const handleCourseAction = (course, nextLesson = null) => {
    if (!isAuthenticated) {
      const returnTo = `/learn/courses/${course.id}`
      navigate('/login', { state: { returnTo, courseId: course.id } })
      return
    }

    navigate(nextLesson ? `/learn/courses/${course.id}/lessons/${nextLesson.id}` : `/learn/courses/${course.id}`)

    api.post('auth/recently-viewed/', {
      content_type: 'course',
      object_id: Number(course.id),
      title: course.title,
    }).catch(() => {})
  }

  const toggleFavorite = async (course) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: '/learn' } })
      return
    }
    const isFavorite = favoriteIds.has(Number(course.id))
    try {
      if (isFavorite) await api.delete(`auth/favorites/?content_type=course&object_id=${course.id}`)
      else await api.post('auth/favorites/', { content_type: 'course', object_id: Number(course.id), title: course.title })
      setFavoriteIds((current) => {
        const next = new Set(current)
        if (isFavorite) next.delete(Number(course.id))
        else next.add(Number(course.id))
        return next
      })
    } catch (err) {
      if (err.code === 'AUTH_EXPIRED') setSessionExpired(true)
      else setError(err.message || 'Unable to update your favorites.')
    }
  }

  const renderCourseCard = (course) => {
    const courseLessons = lessons.filter((lesson) => Number(lesson.course) === Number(course.id))
    const isPremium = Boolean(course.is_premium)
    const completedLessons = new Set(progress.filter((item) => Number(item.course) === Number(course.id) && item.is_completed).map((item) => item.lesson_title))
    const completedCount = courseLessons.filter((lesson) => completedLessons.has(lesson.title)).length
    const percentage = courseLessons.length ? Math.round((completedCount / courseLessons.length) * 100) : 0
    const nextLesson = courseLessons.find((lesson) => !completedLessons.has(lesson.title))
    const isStarted = progress.some((item) => Number(item.course) === Number(course.id))
    const isFavorite = favoriteIds.has(Number(course.id))

    return (
      <div key={course.id} className="course-card">
        <div className="course-card-header">
          <div>
            <span className="eyebrow">Course</span>
            <h3>{course.title}</h3>
          </div>
          <div className="course-card-badges">{isPremium && <span className="premium-tag"><LockKeyhole size={13} /> Premium</span>}<button type="button" className={`favorite-course-button ${isFavorite ? 'active' : ''}`} onClick={() => toggleFavorite(course)} aria-label={isFavorite ? `Remove ${course.title} from favorites` : `Add ${course.title} to favorites`} title={isFavorite ? 'Remove favorite' : 'Add favorite'}>{isFavorite ? <Check size={16} /> : <Bookmark size={16} />}</button></div>
        </div>

        <p>{course.description || 'Explore this guided learning path in Nepal’s musical heritage.'}</p>

        <div className="course-meta-row">
          <span><BookOpen size={14} /> {courseLessons.length ? `${courseLessons.length} Lessons` : 'No lessons yet'}</span>
          <span>{isPremium ? 'Premium' : 'Free'}</span>
        </div>

        {isAuthenticated && isStarted && courseLessons.length > 0 && <div className="course-progress-summary"><div><span>Progress</span><strong>{percentage}%</strong></div><div className="course-progress-bar"><span style={{ width: `${percentage}%` }} /></div><small>{nextLesson ? `Continue from ${nextLesson.title}` : 'Course completed'}</small></div>}

        <div className="course-card-actions">
          <button type="button" className="btn btn-primary btn-small" onClick={() => handleCourseAction(course, isStarted ? nextLesson : null)} disabled={!courseLessons.length}>
            <Play size={15} /> {courseLessons.length ? isStarted && isAuthenticated ? 'Continue learning' : 'Start learning' : 'Coming soon'}
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
          ) : sessionExpired ? (
            <div className="content-article session-expired-message"><h2>Your session expired</h2><p>Please log in again to see progress and manage favorites.</p><button className="btn btn-primary" type="button" onClick={() => navigate('/login', { state: { returnTo: '/learn' } })}>Log in again</button></div>
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
