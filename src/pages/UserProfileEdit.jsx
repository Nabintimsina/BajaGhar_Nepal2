import { useEffect, useState } from 'react'
import { ArrowLeft, Save, UserRound } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './ExpertProfileEdit.css'

function UserProfileEdit() {
  const { user, isAuthenticated, loading, refreshProfile } = useAuth()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '' })
    setPreview(user.photo || '')
  }, [user])

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setMessage('')
  }

  const choosePhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPreview(URL.createObjectURL(file))
    setMessage('')
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value))
    if (photoFile) payload.append('photo_upload', photoFile)
    try {
      await api.patch('auth/me/', payload)
      await refreshProfile()
      setPhotoFile(null)
      setMessageType('success')
      setMessage('Your profile was updated successfully.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Unable to save your profile details.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <main className="container expert-edit-state"><h2>Loading your profile...</h2></main>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <main className="container expert-edit-page"><Link to="/profile" className="expert-edit-back"><ArrowLeft size={17} /> Back to Profile</Link><div className="expert-edit-heading"><div className="expert-edit-icon"><UserRound size={28} /></div><div><span className="eyebrow">Account profile</span><h1>Edit my details</h1><p>Keep your account information and profile photo up to date.</p></div></div><form className="expert-edit-form" onSubmit={saveProfile}><section className="expert-edit-section"><h2>Personal information</h2><div className="expert-edit-grid"><label>First name<input name="first_name" value={form.first_name} onChange={updateField} required /></label><label>Last name<input name="last_name" value={form.last_name} onChange={updateField} /></label><label>Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label><label>Username<span>Your username cannot be changed here.</span><input value={user?.username || ''} disabled /></label></div></section><section className="expert-edit-section"><h2>Profile photo</h2><div className="expert-photo-row">{preview ? <img src={preview} alt="Profile preview" /> : <div className="expert-photo-placeholder"><UserRound size={30} /></div>}<label className="photo-picker">Choose a photo<input type="file" accept="image/*" onChange={choosePhoto} /></label></div></section>{message && <p className={`expert-edit-message ${messageType}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}<button className="btn btn-primary" type="submit" disabled={isSaving}><Save size={17} /> {isSaving ? 'Saving details...' : 'Save my details'}</button></form></main>
}

export default UserProfileEdit