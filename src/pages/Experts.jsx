import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ExpertCard from '../components/ExpertCard'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Experts.css'

function Experts() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ne') ? 'ne' : 'en'
  const { isExpert } = useAuth()
  const [experts, setExperts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleApplyExpert = () => {
    navigate('/contact?subject=Expert%20Application')
  }

  useEffect(() => {
    let isMounted = true

    const loadExperts = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await api.get('experts/', { lang: activeLanguage })
        const items = Array.isArray(response) ? response : response?.results || []
        if (isMounted) {
          setExperts(items)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
          setExperts([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadExperts()

    return () => {
      isMounted = false
    }
  }, [activeLanguage])

  return (
    <div className="experts-page">
      <div className="page-header">
        <div className="container">
          <h1>{t('experts.pageTitle')}</h1>
          <p>{t('experts.subtitle')}</p>
        </div>
      </div>

      <section className="section experts-section">
        <div className="container">
          <div className="experts-intro">
            <p>{t('experts.intro')}</p>
          </div>

          {isLoading ? (
            <div className="no-results">
              <p>{t('experts.loading')}</p>
            </div>
          ) : error ? (
            <div className="no-results">
              <p>{t('experts.loadError')} {error}</p>
            </div>
          ) : (
            <div className="grid grid-3 experts-grid">
              {experts.map(expert => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Become an Expert Section */}
      <section className="section become-expert-section bg-secondary">
        <div className="container">
          <div className="become-expert-content">
            <h2>{t('experts.shareExpertise')}</h2>
            <p>{t('experts.shareExpertiseDesc')}</p>
            <div className="expert-benefits">
              <div className="benefit">
                <h4>{t('experts.shareKnowledge')}</h4>
                <p>{t('experts.shareKnowledgeDesc')}</p>
              </div>
              <div className="benefit">
                <h4>{t('experts.reachStudents')}</h4>
                <p>{t('experts.reachStudentsDesc')}</p>
              </div>
              <div className="benefit">
                <h4>{t('experts.preserveTraditions')}</h4>
                <p>{t('experts.preserveTraditionsDesc')}</p>
              </div>
            </div>
            <div className="expert-actions">
              <button className="btn btn-primary btn-large" onClick={handleApplyExpert}>
                {t('experts.joinUs')}
              </button>
              {isExpert ? (
                <button className="btn btn-secondary btn-large" type="button" onClick={() => navigate('/expert-dashboard')}>Logged in as expert</button>
              ) : (
                <button className="btn btn-secondary btn-large" type="button" onClick={() => navigate('/login', { state: { returnTo: '/experts' } })}>Login as expert</button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Experts
