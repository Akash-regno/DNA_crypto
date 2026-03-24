import { useState, useEffect } from 'react'
import './App.css'
import HomePage from './components/HomePage'
import LoginPage from './components/LoginPage'
import DoctorPortal from './components/DoctorPortal'
import PatientPortal from './components/PatientPortal'

interface User {
  id: string
  name: string
  email: string
  role: 'doctor' | 'patient'
}

type Page = 'home' | 'login' | 'doctor' | 'patient'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('medi_health_user')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setCurrentPage(userData.role === 'doctor' ? 'doctor' : 'patient')
    }
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    localStorage.setItem('medi_health_user', JSON.stringify(userData))
    setCurrentPage(userData.role === 'doctor' ? 'doctor' : 'patient')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('medi_health_user')
    setCurrentPage('home')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} />
      case 'doctor':
        return <DoctorPortal user={user!} onLogout={handleLogout} />
      case 'patient':
        return <PatientPortal user={user!} onLogout={handleLogout} />
      default:
        return <HomePage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {renderPage()}
    </div>
  )
}

export default App
