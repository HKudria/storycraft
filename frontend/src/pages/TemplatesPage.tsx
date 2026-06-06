import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTemplates } from '../api/templates'
import { TemplateCard } from '../components/TemplateCard'

export function TemplatesPage() {
  const [category, setCategory] = useState<string>('')
  const { data: templates, isLoading } = useTemplates(category ? { category } : undefined)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const categories = useMemo(() => {
    if (!templates) return []
    const cats = new Set(templates.map((tpl) => tpl.category))
    return Array.from(cats).sort()
  }, [templates])

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">{t('common.loading')}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900">{t('app.name')}</a>
          <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">{t('templates.dashboard')}</a>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('templates.title')}</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setCategory('')} className={`px-3 py-1 rounded-full text-sm ${!category ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>
            {t('common.all')}
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1 rounded-full text-sm capitalize ${category === cat ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} onSelect={(tpl) => navigate(`/books/new?templateId=${tpl.id}`)} />
          ))}
        </div>
      </main>
    </div>
  )
}
