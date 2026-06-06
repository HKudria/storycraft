import { useMutation } from '@tanstack/react-query'
import api from '../api/client'
import i18n from '../i18n'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'uk', label: 'Українська' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
]

export function LanguageSwitcher() {
  const { user } = useAuth()
  const changeLocale = useMutation({
    mutationFn: async (locale: string) => {
      await api.put('/auth/profile', { locale })
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = e.target.value
    i18n.changeLanguage(locale)
    if (user) {
      changeLocale.mutate(locale)
    }
  }

  // Map i18n language codes: 'uk' is Ukrainian in i18n, but some systems might use 'ua'
  const currentLang = i18n.language?.startsWith('uk') ? 'uk' : i18n.language?.substring(0, 2) ?? 'en'

  return (
    <select
      value={currentLang}
      onChange={handleChange}
      className="text-sm border rounded px-2 py-1 bg-white"
    >
      {languages.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  )
}
