import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'doctor' | 'patient'
}

interface DoctorPortalProps {
  user: User
  onLogout: () => void
}

interface EncryptionHistory {
  id: string
  patientName: string
  patientEmail: string
  reportType: string
  encryptionType: 'text' | 'image'
  masterKey: string
  encryptionId: string
  timestamp: string
}

const API = 'http://localhost:5000/api'

export default function DoctorPortal({ user, onLogout }: DoctorPortalProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [masterKey, setMasterKey] = useState('')
  const [encryptionId, setEncryptionId] = useState('')
  const [encryptionType, setEncryptionType] = useState<'text' | 'image'>('image')
  const [activeTab, setActiveTab] = useState<'encrypt' | 'history' | 'stats'>('encrypt')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const [patientInfo, setPatientInfo] = useState({
    name: '',
    email: '',
    reportType: 'Blood Test',
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textToEncrypt, setTextToEncrypt] = useState('')
  const [encryptionHistory, setEncryptionHistory] = useState<EncryptionHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Load history from Supabase when component mounts
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await fetch(`${API}/history/${user.id}`)
      const data = await response.json()
      
      if (data.success && data.history) {
        const transformed = data.history.map((item: any) => ({
          id: item.id,
          patientName: item.patient_name,
          patientEmail: item.patient_email,
          reportType: item.report_type,
          encryptionType: item.encryption_type,
          masterKey: item.master_key,
          encryptionId: item.encryption_id,
          timestamp: new Date(item.created_at).toLocaleString(),
        }))
        setEncryptionHistory(transformed)
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPatientInfo({
      ...patientInfo,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ text: 'File size must be less than 10MB', type: 'error' })
        return
      }
      setSelectedFile(file)
      setMessage({ text: '', type: '' })
    }
  }

  const generateMasterKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let key = ''
    const array = new Uint8Array(24)
    window.crypto.getRandomValues(array)
    for (let i = 0; i < 24; i++) {
      key += chars[array[i] % chars.length]
    }
    return key
  }

  const handleEncrypt = async () => {
    if (!patientInfo.name || !patientInfo.email) {
      setMessage({ text: 'Please fill in patient information', type: 'error' })
      return
    }

    if (encryptionType === 'image' && !selectedFile) {
      setMessage({ text: 'Please select a report file', type: 'error' })
      return
    }

    if (encryptionType === 'text' && !textToEncrypt.trim()) {
      setMessage({ text: 'Please enter text to encrypt', type: 'error' })
      return
    }

    setLoading(true)
    setMessage({ text: 'Encrypting report...', type: 'info' })

    try {
      const key = generateMasterKey()

      if (encryptionType === 'image') {
        const formData = new FormData()
        formData.append('file', selectedFile!)
        formData.append('key', key)
        formData.append('doctor_id', user.id)
        formData.append('patient_name', patientInfo.name)
        formData.append('patient_email', patientInfo.email)
        formData.append('report_type', patientInfo.reportType)

        const response = await fetch(`${API}/encrypt/image`, {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Encryption failed')
        }

        setMasterKey(key)
        setEncryptionId(data.encryption_id || 'N/A')

        setMessage({
          text: 'Report encrypted successfully. Share the master key with the patient.',
          type: 'success',
        })

        setSelectedFile(null)
        const fileInput = document.getElementById('fileInput') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        // Reload history from Supabase
        loadHistory()
      } else {
        const response = await fetch(`${API}/encrypt/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: textToEncrypt, 
            key,
            doctor_id: user.id,
            patient_name: patientInfo.name,
            patient_email: patientInfo.email,
            report_type: patientInfo.reportType
          }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Encryption failed')
        }

        setMasterKey(key)
        setEncryptionId(data.encryption_id || 'N/A')

        setMessage({
          text: 'Text encrypted successfully. Share the master key with the patient.',
          type: 'success',
        })

        setTextToEncrypt('')
        
        // Reload history from Supabase
        loadHistory()
      }
    } catch (err) {
      setMessage({
        text: `Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ text: 'Copied to clipboard', type: 'success' })
    setTimeout(() => setMessage({ text: '', type: '' }), 2000)
  }

  const sendKeyViaEmail = (email: string, key: string) => {
    const subject = 'Your Medical Report Master Key - Medi Health'
    const body = `Dear Patient,\n\nYour medical report has been encrypted securely. Please use the following master key to decrypt and view your report:\n\nMaster Key: ${key}\n\nVisit the Medi Health patient portal to decrypt your report.\n\nBest regards,\nDr. ${user.name}`
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const tabs = [
    { key: 'encrypt' as const, label: 'Encrypt Report', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    )},
    { key: 'history' as const, label: `History (${encryptionHistory.length})`, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    )},
    { key: 'stats' as const, label: 'Statistics', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    )},
  ]

  return (
    <div className="min-h-screen bg-slate-900 page-enter">
      {/* Header */}
      <header className="border-b border-slate-800 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L12 22"/>
                  <path d="M2 7h20"/>
                  <path d="M2 17h20"/>
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold gradient-text">Medi Health</span>
                <p className="text-xs text-slate-500">Healthcare Provider Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-200">Dr. {user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-sm font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-all duration-200"
                id="doctor-logout-btn"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Welcome Dashboard Overview */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back, Dr. {user.name}</h1>
          <p className="text-sm text-slate-400 mb-5">Here is an overview of your encryption activity and system status.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 stat-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <span className="text-xs text-slate-500">Total Encryptions</span>
              </div>
              <p className="text-2xl font-bold text-white">{encryptionHistory.length}</p>
            </div>
            <div className="card p-4 stat-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <span className="text-xs text-slate-500">Image Reports</span>
              </div>
              <p className="text-2xl font-bold text-white">{encryptionHistory.filter(e => e.encryptionType === 'image').length}</p>
            </div>
            <div className="card p-4 stat-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <span className="text-xs text-slate-500">Text Reports</span>
              </div>
              <p className="text-2xl font-bold text-white">{encryptionHistory.filter(e => e.encryptionType === 'text').length}</p>
            </div>
            <div className="card p-4 stat-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <span className="text-xs text-slate-500">Unique Patients</span>
              </div>
              <p className="text-2xl font-bold text-white">{new Set(encryptionHistory.map(e => e.patientEmail)).size}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-800/60 rounded-xl border border-slate-700/50 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              id={`tab-${tab.key}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-5 p-4 rounded-xl border text-sm flex items-start gap-3 animate-slide-down ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : message.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}
            id="doctor-message"
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            )}
            {message.text}
          </div>
        )}

        {/* Encrypt Tab */}
        {activeTab === 'encrypt' && (
          <div className="space-y-5 animate-fade-in">
            {/* Patient Information */}
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                Patient Information
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={patientInfo.name}
                    onChange={handlePatientChange}
                    placeholder="Enter patient name"
                    className="input-field text-sm"
                    id="patient-name-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Patient Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={patientInfo.email}
                    onChange={handlePatientChange}
                    placeholder="Enter patient email"
                    className="input-field text-sm"
                    id="patient-email-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Report Type
                  </label>
                  <select
                    name="reportType"
                    value={patientInfo.reportType}
                    onChange={handlePatientChange}
                    className="input-field text-sm"
                    id="report-type-select"
                  >
                    <option value="Blood Test">Blood Test</option>
                    <option value="X-Ray">X-Ray</option>
                    <option value="MRI Scan">MRI Scan</option>
                    <option value="CT Scan">CT Scan</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Encrypt Medical Data */}
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                Encrypt Medical Data
              </h2>

              {/* Type Toggle */}
              <div className="flex gap-2 mb-5 p-1 bg-slate-900/50 rounded-lg">
                <button
                  onClick={() => setEncryptionType('image')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                    encryptionType === 'image'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="encrypt-type-image"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Image / File
                </button>
                <button
                  onClick={() => setEncryptionType('text')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                    encryptionType === 'text'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="encrypt-type-text"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Text
                </button>
              </div>

              {/* Image Upload */}
              {encryptionType === 'image' && (
                <div className="mb-5">
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="fileInput"
                    className="block p-10 rounded-xl bg-slate-900/50 border-2 border-dashed border-slate-600 text-center cursor-pointer group transition-all duration-300 dropzone-hover"
                  >
                    <div className="mb-3 group-hover:scale-105 transition-transform duration-300">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto group-hover:stroke-sky-400 transition-colors duration-300">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div className="text-sm font-medium mb-1 text-slate-300">
                      {selectedFile ? selectedFile.name : 'Click to select report file'}
                    </div>
                    <div className="text-xs text-slate-500">
                      Supported: Images, PDF (Max 10MB)
                    </div>
                  </label>
                </div>
              )}

              {/* Text Input */}
              {encryptionType === 'text' && (
                <div className="mb-5">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Medical Report Text
                  </label>
                  <textarea
                    value={textToEncrypt}
                    onChange={(e) => setTextToEncrypt(e.target.value)}
                    placeholder="Enter medical report text, notes, or prescription details..."
                    rows={6}
                    className="input-field text-sm resize-none"
                    id="text-to-encrypt"
                  />
                </div>
              )}

              <button
                onClick={handleEncrypt}
                disabled={loading}
                className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30"
                id="encrypt-btn"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Encrypting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Encrypt {encryptionType === 'image' ? 'Report' : 'Text'}
                  </span>
                )}
              </button>
            </div>

            {/* Result */}
            {masterKey && (
              <div className="card p-6 border-emerald-500/30 bg-emerald-500/5 animate-slide-up">
                <h2 className="text-lg font-bold mb-5 text-emerald-400 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  Encryption Complete
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Master Key (Share with Patient)
                    </label>
                    <div className="flex gap-2">
                      <code className="flex-1 px-4 py-3 text-sm rounded-lg bg-slate-900/60 border border-emerald-500/20 font-mono break-all text-emerald-300">
                        {masterKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(masterKey)}
                        className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                        id="copy-key-btn"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => sendKeyViaEmail(patientInfo.email, masterKey)}
                      className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
                      id="send-email-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Send via Email
                    </button>
                    <button
                      onClick={() => {
                        const text = `Master Key for ${patientInfo.name}: ${masterKey}`
                        copyToClipboard(text)
                      }}
                      className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      id="copy-sms-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Copy for SMS
                    </button>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-700/50 space-y-2 text-xs text-slate-400">
                    <p>
                      <span className="text-slate-500">Encryption ID:</span>{' '}
                      <span className="text-slate-300 font-mono">{encryptionId}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">Patient:</span>{' '}
                      <span className="text-slate-300">{patientInfo.name} ({patientInfo.email})</span>
                    </p>
                    <p>
                      <span className="text-slate-500">Report Type:</span>{' '}
                      <span className="text-slate-300">{patientInfo.reportType}</span>
                    </p>
                    <p className="text-emerald-400 flex items-center gap-1.5 pt-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Report securely stored in cloud
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="card p-6 animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              Encryption History
            </h2>

            {historyLoading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading history...</p>
              </div>
            ) : encryptionHistory.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-40">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
                <p className="text-base font-medium text-slate-400">No encryption history yet</p>
                <p className="text-sm mt-1">Encrypted reports will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {encryptionHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-5 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                            {entry.encryptionType === 'image' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{entry.patientName}</h3>
                            <p className="text-xs text-slate-500">{entry.patientEmail}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500">Report Type</span>
                            <p className="font-medium text-slate-300 mt-0.5">{entry.reportType}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Type</span>
                            <p className="font-medium text-slate-300 mt-0.5 capitalize">{entry.encryptionType}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Timestamp</span>
                            <p className="font-medium text-slate-300 mt-0.5">{entry.timestamp}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">ID</span>
                            <p className="font-mono text-slate-300 mt-0.5 truncate">{entry.encryptionId}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => copyToClipboard(entry.masterKey)}
                          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-all duration-200 flex items-center gap-1.5"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                          Copy Key
                        </button>
                        <button
                          onClick={() => sendKeyViaEmail(entry.patientEmail, entry.masterKey)}
                          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-all duration-200 flex items-center gap-1.5"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          Email
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stat Cards */}
            <div className="grid md:grid-cols-4 gap-5">
              <div className="card p-6 text-center stat-card">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{encryptionHistory.length}</div>
                <div className="text-sm text-slate-400">Total Encryptions</div>
              </div>
              <div className="card p-6 text-center stat-card">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{encryptionHistory.filter(e => e.encryptionType === 'image').length}</div>
                <div className="text-sm text-slate-400">Image Reports</div>
              </div>
              <div className="card p-6 text-center stat-card">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{encryptionHistory.filter(e => e.encryptionType === 'text').length}</div>
                <div className="text-sm text-slate-400">Text Reports</div>
              </div>
              <div className="card p-6 text-center stat-card">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{new Set(encryptionHistory.map(e => e.patientEmail)).size}</div>
                <div className="text-sm text-slate-400">Unique Patients</div>
              </div>
            </div>

            {/* Encryption Algorithm Pipeline */}
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-5 text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                Encryption Algorithm Pipeline
              </h3>
              <p className="text-sm text-slate-400 mb-5">Each chunk of data passes through a 4-layer DNA-based encryption pipeline using SHA-256 seeded keys.</p>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { step: '1', title: 'DNA Encoding', desc: 'Binary data mapped to DNA bases (A, T, C, G) using PRNG-shuffled mapping per chunk.', color: '#0ea5e9' },
                  { step: '2', title: 'DNA XOR', desc: 'XOR operation with a pseudo-random DNA key sequence generated from master key.', color: '#06b6d4' },
                  { step: '3', title: 'DNA Complement', desc: 'Complement transformation applied: A to T, T to A, C to G, G to C.', color: '#8b5cf6' },
                  { step: '4', title: 'DNA Permutation', desc: 'Sequence positions shuffled using a seeded PRNG permutation array.', color: '#10b981' },
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

            {/* Report Type Distribution */}
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-5 text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                </div>
                Report Type Distribution
              </h3>
              {encryptionHistory.length === 0 ? (
                <p className="text-sm text-slate-500">No data available yet. Encrypt a report to see distribution.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(
                    encryptionHistory.reduce((acc, e) => {
                      acc[e.reportType] = (acc[e.reportType] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).sort((a, b) => b[1] - a[1]).map(([type, count], i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-300">{type}</span>
                        <span className="text-slate-400 font-mono text-xs">{count} / {encryptionHistory.length}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${(count / encryptionHistory.length) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Information */}
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-5 text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                Security Information
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { text: '4-layer DNA-based encryption active', detail: 'Encode, XOR, Complement, Permute' },
                  { text: '24-character cryptographic keys', detail: 'CSPRNG with 70+ character pool' },
                  { text: 'Cloud storage with Supabase', detail: 'PostgreSQL with row-level security' },
                  { text: 'No permutation indices stored', detail: 'Regenerated from key during decryption' },
                  { text: 'HIPAA-compliant encryption', detail: 'End-to-end encrypted data pipeline' },
                  { text: 'SHA-256 seeded key derivation', detail: 'Unique key per chunk per layer' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm p-3 rounded-lg bg-slate-900/30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <div>
                      <span className="text-slate-200">{item.text}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
              Are you sure you want to logout? Any unsaved encryption data will be lost.
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
