import { useEffect, useState } from 'react'
import { ArrowLeft, Save, UserRound } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import PasswordChangeForm from '../components/PasswordChangeForm'
import './ExpertProfileEdit.css'

function ExpertProfileEdit() {
  const { expert, isExpert, isAuthenticated, loading, refreshProfile } = useAuth()
  const [form, setForm] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!expert) return
    setForm({
      name: expert.name || '',
      expertise: expert.expertise || '',
      bio: expert.bio || '',
      detailed_bio: expert.detailed_bio || '',
      contact_email: expert.contact_email || '',
      achievements: (expert.achievements || []).join('\n'),
    })
    setPreview(expert.photo || '')
  }, [expert])

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setMessage('')
  }

  const choosePhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')
    setMessageType('success')
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, key === 'achievements' ? JSON.stringify(value.split('\n').map((item) => item.trim()).filter(Boolean)) : value))
    if (photoFile) payload.append('photo', photoFile)

    try {
      await api.patch(`experts/${expert.id}/`, payload)
      await refreshProfile()
      setPhotoFile(null)
      setMessageType('success')
      setMessage('Your expert details were updated.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Unable to update your details.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <main className="container expert-edit-state"><h2>Loading your details...</h2></main>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isExpert || !form) return <main className="container expert-edit-state"><h2>Expert access required</h2><Link to="/profile" className="btn btn-primary">Back to Profile</Link></main>

  return (
    <main className="container expert-edit-page">
      <Link to="/profile" className="expert-edit-back"><ArrowLeft size={17} /> Back to Profile</Link>
      <div className="expert-edit-heading">
        <div className="expert-edit-icon"><UserRound size={28} /></div>
        <div><span className="eyebrow">Expert profile</span><h1>Edit my details</h1><p>Keep the public information students see about you up to date.</p></div>
      </div>
      <form className="expert-edit-form" onSubmit={saveProfile}>
        <section className="expert-edit-section"><h2>Public information</h2><div className="expert-edit-grid"><label>Full name<input name="name" value={form.name} onChange={updateField} required /></label><label>Email<input name="contact_email" type="email" value={form.contact_email} onChange={updateField} /></label><label>Expertise<input name="expertise" value={form.expertise} onChange={updateField} required /></label></div></section>
        <section className="expert-edit-section"><h2>Biography</h2><label>Short biography<textarea name="bio" value={form.bio} onChange={updateField} rows="4" required /></label><label>Detailed biography<textarea name="detailed_bio" value={form.detailed_bio} onChange={updateField} rows="7" /></label></section>
        <section className="expert-edit-section"><h2>Achievements</h2><label>List your achievements <span>One achievement per line</span><textarea name="achievements" value={form.achievements} onChange={updateField} rows="6" /></label></section>
        <section className="expert-edit-section"><h2>Profile photo</h2><div className="expert-photo-row">{preview ? <img src={preview} alt="Profile preview" /> : <div className="expert-photo-placeholder"><UserRound size={30} /></div>}<label className="photo-picker">Choose a new photo<input type="file" accept="image/*" onChange={choosePhoto} /></label></div></section>
        {message && <p className={`expert-edit-message ${messageType}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}
        <button className="btn btn-primary" type="submit" disabled={isSaving}><Save size={17} /> {isSaving ? 'Saving details...' : 'Save my details'}</button>
      </form>
      <PasswordChangeForm />
    </main>
  )
}

export default ExpertProfileEdit
