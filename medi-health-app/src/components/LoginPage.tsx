import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  name: string
  email: string
  role: 'doctor' | 'patient'
}

interface LoginPageProps {
  onLogin: (user: User) => void
  onNavigate: (page: 'home' | 'login' | 'doctor' | 'patient') => void
}

export default function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient' as 'doctor' | 'patient',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Login failed')

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (!profile) {
          throw new Error('User profile not found. Please contact support.')
        }

        onLogin({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
        })
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Signup failed')

        const { error: profileError } = await supabase.from('users').insert([
          {
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            role: formData.role,
          },
        ])

        if (profileError) {
          await supabase.auth.signOut()
          throw new Error('Failed to create user profile. Please try again.')
        }

        onLogin({
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
        })
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6 py-12 hero-gradient grid-pattern page-enter">
      {/* Decorative background */}
      <div className="absolute top-20 left-1/4 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('home')}
          className="mb-8 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-all duration-200"
          id="back-to-home-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Home
        </button>

        {/* Login Card */}
        <div className="p-8 rounded-2xl glass glow animate-slide-up">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L12 22"/>
                <path d="M2 7h20"/>
                <path d="M2 17h20"/>
                <circle cx="7" cy="7" r="1.5" fill="white" stroke="none"/>
                <circle cx="17" cy="7" r="1.5" fill="white" stroke="none"/>
                <circle cx="7" cy="17" r="1.5" fill="white" stroke="none"/>
                <circle cx="17" cy="17" r="1.5" fill="white" stroke="none"/>
              </svg>
            </div>
            <span className="text-2xl font-bold gradient-text">Medi Health</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2 text-white" id="auth-title">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-400 text-center text-sm mb-8">
            {isLogin
              ? 'Sign in to access your secure medical portal'
              : 'Join our secure healthcare platform'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3 animate-slide-down" id="auth-error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  className="input-field"
                  id="signup-name-input"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="input-field"
                id="auth-email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                minLength={6}
                className="input-field"
                id="auth-password-input"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  I am a
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="input-field"
                  id="signup-role-select"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Healthcare Provider (Doctor/Lab)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30"
              id="auth-submit-btn"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          {/* Toggle */}
          <div className="text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setFormData({ name: '', email: '', password: '', role: 'patient' })
              }}
              className="ml-2 text-sky-400 hover:text-sky-300 font-semibold transition-colors"
              id="auth-toggle-btn"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
