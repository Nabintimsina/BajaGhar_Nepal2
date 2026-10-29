import { useState } from 'react'
import { KeyRound, Save } from 'lucide-react'
import { api } from '../api/client'

function PasswordChangeForm() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [isSaving, setIsSaving] = useState(false)

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (form.new_password !== form.confirm_password) {
      setMessageType('error')
      setMessage('New passwords do not match.')
      return
    }
    setIsSaving(true)
    setMessage('')
    try {
      await api.post('auth/password/', { current_password: form.current_password, new_password: form.new_password })
      setForm({ current_password: '', new_password: '', confirm_password: '' })
      setMessageType('success')
      setMessage('Password changed successfully.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Unable to change your password.')
    } finally {
      setIsSaving(false)
    }
  }

  return <section className="expert-edit-section password-change-section"><h2><KeyRound size={18} /> Change password</h2><form className="password-change-form" onSubmit={submit}><label>Current password<input name="current_password" type="password" value={form.current_password} onChange={updateField} required autoComplete="current-password" /></label><label>New password<input name="new_password" type="password" value={form.new_password} onChange={updateField} minLength="8" required autoComplete="new-password" /></label><label>Confirm new password<input name="confirm_password" type="password" value={form.confirm_password} onChange={updateField} minLength="8" required autoComplete="new-password" /></label>{message && <p className={`expert-edit-message ${messageType}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}<button className="btn btn-secondary" type="submit" disabled={isSaving}><Save size={16} /> {isSaving ? 'Updating...' : 'Update password'}</button></form></section>
}

export default PasswordChangeForm