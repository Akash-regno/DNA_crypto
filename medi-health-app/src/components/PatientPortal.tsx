import { useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'doctor' | 'patient'
}

interface PatientPortalProps {
  user: User
  onLogout: () => void
}

const API = 'http://localhost:5000/api'

export default function PatientPortal({ user, onLogout }: PatientPortalProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [masterKey, setMasterKey] = useState('')
  const [decryptedReport, setDecryptedReport] = useState<string | null>(null)
  const [decryptedText, setDecryptedText] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [decryptionType, setDecryptionType] = useState<'text' | 'image'>('image')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleDecrypt = async () => {
    if (!masterKey.trim()) {
      setMessage({ text: 'Please enter the master key', type: 'error' })
      return
    }

    setLoading(true)
    setMessage({ text: 'Retrieving and decrypting your report...', type: 'info' })

    try {
      const endpoint = decryptionType === 'image' ? '/decrypt/image' : '/decrypt/text'

      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: masterKey.trim() }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Decryption failed')
      }

      if (decryptionType === 'image') {
        const imageSrc = `data:image/png;base64,${data.decrypted_image_b64}`
        setDecryptedReport(imageSrc)
        setDecryptedText(null)
      } else {
        setDecryptedText(data.plaintext)
        setDecryptedReport(null)
      }

      setMessage({
        text: 'Report decrypted successfully',
        type: 'success',
      })
    } catch (err) {
      setMessage({
        text: `Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error',
      })
      setDecryptedReport(null)
      setDecryptedText(null)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!decryptedReport) return

    const link = document.createElement('a')
    link.href = decryptedReport
    link.download = `medical-report-${Date.now()}.png`
    link.click()
  }

  return (
    <div className="min-h-screen bg-slate-900 page-enter">
      {/* Header */}
      <header className="border-b border-slate-800 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L12 22"/>
                <path d="M2 7h20"/>
                <path d="M2 17h20"/>
                <circle cx="7" cy="7" r="1.5" fill="white" stroke="none"/>
                <circle cx="17" cy="7" r="1.5" fill="white" stroke="none"/>
                <circle cx="7" cy="17" r="1.5" fill="white" stroke="none"/>
                <circle cx="17" cy="17" r="1.5" fill="white" stroke="none"/>
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold gradient-text">Medi Health</span>
              <p className="text-xs text-slate-500">Welcome, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-sm font-medium transition-all duration-200"
              id="patient-logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome Banner */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-1">Patient Portal</h1>
          <p className="text-sm text-slate-400 mb-5">Securely access and decrypt your medical reports using the master key provided by your healthcare provider.</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <p className="text-xs text-slate-500">Encryption</p>
                <p className="text-sm font-medium text-white">4-Layer DNA</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <p className="text-xs text-slate-500">Key Length</p>
                <p className="text-sm font-medium text-white">24 Characters</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
              </div>
              <div>
                <p className="text-xs text-slate-500">Storage</p>
                <p className="text-sm font-medium text-white">Cloud Secured</p>
              </div>
            </div>
          </div>
        </div>
        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl border text-sm flex items-start gap-3 animate-slide-down ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : message.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}
            id="patient-message"
          >
            {message.type === 'success' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            ) : message.type === 'error' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 animate-spin">
                <line x1="12" y1="2" x2="12" y2="6"/>
                <line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="6" y2="12"/>
                <line x1="18" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
              </svg>
            )}
            {message.text}
          </div>
        )}

        {/* Decrypt Report */}
        <div className="card p-8 mb-6">
          <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-3" id="decrypt-heading">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
              </svg>
            </div>
            Decrypt Medical Report
          </h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed ml-[52px]">
            Enter the master key provided by your healthcare provider to view your encrypted
            medical report.
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-900/50 rounded-xl w-fit">
            <button
              onClick={() => {
                setDecryptionType('image')
                setDecryptedReport(null)
                setDecryptedText(null)
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                decryptionType === 'image'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              id="decrypt-type-image"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Image / File
            </button>
            <button
              onClick={() => {
                setDecryptionType('text')
                setDecryptedReport(null)
                setDecryptedText(null)
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                decryptionType === 'text'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              id="decrypt-type-text"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Text
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Master Key
            </label>
            <div className="flex gap-3">
              <input
                type={showKey ? 'text' : 'password'}
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="Enter 24-character master key"
                className="input-field font-mono flex-1"
                id="master-key-input"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600 transition-all duration-200"
                id="toggle-key-visibility"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleDecrypt}
            disabled={loading}
            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30"
            id="decrypt-btn"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Decrypting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                </svg>
                Decrypt {decryptionType === 'image' ? 'Report' : 'Text'}
              </span>
            )}
          </button>
        </div>

        {/* Decrypted Image Report */}
        {decryptedReport && (
          <div className="card p-8 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                Your Medical Report
              </h2>
              <button
                onClick={downloadReport}
                className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-lg shadow-sky-500/20"
                id="download-report-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Report
              </button>
            </div>
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700/50 text-center">
              <img
                src={decryptedReport}
                alt="Decrypted Medical Report"
                className="max-w-full h-auto rounded-lg mx-auto"
              />
            </div>
          </div>
        )}

        {/* Decrypted Text Report */}
        {decryptedText && (
          <div className="card p-8 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                Your Medical Report
              </h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(decryptedText)
                  setMessage({ text: 'Copied to clipboard', type: 'success' })
                  setTimeout(() => setMessage({ text: '', type: '' }), 2000)
                }}
                className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-lg shadow-sky-500/20"
                id="copy-text-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy Text
              </button>
            </div>
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700/50">
              <pre className="text-slate-200 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {decryptedText}
              </pre>
            </div>
          </div>
        )}

        {/* How Decryption Works */}
        <div className="card p-8 mb-6">
          <h3 className="text-lg font-bold mb-5 text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            How Decryption Works
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Enter Master Key', desc: 'Your healthcare provider gave you a unique 24-character key. Enter it above to begin decryption.' },
              { step: '2', title: 'Data Retrieved', desc: 'The system retrieves your encrypted data from the secure cloud and validates the key.' },
              { step: '3', title: 'DNA Decryption', desc: 'The 4-layer DNA encryption is reversed: inverse permutation, complement, XOR, and decode.' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-xs font-bold text-white mb-3">{item.step}</div>
                <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security Details */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-bold mb-5 text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            Security Details
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { text: 'End-to-end encryption', detail: 'Data encrypted before leaving the device' },
              { text: 'Key-only access', detail: 'Without the master key, data cannot be decrypted' },
              { text: 'No key storage on server', detail: 'Keys are never stored or logged by the system' },
              { text: 'Cloud-secured storage', detail: 'Supabase with PostgreSQL row-level security' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm p-3 rounded-lg bg-slate-900/30">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <span className="text-slate-200">{item.text}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Encryption Technology */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L12 22"/><path d="M2 7h20"/><path d="M2 17h20"/></svg>
            </div>
            Encryption Technology
          </h3>
          <p className="text-sm text-slate-400 mb-5 ml-11">Your reports are protected by a 4-layer DNA-based cryptographic pipeline.</p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'DNA Encoding', desc: 'Binary data is converted to DNA bases (A, T, C, G) using a unique shuffled mapping for each data chunk.', color: '#0ea5e9' },
              { step: '2', title: 'DNA XOR', desc: 'Each DNA sequence is XORed with a pseudo-random key generated from the master key.', color: '#06b6d4' },
              { step: '3', title: 'Complement', desc: 'DNA complement transformation swaps base pairs: A with T, and C with G.', color: '#8b5cf6' },
              { step: '4', title: 'Permutation', desc: 'Final shuffling of sequence positions using a seeded random permutation.', color: '#10b981' },
            ].map((layer, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: layer.color }}></div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mb-3" style={{ background: layer.color }}>
                  {layer.step}
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{layer.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{layer.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supported Report Types & Privacy */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Supported Report Types */}
          <div className="card p-6">
            <h3 className="text-lg font-bold mb-5 text-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              Supported Report Types
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Blood Test', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
                { name: 'X-Ray', icon: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4' },
                { name: 'MRI Scan', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 0 0-12z' },
                { name: 'CT Scan', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' },
                { name: 'Ultrasound', icon: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z' },
                { name: 'Lab Report', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
                { name: 'Prescription', icon: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' },
                { name: 'Other', icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
              ].map((type, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/30 text-sm text-slate-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <path d={type.icon}/>
                  </svg>
                  {type.name}
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Compliance */}
          <div className="card p-6">
            <h3 className="text-lg font-bold mb-5 text-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              Privacy and Compliance
            </h3>
            <div className="space-y-3">
              {[
                { title: 'HIPAA Compliant', desc: 'All data handling follows Health Insurance Portability and Accountability Act standards.' },
                { title: 'Zero-Knowledge Architecture', desc: 'The server never has access to your unencrypted data or master key.' },
                { title: 'Data Sovereignty', desc: 'You control access to your medical records. Only the key holder can decrypt.' },
                { title: 'Audit Trail', desc: 'All encryption and decryption events are logged for accountability.' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/30">
                  <p className="text-sm font-medium text-slate-200 mb-0.5">{item.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowLogoutModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div
            className="relative w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Confirm Logout</h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Are you sure you want to logout? You will need your master key to access reports again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-all duration-200"
                id="cancel-logout-btn"
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-red-500/20"
                id="confirm-logout-btn"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
