import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBranding } from '../context/BrandingContext'
import './Footer.css'
import { toNepaliDigits } from '../utils/formatNumbers'

function Footer() {
  const currentYear = new Date().getFullYear()
  const { branding } = useBranding()
  const { t } = useTranslation()
  const { i18n } = useTranslation()
  const primaryContactEmail = branding.contactEmail || 'info@bajanepal.com'
  const activeLang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ne') ? 'ne' : 'en'

  const yearForRender = activeLang === 'ne' ? toNepaliDigits(currentYear) : currentYear

  return (
    <footer className="footer">
      <div className="footer-content container">
        <div className="footer-section">
          <h3>{t('footer.aboutPlatform')}</h3>
          <p>{t('footer.aboutPlatformDesc')}</p>
        </div>

        <div className="footer-section">
          <h3>{t('footer.explore')}</h3>
          <ul className="footer-links">
            <li><Link to="/">{t('nav.home')}</Link></li>
            <li><Link to="/learn">{t('nav.learn')}</Link></li>
            <li><Link to="/experts">{t('nav.experts')}</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{t('footer.connect')}</h3>
          <ul className="footer-links">
            <li><Link to="/contact">{t('footer.contact')}</Link></li>
          </ul>
          <div className="footer-email">
            <Mail size={18} className="footer-mail-icon" />
            <a href={`mailto:${primaryContactEmail}`}>{primaryContactEmail}</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="footer-credits">
            <p>{t('footer.copyright', { year: yearForRender, brand: branding.name })}</p>
            <p className="supported-by">{t('footer.supportedBy')}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
