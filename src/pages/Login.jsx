import { useState } from 'react'
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [popupType, setPopupType] = useState('error')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const showErrorPopup = (message, seconds = null) => {
    setPopupMessage(message)
    setPopupType('error')
    if (seconds) {
      setRemainingSeconds(seconds)
    }
    setShowPopup(true)
  }

  const showSuccessPopup = (message, nextPath = '/dashboard') => {
    setPopupMessage(message)
    setPopupType('success')
    setShowPopup(true)
    setTimeout(() => {
      setShowPopup(false)
      navigate(nextPath)
    }, 1500)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login({
        username: formData.username,
        password: formData.password,
      })
      showSuccessPopup(t('auth.loginSuccess'), location.state?.returnTo || '/dashboard')
      setFormData({ username: '', password: '', confirmPassword: '', name: '', email: '' })
    } catch (err) {
      showErrorPopup(err.message || t('auth.invalidCredentials'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      setIsLoading(false)
      return
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.name.split(' ')[0] || '',
        last_name: formData.name.split(' ').slice(1).join(' ') || '',
      })
      showSuccessPopup('Welcome to BajaGhar! Your account is ready.', location.state?.returnTo || '/dashboard')
      setFormData({ username: '', password: '', confirmPassword: '', name: '', email: '' })
    } catch (err) {
      showErrorPopup(err.message || 'Unable to create your account right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    if (isLogin) {
      handleLogin(e)
    } else {
      handleRegister(e)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: ''
    })
    setError('')
  }

  return (
    <div className="login-page">
      {showPopup && (
        <div className="contact-popup-overlay" role="presentation">
          <div
            className={`contact-popup contact-popup-${popupType}`}
            role={popupType === 'error' ? 'alert' : 'status'}
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
              {popupType === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <h3>{popupType === 'error' ? t('auth.error') : t('auth.success')}</h3>
            <p>{popupMessage}</p>
            {remainingSeconds > 0 && (
              <p style={{ fontSize: '0.9em', marginTop: '0.5rem', opacity: 0.8 }}>
                {t('auth.tryAgainIn')} {remainingSeconds} {t('auth.seconds')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="login-container">
        <div className="login-header">
          <Lock size={40} className="login-icon" />
          <h1>{isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}</h1>
          <p>
            {isLogin 
              ? t('auth.loginPrompt') 
              : t('auth.registerPrompt')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">{t('auth.fullName')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                placeholder={t('auth.enterFullName')}
              />
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">{t('auth.emailAddress')}</label>
              <div className="input-with-icon">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">{isLogin ? t('auth.username') : 'Username'}</label>
            <div className="input-with-icon">
              <Mail size={20} className="input-icon" />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder={isLogin ? t('auth.usernamePlaceholder') : 'Choose a username'}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <div className="input-with-icon">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={t('auth.passwordPlaceholder')}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={t('auth.togglePasswordVisibility')}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
              <div className="input-with-icon">
                <Lock size={20} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                />
              </div>
            </div>
          )}

          {isLogin && (
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>{t('auth.rememberMe')}</span>
              </label>
              <a href="#forgot" className="forgot-link">{t('auth.forgotPassword')}</a>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ color: '#c41e3a', fontSize: '0.9em' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-large login-button"
            disabled={isLoading}
          >
            {isLoading ? t('auth.loggingIn') : (isLogin ? t('auth.logIn') : t('auth.signUp'))}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
            {' '}
            <button className="toggle-mode-button" onClick={toggleMode}>
              {isLogin ? t('auth.signUp') : t('auth.logIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

