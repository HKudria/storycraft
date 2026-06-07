import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './hooks/useAuth.tsx'
import { AuthGuard } from './components/AuthGuard'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ChildrenPage } from './pages/ChildrenPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { NewBookPage } from './pages/NewBookPage'
import { BookDetailPage } from './pages/BookDetailPage'
import { PricingPage } from './pages/PricingPage'
import { BillingPage } from './pages/BillingPage'
import { ReferralsPage } from './pages/ReferralsPage'
import { CatalogPage } from './pages/CatalogPage'
import { PublicBookPage } from './pages/PublicBookPage'
import { syncSubscription } from './api/subscription'

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
      localStorage.removeItem('referral_code')
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

function BillingSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginWithToken } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    (async () => {
      await loginWithToken(localStorage.getItem('accessToken') || '')
      await syncSubscription(searchParams.get('session_id') ?? undefined)
      navigate('/dashboard/billing', { replace: true })
    })()
  }, [navigate, loginWithToken, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">{t('app.updatingPlan')}</h2>
        <p className="text-gray-500 mt-2">{t('app.redirectMessage')}</p>
      </div>
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
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/billing/success" element={<AuthGuard><BillingSuccessPage /></AuthGuard>} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/:id" element={<PublicBookPage />} />
            <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
            <Route path="/dashboard/children" element={<AuthGuard><ChildrenPage /></AuthGuard>} />
            <Route path="/dashboard/billing" element={<AuthGuard><BillingPage /></AuthGuard>} />
            <Route path="/dashboard/referrals" element={<AuthGuard><ReferralsPage /></AuthGuard>} />
            <Route path="/books/new" element={<AuthGuard><NewBookPage /></AuthGuard>} />
            <Route path="/books/:id" element={<AuthGuard><BookDetailPage /></AuthGuard>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
