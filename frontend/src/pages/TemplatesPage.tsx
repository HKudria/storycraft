import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTemplates } from '../api/templates'
import { TemplateCard } from '../components/TemplateCard'
import { AppHeader } from '../components/AppHeader'

const categoryKey: Record<string, string> = {
  'adventure': 'templates.categoryAdventure',
  'bedtime': 'templates.categoryBedtime',
  'educational': 'templates.categoryEducational',
  'fantasy': 'templates.categoryFantasy',
  'sci-fi': 'templates.categorySciFi',
  'nature': 'templates.categoryNature',
}

const categoryColors: Record<string, string> = {
  adventure: '#F97316',
  bedtime: '#818CF8',
  educational: '#14B8A6',
  fantasy: '#C084FC',
  'sci-fi': '#3B82F6',
  nature: '#22C55E',
}

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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-midnight/50">{t('common.loading')}</div>

  return (
    <div className="min-h-screen bg-cream-50">
      <AppHeader right={<a href="/dashboard" className="text-sm text-midnight/50 hover:text-midnight font-medium transition-colors">{t('templates.dashboard')}</a>} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-midnight mb-6">{t('templates.title')}</h1>

        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!category ? 'bg-warm-700 text-white shadow-warm' : 'bg-cream-100 text-midnight/60 hover:bg-cream-200'}`}
          >
            {t('common.all')}
          </button>
          {categories.map((cat) => {
            const color = categoryColors[cat] || '#7C3AED'
            const isActive = category === cat
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={isActive
                  ? { backgroundColor: color, color: '#fff', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.15)' }
                  : { backgroundColor: 'var(--color-cream-100, #FFF7ED)', color: 'rgba(30,27,75,0.6)' }
                }
                onMouseEnter={(e) => { if (!isActive) (e.target as HTMLElement).style.backgroundColor = 'var(--color-cream-200, #FEEBC8)' }}
                onMouseLeave={(e) => { if (!isActive) (e.target as HTMLElement).style.backgroundColor = 'var(--color-cream-100, #FFF7ED)' }}
              >
                {t(categoryKey[cat] || cat)}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates?.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} onSelect={(tpl) => navigate(`/books/new?templateId=${tpl.id}`)} />
          ))}
        </div>
      </main>
    </div>
  )
}
