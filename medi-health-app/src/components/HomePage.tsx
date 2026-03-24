interface HomePageProps {
  onNavigate: (page: 'home' | 'login' | 'doctor' | 'patient') => void
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-slate-900 page-enter">
      {/* Header */}
      <header className="border-b border-slate-800 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L12 22"/>
                <path d="M2 7h20"/>
                <path d="M2 17h20"/>
                <circle cx="7" cy="7" r="1.5" fill="white" stroke="none"/>
                <circle cx="17" cy="7" r="1.5" fill="white" stroke="none"/>
                <circle cx="7" cy="17" r="1.5" fill="white" stroke="none"/>
                <circle cx="17" cy="17" r="1.5" fill="white" stroke="none"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">Medi Health</span>
          </div>
          <button
            onClick={() => onNavigate('login')}
            className="btn-primary"
            id="header-signin-btn"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-6 hero-gradient grid-pattern overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-8 animate-fade-in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Enterprise-Grade Security
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight animate-slide-up">
            Secure Medical Records with{' '}
            <span className="gradient-text">DNA Cryptography</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Protect patient medical reports with advanced 4-layer DNA-based
            encryption. Built for healthcare providers who demand the highest
            level of data protection.
          </p>
          <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => onNavigate('login')}
              className="btn-primary text-lg px-8 py-3.5 rounded-xl"
              id="hero-get-started-btn"
            >
              Get Started
            </button>
            <a
              href="#features"
              className="btn-ghost text-lg px-8 py-3.5 rounded-xl border border-slate-700"
              id="hero-learn-more-btn"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sky-400 font-semibold text-sm uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose Medi Health
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A comprehensive encryption platform designed specifically for the healthcare industry.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card card-hover p-8 text-center group">
              <div className="w-14 h-14 bg-sky-500/10 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:bg-sky-500/20 transition-colors duration-300">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                DNA-Based Encryption
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                4-layer security using DNA sequences, XOR operations, complement transformations, and permutations.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="card card-hover p-8 text-center group">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:bg-cyan-500/20 transition-colors duration-300">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Cloud Storage
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Encrypted data stored securely in the cloud with Supabase. Access your records from anywhere, anytime.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="card card-hover p-8 text-center group">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:bg-emerald-500/20 transition-colors duration-300">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Healthcare Focused
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Purpose-built for doctors and patients with role-based portals and HIPAA-compliant workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sky-400 font-semibold text-sm uppercase tracking-wider mb-3">Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Three simple steps to secure and share medical records.
            </p>
          </div>
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6 items-start card p-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-sky-500/20">
                1
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg mb-1">Doctor Encrypts Report</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  The healthcare provider uploads the medical report. The system generates a
                  cryptographically secure 24-character master key and encrypts the data
                  using DNA-based algorithms.
                </p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex gap-6 items-start card p-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-cyan-500/20">
                2
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg mb-1">Share Master Key</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  The doctor securely shares the master key with the patient via email or
                  other secure communication channels. Only the key holder can decrypt the
                  data.
                </p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex gap-6 items-start card p-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/20">
                3
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg mb-1">Patient Decrypts</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  The patient enters the master key in the patient portal to decrypt and
                  view their medical report securely. Reports can also be downloaded locally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L12 22"/>
                  <path d="M2 7h20"/>
                  <path d="M2 17h20"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-400">Medi Health</span>
            </div>
            <p className="text-sm text-slate-500">
              2024 Medi Health. Secure DNA-based medical encryption system.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
