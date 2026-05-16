import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/services'
import toast from 'react-hot-toast'
import { User, Lock, Shield } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [pw, setPw]   = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [saving, setSaving] = useState(false)

  const changePw = async (e) => {
    e.preventDefault()
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match')
    if (pw.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    setSaving(true)
    try {
      await authApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      toast.success('Password updated successfully')
      setPw({ currentPassword:'', newPassword:'', confirm:'' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="topbar"><span className="topbar-title">Settings</span></div>
      <div className="page-body" style={{ maxWidth:600 }}>
        {/* Profile card */}
        <div className="card mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div style={{ width:52, height:52, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.1rem', background: user?.role==='owner' ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'linear-gradient(135deg,#10b981,#059669)' }}>
              {user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
            </div>
            <div>
              <div className="font-semibold text-lg">{user?.name}</div>
              <div className="text-sm text-muted">@{user?.username}</div>
              <span className={`badge mt-1 ${user?.role==='owner' ? 'badge-blue':'badge-green'}`}>
                <Shield size={10}/> {user?.role==='owner' ? 'Owner / Admin' : 'Worker / Cashier'}
              </span>
            </div>
          </div>
          <div style={{ background:'var(--bg-base)', borderRadius:'var(--radius)', padding:'0.75rem 1rem', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
            {user?.role === 'owner'
              ? '👑 You have full access to all features including products, stock, orders, invoices, and analytics.'
              : '🖥️ You are a cashier. You can browse products and generate bills at the POS counter.'}
          </div>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} color="var(--accent-light)"/>
            <h3 className="font-semibold">Change Password</h3>
          </div>
          <form onSubmit={changePw} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" value={pw.currentPassword} onChange={e=>setPw(p=>({...p,currentPassword:e.target.value}))} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" value={pw.newPassword} onChange={e=>setPw(p=>({...p,newPassword:e.target.value}))} placeholder="Min. 6 characters" autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} placeholder="Repeat new password" autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf:'flex-start' }}>
              {saving ? <span className="spinner"/> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
