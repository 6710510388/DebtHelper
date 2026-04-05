import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authLogin, authRegister } from '../utils/api'
import { Eye, EyeOff, LogIn, UserPlus, TrendingDown } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', monthly_income: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (!form.email || !form.password) { setError('กรุณากรอกอีเมลและรหัสผ่าน'); return }
    if (mode === 'register' && !form.name) { setError('กรุณากรอกชื่อ'); return }
    setLoading(true)
    try {
      const res = mode === 'login'
        ? await authLogin({ email: form.email, password: form.password })
        : await authRegister({ name: form.name, email: form.email, password: form.password, monthly_income: parseFloat(form.monthly_income) || 0 })
      const { user, token } = res.data.data
      login(user, token)
    } catch (e) {
      const msg = e.response?.data?.error || e.message
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setForm({ name: '', email: 'demo@debthelper.app', password: 'demo1234', monthly_income: '' })
    setMode('login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-in">
        {/* Logo */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <span className="text-4xl">💸</span>
            <span className="font-display font-bold text-3xl text-gradient">DebtHelper</span>
          </div>
          <p className="text-gray-400 text-sm">GPS การเงินส่วนตัว — จัดการหนี้ให้เป็นระบบ</p>
        </div>

        {/* Card */}
        <div className="card space-y-4">
          {/* Tab */}
          <div className="flex bg-surface-700 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <LogIn size={15} /> เข้าสู่ระบบ
            </button>
            <button
              onClick={() => { setMode('register'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <UserPlus size={15} /> สมัครสมาชิก
            </button>
          </div>

          {/* Form */}
          <div className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="label">ชื่อ-นามสกุล *</label>
                <input className="input" placeholder="สมชาย ใจดี" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">อีเมล *</label>
              <input className="input" type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div>
              <label className="label">รหัสผ่าน *</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label className="label">รายได้ต่อเดือน (฿)</label>
                <input className="input" type="number" placeholder="35000" value={form.monthly_income} onChange={e => set('monthly_income', e.target.value)} />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            ) : mode === 'login' ? (
              <><LogIn size={16}/> เข้าสู่ระบบ</>
            ) : (
              <><UserPlus size={16}/> สมัครสมาชิก</>
            )}
          </button>

          {mode === 'login' && (
            <button
              onClick={fillDemo}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-300 py-1 transition-colors"
            >
              🚀 ทดลองใช้งาน (Demo Account)
            </button>
          )}
        </div>

        {/* Features hint */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          {['📊 ภาพรวมหนี้สิน', '🎯 ตั้งเป้าหมาย', '⏰ แจ้งเตือนชำระ', '📈 วิเคราะห์การเงิน'].map(f => (
            <div key={f} className="flex items-center gap-1.5">
              <TrendingDown size={10} className="text-brand-500 flex-shrink-0"/>
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
