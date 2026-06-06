import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../api/client'
import i18n from '../i18n'
import { useAuth } from '../hooks/useAuth'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'uk', label: 'Українська' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
]

function GlobeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
      <path d="M4.93 6.5h14.14" />
      <path d="M4.93 17.5h14.14" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const changeLocale = useMutation({
    mutationFn: async (locale: string) => {
      await api.put('/auth/profile', { locale })
    },
  })

  const currentLang = i18n.language?.startsWith('uk') ? 'uk' : i18n.language?.substring(0, 2) ?? 'en'
  const currentLabel = languages.find((l) => l.code === currentLang)?.label ?? 'English'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code)
    if (user) {
      changeLocale.mutate(code)
    }
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
      >
        <GlobeIcon />
        <span>{currentLabel}</span>
        <ChevronIcon open={open} />
      </button>

      <div
        className={`absolute right-0 mt-1 w-40 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg transition-all duration-200 z-50 ${
          open
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <ul className="py-1">
          {languages.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => handleSelect(l.code)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  l.code === currentLang
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
