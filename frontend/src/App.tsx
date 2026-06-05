import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth.tsx'
import { AuthGuard } from './components/AuthGuard'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ChildrenPage } from './pages/ChildrenPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { NewBookPage } from './pages/NewBookPage'

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
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
            <Route path="/dashboard/children" element={<AuthGuard><ChildrenPage /></AuthGuard>} />
            <Route path="/books/new" element={<AuthGuard><NewBookPage /></AuthGuard>} />
            <Route path="/books/:id" element={<AuthGuard><BookDetailPage /></AuthGuard>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
