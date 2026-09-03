import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Zap } from 'lucide-react'
import './Profile.css'

function Profile() {
  const { user, isAuthenticated, loading, subscription } = useAuth()

  if (loading) {
    return <div className="container py-5"><p>Loading profile…</p></div>
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="profile-page">
      <header className="profile-header page-header">
        <div className="container">
          <div className="profile-header-content">
            <div className="profile-avatar-large"><User size={48} /></div>
            <div>
              <h1>{user.first_name || user.username}</h1>
              <p className="profile-subtitle">Member of BajaGhar Nepal community</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="profile-grid">
          <section className="detail-box profile-info-card">
            <div className="section-heading section-heading-tight">
              <span className="eyebrow">Account</span>
              <h2>Your Information</h2>
            </div>
            <div className="profile-info-list">
              <div className="profile-info-item">
                <div className="profile-info-icon"><User size={20} /></div>
                <div>
                  <p className="profile-info-label">Username</p>
                  <p className="profile-info-value">{user.username}</p>
                </div>
              </div>
              <div className="profile-info-item">
                <div className="profile-info-icon"><Mail size={20} /></div>
                <div>
                  <p className="profile-info-label">Email</p>
                  <p className="profile-info-value">{user.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="profile-info-item">
                <div className="profile-info-icon"><Zap size={20} /></div>
                <div>
                  <p className="profile-info-label">Membership</p>
                  <p className="profile-info-value">{subscription?.is_premium ? 'Premium Member' : 'Free Member'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="detail-box profile-quick-links-card">
            <div className="section-heading section-heading-tight">
              <span className="eyebrow">Quick Links</span>
              <h2>Navigate</h2>
            </div>
            <div className="profile-quick-links">
              <Link to="/dashboard" className="profile-quick-link">Your Dashboard</Link>
              <Link to="/learn" className="profile-quick-link">Continue Learning</Link>
              <Link to="/contact" className="profile-quick-link">Contact Us</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Profile
