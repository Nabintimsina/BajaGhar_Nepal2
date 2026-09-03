import { Link } from 'react-router-dom'
import { ArrowLeft, Home, Music4, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './ErrorPage.css'

function ErrorPage() {
  const { t } = useTranslation()
  return (
    <section className="error-page section">
      <div className="container error-page-container">
        <div className="error-card">
          <div className="error-visual" aria-hidden="true">
            <div className="error-number">404</div>
            <div className="error-icon-wrap">
              <Music4 className="error-icon" />
            </div>
          </div>

          <div className="error-content">
            <p className="eyebrow">{t('error.pageNotFound')}</p>
            <h1>{t('error.pageNotFound')}</h1>
            <p className="error-message">{t('error.pageNotFoundDesc')}</p>

            <div className="error-actions">
              <Link to="/" className="btn error-primary-btn">
                <Home size={18} />
                {t('error.goHome')}
              </Link>
              <Link to="/learn" className="btn error-secondary-btn">
                <Search size={18} />
                {t('nav.learn')}
              </Link>
              <button type="button" className="btn error-tertiary-btn" onClick={() => window.history.back()}>
                <ArrowLeft size={18} />
                {t('common.back')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ErrorPage
