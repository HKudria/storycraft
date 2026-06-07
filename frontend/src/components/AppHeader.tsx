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

const planColors: Record<string, string> = {
  free: 'bg-ocean-400 text-white',
  basic: 'bg-sunny-400 text-white',
  pro: 'bg-warm-700 text-white',
}

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
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-warm-100/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {left ?? (
            <Link to="/dashboard" className="text-xl font-extrabold gradient-brand truncate">
              {t('app.name')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/catalog" className="text-sm font-semibold text-midnight/60 hover:text-warm-700 transition-colors">
            {t('catalog.title')}
          </Link>

          {!isAuthenticated && (
            <Link to="/login" className="gradient-btn px-4 py-1.5 text-white rounded-full text-sm font-semibold">
              {t('auth.login')}
            </Link>
          )}

          {right}

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                menuOpen
                  ? 'bg-warm-700 text-white shadow-warm'
                  : 'bg-warm-100 text-warm-700 hover:bg-warm-500 hover:text-white'
              }`}
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-warm border border-warm-100 z-50 overflow-hidden animate-bounce-in">
                  {user && (
                    <div className="px-4 py-3 border-b border-cream-200 bg-cream-50">
                      <p className="text-sm font-semibold text-midnight truncate">{user.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${planColors[user.plan] || 'bg-gray-200 text-gray-700'}`}>
                          {user.plan}
                        </span>
                        {user.booksLimit != null && (
                          <span className="text-xs text-warm-700/60">
                            {t('dashboard.booksUsed', { used: user.booksUsed, limit: user.booksLimit >= 999 ? '∞' : user.booksLimit })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-3 border-b border-cream-200">
                    <p className="text-xs text-warm-700/40 uppercase tracking-wider mb-2 font-semibold">{t('common.language')}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {languages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { handleLanguageChange(l.code); setMenuOpen(false) }}
                          className={`px-3 py-2 rounded-xl text-sm text-left transition-all duration-150 ${
                            currentLang === l.code
                              ? 'bg-warm-100 text-warm-700 font-semibold'
                              : 'text-midnight/60 hover:bg-cream-100'
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
                        className="w-full px-3 py-2 text-sm text-left rounded-xl text-candy-500 hover:bg-candy-400/10 transition-colors duration-150 flex items-center gap-2 font-semibold"
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
          </div>
        </div>
      </div>
    </header>
  )
}
