import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import './Home.css'

function Home() {
  const { t, i18n } = useTranslation()
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ne') ? 'ne' : 'en'
  const [featuredCourses, setFeaturedCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [courseError, setCourseError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadFeatured = async () => {
      setIsLoading(true)
      setCourseError('')

      try {
        const courseResponse = await api.get('courses/', { lang: activeLanguage })
        const courses = Array.isArray(courseResponse) ? courseResponse : courseResponse?.results || []
        const items = courses.filter((course) => course.is_featured && course.is_visible)

        if (isMounted) {
          setFeaturedCourses(items.slice(0, 4))
        }
      } catch (error) {
        if (isMounted) {
          setFeaturedCourses([])
          setCourseError(error.message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadFeatured()

    return () => {
      isMounted = false
    }
  }, [activeLanguage, t])

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-overlay" />
        <div className="hero-content container">
          <div className="hero-copy">
            <h1 className="hero-title">{t('home.title')}</h1>
            <p className="hero-subtitle">{t('home.subtitle')}</p>
            <div className="hero-buttons">
              <Link to="/learn" className="btn btn-primary btn-large">
                Learn instruments
                <ArrowRight size={18} />
              </Link>
              <a href="#about-bajaghar" className="btn btn-outline btn-large">
                Learn more
              </a>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-art-ring" />
            <span className="hero-art-note note-top">♪</span>
            <img src="/images/sarangi.png" alt="" />
            <span className="hero-art-note note-bottom">♫</span>
          </div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-heading">
            <h2>{t('home.featured')}</h2>
          </div>

          {isLoading ? (
            <div className="text-center">
              <p>{t('common.loading')}</p>
            </div>
          ) : courseError ? (
            <div className="text-center">
              <p>{t('common.error')}: {courseError}</p>
            </div>
          ) : featuredCourses.length === 0 ? (
            <div className="text-center">
              <p>No featured courses have been published yet.</p>
            </div>
          ) : (
            <div className="featured-grid">
              {featuredCourses.map((course) => (
                <article className="course-card" key={course.id}>
                  {course.photo && <img src={course.photo} alt={course.title} />}
                  <div className="course-card-content">
                    <span className="eyebrow">Course</span>
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <Link to={`/learn/courses/${course.id}`} className="btn btn-primary btn-small">Start course</Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="text-center mt-4">
            <Link to="/learn" className="btn btn-secondary">
              Learn instruments
            </Link>
          </div>
        </div>
      </section>

      <section id="about-bajaghar" className="section about-section">
        <div className="container about-grid">
          <div className="about-copy">
            <p className="section-label">About BajaGhar</p>
            <h2>Preserving Nepal’s instruments, one story at a time.</h2>
            <p>
              BajaGhar is a digital museum and learning space for Nepali musical traditions. We bring heritage instruments,
              oral histories, and living expertise together so more people can discover, understand, and continue the music of Nepal.
            </p>
            <Link to="/learn" className="btn btn-primary">
              Start learning
            </Link>
          </div>

          <div className="about-panel">
            <div className="about-art" aria-hidden="true">
              <img src="/images/sarangi.png" alt="" />
            </div>
            <div className="stat-row">
              <div className="stat-box">
                <strong>15+</strong>
                <span>heritage instruments</span>
              </div>
              <div className="stat-box">
                <strong>4</strong>
                <span>featured learning paths</span>
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-box">
                <strong>Local</strong>
                <span>voices and traditions</span>
              </div>
              <div className="stat-box">
                <strong>Open</strong>
                <span>public discovery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Home
