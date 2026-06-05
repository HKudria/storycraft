import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth.tsx'
import { AuthGuard } from './components/AuthGuard'
import { LoginPage } from './pages/LoginPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      loginWithToken(token)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, loginWithToken])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  )
}

function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">StoryCraft</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full capitalize">{user?.plan}</span>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">Welcome to StoryCraft</p>
      </main>
    </div>
  )
}

function BookDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900">Book Details</h1>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
            <Route path="/books/:id" element={<AuthGuard><BookDetailPage /></AuthGuard>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
