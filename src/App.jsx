import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Learn from './pages/Learn'
import CourseDetail from './pages/CourseDetail'
import LessonDetail from './pages/LessonDetail'
import TunerLab from './pages/TunerLab'
import Experts from './pages/Experts'
import ExpertDetail from './pages/ExpertDetail'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import CreateCourse from './pages/CreateCourse'
import ErrorPage from './pages/ErrorPage'
import { BrandingProvider } from './context/BrandingContext'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  const { i18n } = useTranslation()

  // Sync document language attribute with i18n language
  useEffect(() => {
    const language = i18n.language?.toLowerCase() || 'en'
    document.documentElement.lang = language.startsWith('ne') ? 'ne' : 'en'
    document.documentElement.dir = 'ltr' // Nepali uses left-to-right script
  }, [i18n.language])

  return (
    <Router>
      <BrandingProvider>
        <AuthProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/learn/courses/:id" element={<CourseDetail />} />
                <Route path="/learn/courses/:courseId/lessons/:lessonId" element={<LessonDetail />} />
                <Route path="/tuner" element={<TunerLab />} />
                <Route path="/experts" element={<Experts />} />
                <Route path="/experts/:id" element={<ExpertDetail />} />
                                <Route path="/experts/:id/courses/new" element={<CreateCourse />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<ErrorPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </BrandingProvider>
    </Router>
  )
}

export default App
