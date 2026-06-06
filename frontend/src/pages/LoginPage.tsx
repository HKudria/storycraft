import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth.tsx'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import api from '../api/client'

export function LoginPage() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isDev = import.meta.env.DEV

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDevLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/dev-login')
      loginWithToken(data.accessToken)
      navigate('/dashboard')
    } catch {
      setError(t('auth.devLoginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('app.name')}</h1>

        <a
          href="/api/auth/google"
          className="block w-full px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50"
        >
          {t('auth.continueWithGoogle')}
        </a>

        {isDev && (
          <button
            onClick={handleDevLogin}
            disabled={loading}
            className="mt-4 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? t('auth.loggingIn') : t('auth.devLogin')}
          </button>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
