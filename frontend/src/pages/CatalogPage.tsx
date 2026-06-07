import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '../components/AppHeader'
import { StarRating } from '../components/StarRating'
import { useCatalogBooks } from '../api/catalog'
import { useTemplates } from '../api/templates'

const LANGUAGES = ['en', 'pl', 'ua', 'ru', 'de', 'fr']

export function CatalogPage() {
  const { t } = useTranslation()
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [language, setLanguage] = useState<string | null>(null)
  const [minRating, setMinRating] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const { data: templates } = useTemplates()
  const { data, isLoading } = useCatalogBooks({ templateId, language, minRating, page })

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0

  return (
    <div className="min-h-screen bg-cream-50">
      <AppHeader
        right={
          <Link to="/dashboard" className="text-sm text-warm-700 hover:text-warm-700/80 font-medium">
            {t('catalog.dashboard')}
          </Link>
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold gradient-brand mb-2">{t('catalog.title')}</h1>
        <p className="text-midnight/50 mb-6">{t('catalog.subtitle')}</p>

        {/* Filters */}
        <div className="space-y-3 mb-8">
          {templates && templates.length > 0 && (
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm text-midnight/50 py-1 mr-1">{t('catalog.filterTemplate')}:</span>
              <button
                onClick={() => { setTemplateId(null); setPage(1) }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${templateId === null ? 'bg-warm-700 text-white shadow-warm' : 'bg-cream-100 text-midnight/60 hover:bg-cream-200'}`}
              >
                {t('common.all')}
              </button>
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => { setTemplateId(tmpl.id); setPage(1) }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${templateId === tmpl.id ? 'bg-warm-700 text-white shadow-warm' : 'bg-cream-100 text-midnight/60 hover:bg-cream-200'}`}
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm text-midnight/50 py-1 mr-1">{t('catalog.filterLanguage')}:</span>
            <button
              onClick={() => { setLanguage(null); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${language === null ? 'bg-warm-700 text-white shadow-warm' : 'bg-cream-100 text-midnight/60 hover:bg-cream-200'}`}
            >
              {t('common.all')}
            </button>
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => { setLanguage(lang); setPage(1) }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${language === lang ? 'bg-warm-700 text-white shadow-warm' : 'bg-cream-100 text-midnight/60 hover:bg-cream-200'}`}
              >
                {t(`languages.${lang === 'ua' ? 'ua' : lang}`)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm text-midnight/50 py-1 mr-1">{t('catalog.filterRating')}:</span>
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => { setMinRating(minRating === r ? null : r); setPage(1) }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${minRating === r ? 'bg-warm-700 text-white shadow-warm' : 'bg-cream-100 text-midnight/60 hover:bg-cream-200'}`}
              >
                {r}+
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-warm-700" />
          </div>
        ) : data && data.books.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.books.map((book) => (
                <Link key={book.id} to={`/catalog/${book.id}`} className="rounded-2xl overflow-hidden card-hover block group">
                  {book.coverImageUrl ? (
                    <div className="relative aspect-video overflow-hidden">
                      <img src={book.coverImageUrl} alt={book.title ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-semibold text-white text-lg line-clamp-1 drop-shadow-lg">{book.title}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-cream-200 flex items-center justify-center text-midnight/20 text-5xl">&#x1F4D6;</div>
                  )}
                  <div className="bg-white p-4">
                    {!book.coverImageUrl && (
                      <h3 className="font-semibold text-midnight line-clamp-1 mb-1">{book.title}</h3>
                    )}
                    <div className="mt-1">
                      <StarRating rating={book.averageRating} ratingCount={book.ratingCount} />
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-midnight/50">
                      {book.templateTitle && (
                        <span className="bg-cream-100 px-2 py-0.5 rounded-full">{book.templateTitle}</span>
                      )}
                      <span className="uppercase font-medium">{book.language}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-5 py-2.5 text-sm bg-white border border-cream-200 rounded-full hover:bg-cream-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-midnight/70"
                >
                  {t('catalog.previous')}
                </button>
                <span className="gradient-btn text-white px-4 py-2 rounded-full text-sm font-bold">
                  {t('catalog.page', { page, total: totalPages })}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-5 py-2.5 text-sm bg-white border border-cream-200 rounded-full hover:bg-cream-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-midnight/70"
                >
                  {t('catalog.next')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center shadow-warm">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-midnight/50 text-lg">{t('catalog.noBooks')}</p>
          </div>
        )}
      </main>
    </div>
  )
}
