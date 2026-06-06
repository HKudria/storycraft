import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../api/client'
import i18n from '../i18n'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'uk', label: 'Українська' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
]

interface Props {
  left?: React.ReactNode
  right?: React.ReactNode
}

export function AppHeader({ left, right }: Props) {
  const { user, logout, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const changeLocale = useMutation({
    mutationFn: async (locale: string) => {
      await api.put('/auth/profile', { locale })
    },
  })

  const currentLang = i18n.language?.startsWith('uk') ? 'uk' : i18n.language?.substring(0, 2) ?? 'en'
  const currentLabel = languages.find((l) => l.code === currentLang)?.label ?? 'English'

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code)
    if (isAuthenticated) changeLocale.mutate(code)
  }

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {left ?? (
            <Link to="/dashboard" className="text-xl font-bold text-gray-900 truncate">
              {t('app.name')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {right}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div ref={menuRef} className="absolute right-4 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            {user && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded capitalize">{user.plan}</span>
                      {user.booksLimit != null && (
                        <span className="text-xs text-gray-400">
                          {t('dashboard.booksUsed', { used: user.booksUsed, limit: user.booksLimit >= 999 ? '∞' : user.booksLimit })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t('common.language')}</p>
              <div className="grid grid-cols-2 gap-1">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { handleLanguageChange(l.code); setMenuOpen(false) }}
                    className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      currentLang === l.code
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {isAuthenticated && (
              <div className="p-2">
                <button
                  onClick={() => { setMenuOpen(false); logout() }}
                  className="w-full px-3 py-2 text-sm text-left rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('common.logout')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  )
}
