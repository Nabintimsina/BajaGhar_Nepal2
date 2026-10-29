import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Award } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import './ExpertDetail.css'

function ExpertDetail() {
  const { t, i18n } = useTranslation()
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ne') ? 'ne' : 'en'
  const { id } = useParams()
  const [expert, setExpert] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    let isMounted = true

    const loadExpert = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await api.get(`experts/${id}/`, { lang: activeLanguage })
        if (isMounted) {
          setExpert(response)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
          setExpert(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadExpert()

    return () => {
      isMounted = false
    }
  }, [id, activeLanguage])

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>{t('expertDetail.loading')}</h2>
      </div>
    )
  }

  if (error || !expert) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>{t('expertDetail.notFound')}</h2>
        {error && <p>{error}</p>}
        <Link to="/experts" className="btn btn-primary">
          {t('expertDetail.backToExperts')}
        </Link>
      </div>
    )
  }

  const expertInstruments = expert.instruments || []
  const achievementsList = (activeLanguage === 'ne' && expert.achievements_ne && expert.achievements_ne.length)
    ? expert.achievements_ne
    : expert.achievements || []

  return (
    <div className="expert-detail-page">
      {/* Back Button */}
      <div className="container">
        <Link to="/experts" className="back-link">
          <ArrowLeft size={20} />
          {t('expertDetail.backToExperts')}
        </Link>
      </div>

      {/* Expert Profile Header */}
      <div className="expert-profile-header">
        <div className="container">
          <div className="profile-content">
            <div className="profile-photo-large">
              {expert.photo ? (
                <img src={expert.photo} alt={expert.name} />
              ) : (
                <div className="placeholder-avatar">
                  {expert.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h1>{expert.name}</h1>
              <p className="expert-expertise-large">{expert.expertise}</p>
              <a href={`mailto:${expert.contact_email}`} className="contact-button">
                <Mail size={18} />
                {t('expertDetail.contact')}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Biography Section */}
      <section className="section bio-section">
        <div className="container">
          <h2>{t('expertDetail.biography')}</h2>
          <div className="bio-content">
            <p className="bio-quote">"{expert.bio}"</p>
            <p className="bio-detailed">{expert.detailed_bio}</p>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="section achievements-section bg-secondary">
        <div className="container">
          <h2 className="section-title">
            <Award size={28} />
            {t('expertDetail.achievements')}
          </h2>
          <ul className="achievements-list">
            {achievementsList.map((achievement, index) => (
              <li key={index} className="achievement-item">
                <Award size={20} className="achievement-icon" />
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Teaching Sample removed */}

      {/* Specialized Instruments removed */}
    </div>
  )
}

export default ExpertDetail
