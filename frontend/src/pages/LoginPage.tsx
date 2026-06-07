import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth.tsx'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import api from '../api/client'

export function LoginPage() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const isDev = import.meta.env.VITE_APP_ENV === 'dev'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Capture referral code from URL and persist to localStorage
  const refFromUrl = searchParams.get('ref')
  if (refFromUrl) {
    localStorage.setItem('referral_code', refFromUrl)
  }

  const storedRef = refFromUrl || localStorage.getItem('referral_code')
  const googleHref = storedRef
    ? `/api/auth/google?ref=${encodeURIComponent(storedRef)}`
    : '/api/auth/google'

  const handleDevLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const ref = localStorage.getItem('referral_code')
      const { data } = await api.post('/auth/dev-login', ref ? { ref } : undefined)
      loginWithToken(data.accessToken)
      localStorage.removeItem('referral_code')
      navigate('/dashboard')
    } catch {
      setError(t('auth.devLoginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Decorative panel */}
      <div className="gradient-bg relative overflow-hidden flex flex-col items-center justify-center px-8 py-12 md:w-1/2 md:min-h-screen">
        <div className="absolute top-10 left-10 text-6xl animate-float opacity-20">📖</div>
        <div className="absolute top-1/4 right-12 text-5xl animate-float-delay opacity-20">✨</div>
        <div className="absolute bottom-20 left-1/4 text-5xl animate-float opacity-15">🌟</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-float-delay opacity-20">🎨</div>

        <div className="relative z-10 text-center text-white max-w-md">
          <div className="text-7xl mb-6">📚</div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{t('app.name')}</h2>
          <p className="text-lg text-white/80 font-medium">{t('auth.tagline')}</p>
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(251,191,36,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(192,132,252,0.2),transparent_50%)]" />
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream-50">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-extrabold gradient-brand mb-2 md:hidden">{t('app.name')}</h1>
          <p className="text-midnight/60 mb-8 md:hidden">{t('auth.tagline')}</p>

          <div className="bg-white rounded-2xl shadow-warm p-8">
            <h2 className="text-xl font-bold text-midnight mb-6">{t('auth.welcome')}</h2>

            <a
              href={googleHref}
              className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white border-2 border-cream-200 rounded-full text-midnight font-semibold hover:border-warm-500 hover:shadow-warm transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t('auth.continueWithGoogle')}
            </a>

            {isDev && (
              <button
                onClick={handleDevLogin}
                disabled={loading}
                className="mt-4 w-full px-6 py-3 gradient-btn text-white rounded-full font-semibold disabled:opacity-50"
              >
                {loading ? t('auth.loggingIn') : t('auth.devLogin')}
              </button>
            )}

            {error && <p className="mt-4 text-sm text-candy-500 font-medium">{error}</p>}
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <LanguageSwitcher />
            <Link to="/catalog" className="text-sm text-warm-700 hover:text-warm-800 font-medium">
              📚 {t('auth.browseCatalog')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
