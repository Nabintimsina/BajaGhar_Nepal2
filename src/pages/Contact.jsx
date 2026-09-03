import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Send, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import './Contact.css'

function Contact() {
  const { t } = useTranslation()
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: location.state?.subject || '',
    message: ''
  })
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    if (!showPopup || submitStatus !== 'success') {
      return
    }

    const timer = window.setTimeout(() => {
      setShowPopup(false)
    }, 4000)

    return () => clearTimeout(timer)
  }, [showPopup, submitStatus])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitStatus('sending')
    setStatusMessage('')

    try {
      await api.post('contact/', formData)
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      })
      setStatusMessage(t('contact.successMessage'))
      setSubmitStatus('success')
      setShowPopup(true)
    } catch (error) {
      console.error('Error sending message:', error)
      setStatusMessage(error instanceof Error ? error.message : t('contact.errorMessage'))
      setSubmitStatus('error')
      setShowPopup(true)
    }
  }

  return (
    <div className="contact-page">
      <div className="page-header">
        <div className="container">
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.subtitle')}</p>
        </div>
      </div>

      <section className="section contact-section">
        <div className="container">
          {showPopup && (
            <div className="contact-popup-overlay" role="presentation">
              <div
                className={`contact-popup contact-popup-${submitStatus}`}
                role={submitStatus === 'error' ? 'alert' : 'status'}
                aria-live="polite"
                aria-modal="true"
              >
                <button
                  type="button"
                  className="contact-popup-close"
                  onClick={() => setShowPopup(false)}
                  aria-label={t('contact.closePopup')}
                >
                  <X size={18} />
                </button>
                <div className="contact-popup-icon">
                  {submitStatus === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <h3>{submitStatus === 'error' ? t('contact.errorTitle') : t('contact.messageSent')}</h3>
                <p>{statusMessage}</p>
              </div>
            </div>
          )}

          <div className="contact-form-wrapper">
            <div className="contact-form-container">
              <h2>{t('contact.sendMessage')}</h2>
              <p className="form-intro">
                {t('contact.formIntro')}
              </p>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">{t('contact.name')} *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={t('contact.name')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">{t('contact.email')} *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">{t('contact.subject')} *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder={t('contact.subject')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">{t('contact.message')} *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder={t('contact.message')}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-large contact-submit-btn" disabled={submitStatus === 'sending'}>
                  <Send size={20} />
                  <span style={{ marginLeft: '0.5rem' }}>{submitStatus === 'sending' ? t('contact.sending') : t('contact.send')}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
