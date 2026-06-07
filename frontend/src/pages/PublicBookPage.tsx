import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '../components/AppHeader'
import { StarRating } from '../components/StarRating'
import { usePublicBook } from '../api/catalog'
import { useRatings, useSubmitRating } from '../api/books'
import { useAuth } from '../hooks/useAuth'

export function PublicBookPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const bookId = id ? parseInt(id, 10) : null

  const { data: book, isLoading, error } = usePublicBook(bookId)
  const { data: ratings } = useRatings(bookId)
  const submitRating = useSubmitRating()

  const [selectedScore, setSelectedScore] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const hasRated = ratings?.some((r) => r.userName === user?.name)

  const handleSubmitRating = () => {
    if (!bookId || selectedScore === 0) return
    submitRating.mutate(
      { bookId, score: selectedScore, comment: comment || undefined },
      { onSuccess: () => setSubmitted(true) },
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-warm-700" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-cream-50 flex justify-center items-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-midnight/50 mb-3">{t('bookDetail.failedToLoad')}</p>
          <Link to="/catalog" className="text-warm-700 hover:text-warm-700/80 font-medium">{t('catalog.backToCatalog')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <AppHeader
        left={
          <>
            <button onClick={() => navigate('/catalog')} className="text-midnight/50 hover:text-midnight transition-colors">
              {t('common.back')}
            </button>
            <h1 className="text-xl font-bold text-midnight">{book.title ?? book.topic}</h1>
          </>
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Metadata */}
        <div className="bg-white rounded-2xl border border-cream-200 p-6 mb-6 shadow-warm">
          <div className="grid grid-cols-2 gap-5">
            {book.templateTitle && (
              <div>
                <p className="text-xs text-midnight/50 uppercase tracking-wide">{t('bookDetail.templateLabel')}</p>
                <p className="text-sm font-semibold text-midnight mt-1">{book.templateTitle}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-midnight/50 uppercase tracking-wide">{t('bookDetail.languageLabel')}</p>
              <p className="text-sm font-semibold text-midnight mt-1">{book.language.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-midnight/50 uppercase tracking-wide">{t('ratings.title')}</p>
              <div className="mt-1">
                <StarRating rating={book.averageRating ?? null} ratingCount={book.ratingCount} size="md" />
              </div>
            </div>
            <div>
              <p className="text-xs text-midnight/50 uppercase tracking-wide">{t('bookDetail.createdLabel')}</p>
              <p className="text-sm font-semibold text-midnight mt-1">{new Date(book.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Pages */}
        <div className="space-y-6 mb-8">
          {book.pages?.map((page) => (
            <div key={page.id} className="bg-white rounded-2xl border border-cream-200 p-6 shadow-warm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium bg-cream-100 text-midnight/60 px-3 py-0.5 rounded-full">
                  {t('bookDetail.page', { num: page.pageNumber })}
                </span>
              </div>
              {page.imageUrl && (
                <img
                  src={page.imageUrl}
                  alt=""
                  className="w-full max-h-96 object-contain bg-cream-50 rounded-xl mb-4"
                />
              )}
              {page.text && (
                <p className="text-midnight/80 whitespace-pre-wrap leading-relaxed text-[15px]">{page.text}</p>
              )}
            </div>
          ))}
        </div>

        {/* Ratings section */}
        <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-warm">
          <h2 className="text-lg font-bold text-midnight mb-4">{t('ratings.title')}</h2>

          {/* Submit rating (owner only) */}
          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-cream-50 rounded-2xl text-center">
              <p className="text-sm text-midnight/50">{t('ratings.loginToRate')} <Link to="/login" className="text-warm-700 font-semibold hover:underline">{t('auth.continueWithGoogle')}</Link></p>
            </div>
          )}
          {isAuthenticated && !hasRated && !submitted && (
            <div className="mb-6 p-5 bg-cream-50 rounded-2xl">
              <p className="text-sm font-medium text-midnight/70 mb-3">{t('ratings.submitRating')}</p>
              <div className="mb-3">
                <StarRating
                  rating={selectedScore}
                  interactive
                  size="md"
                  onRate={setSelectedScore}
                />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('ratings.addComment')}
                className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm resize-none h-20 mb-3 focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500"
              />
              <button
                onClick={handleSubmitRating}
                disabled={selectedScore === 0 || submitRating.isPending}
                className="px-5 py-2.5 gradient-btn text-white rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submitRating.isPending ? t('common.saving') : t('ratings.submit')}
              </button>
            </div>
          )}

          {submitted && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-400/10 to-emerald-400/10 text-green-700 rounded-2xl text-sm font-medium">
              {t('ratings.ratingSubmitted')}
            </div>
          )}

          {/* Rating list */}
          {ratings && ratings.length > 0 ? (
            <div className="space-y-0">
              {ratings.map((rating) => (
                <div key={rating.id} className="flex items-start gap-3 py-3 border-b border-cream-200 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-midnight">{rating.userName}</span>
                      <StarRating rating={rating.score} />
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-midnight/60 mt-1">{rating.comment}</p>
                    )}
                    <p className="text-xs text-midnight/30 mt-1">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-midnight/50">{t('ratings.noRatings')}</p>
          )}
        </div>
      </main>
    </div>
  )
}
