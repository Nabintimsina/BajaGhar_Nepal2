import { Link, useLocation } from "react-router-dom"
import { Music, Menu, X, LogOut, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useBranding } from "../context/BrandingContext"
import { useAuth } from "../context/AuthContext"
import LanguageSwitcher from "./LanguageSwitcher"
import "./Navbar.css"

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const { branding } = useBranding()
  const { t } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, logout, user } = useAuth()

  const isActive = (path) => {
    return location.pathname === path ? "active" : ""
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    closeProfileMenu()
    closeMenu()
  }

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        closeProfileMenu()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getUserDisplayName = () => {
    return user?.first_name || user?.username || "User"
  }

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-mark" aria-hidden="true">
            {branding.logoUrl ? (
              <img className="logo-image" src={branding.logoUrl} alt={branding.logoAlt} />
            ) : (
              <Music className="logo-icon" aria-hidden="true" />
            )}
          </span>
          <span className="logo-text">BAJAGHAR NEPAL</span>
        </Link>

        <ul className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          <li><Link to="/" className={isActive("/")} onClick={closeMenu}>{t("nav.home")}</Link></li>
          <li><Link to="/learn" className={isActive("/learn")} onClick={closeMenu}>{t("nav.learn")}</Link></li>
          <li><Link to="/tuner" className={isActive("/tuner")} onClick={closeMenu}>{t("nav.tuner")}</Link></li>
          <li><Link to="/experts" className={isActive("/experts")} onClick={closeMenu}>{t("nav.experts")}</Link></li>
          <li><Link to="/contact" className={isActive("/contact")} onClick={closeMenu}>{t("nav.contact")}</Link></li>
          <li className="mobile-auth-menu">
            {!isAuthenticated ? (
              <Link to="/login" className={`btn-login ${isActive("/login")}`} onClick={closeMenu}>Login</Link>
            ) : (
              <div className="mobile-auth-links">
                <Link to="/dashboard" onClick={closeMenu}>My BajaGhar</Link>
                <Link to="/profile" onClick={closeMenu}>Profile</Link>
                <button type="button" className="nav-logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
              </div>
            )}
          </li>
        </ul>

        <div className="navbar-auth">
          {!isAuthenticated ? (
            <Link to="/login" className={`btn-login ${isActive("/login")}`} onClick={closeMenu}>Login</Link>
          ) : (
            <div className="profile-menu" ref={profileMenuRef}>
              <button 
                type="button" 
                className="profile-menu-toggle"
                onClick={toggleProfileMenu}
                aria-expanded={isProfileMenuOpen}
              >
                <span className="profile-avatar">👤</span>
                <span className="profile-name">{getUserDisplayName()}</span>
                <ChevronDown size={18} className={`chevron ${isProfileMenuOpen ? "open" : ""}`} />
              </button>
              
              {isProfileMenuOpen && (
                <div className="profile-dropdown">
                  <Link to="/dashboard" className="profile-menu-item" onClick={closeProfileMenu}>
                    My BajaGhar
                  </Link>
                  <Link to="/profile" className="profile-menu-item" onClick={closeProfileMenu}>
                    Profile
                  </Link>
                  <div className="profile-menu-divider"></div>
                  <button type="button" className="profile-menu-item logout-item" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="navbar-toggle" onClick={toggleMenu} aria-label={t("nav.toggleMenu")}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <LanguageSwitcher />
      </div>
    </nav>
  )
}

export default Navbar
