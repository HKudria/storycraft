import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/client'
import { useBook, useDeleteBook, useToggleVisibility, useRatings, useSubmitRating } from '../api/books'
import { AppHeader } from '../components/AppHeader'
import { StarRating } from '../components/StarRating'

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: book, isLoading, error } = useBook(id ? Number(id) : null)
  const deleteBook = useDeleteBook()
  const toggleVisibility = useToggleVisibility()
  const { data: ratings } = useRatings(id ? Number(id) : null)
  const submitRating = useSubmitRating()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [selectedScore, setSelectedScore] = useState(0)
  const [comment, setComment] = useState('')
  const [ratingSubmitted, setRatingSubmitted] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-warm-700" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-candy-500 mb-4 font-medium">{t('bookDetail.failedToLoad')}</p>
          <button onClick={() => navigate('/dashboard')} className="text-warm-700 hover:text-warm-700/80 font-medium">{t('bookDetail.backToDashboard')}</button>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm(t('bookDetail.deleteBook'))) return
    await deleteBook.mutateAsync(book.id)
    navigate('/dashboard')
  }

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      const { data } = await api.get<{ url: string }>(`/books/${book.id}/download`)
      setPdfUrl(data.url)
      window.open(data.url, '_blank')
    } catch {
      alert(t('bookDetail.pdfNotReady'))
    } finally {
      setPdfLoading(false)
    }
  }

  const hasImages = book.pages?.some((p) => p.imageUrl)
  const hasAllImages = book.pages?.every((p) => p.imageUrl)

  return (
    <div className="min-h-screen bg-cream-50">
      <AppHeader
        left={
          <>
            <button onClick={() => navigate('/dashboard')} className="text-midnight/50 hover:text-midnight transition-colors">{t('common.back')}</button>
            <h1 className="text-xl font-bold text-midnight truncate">{book.title || book.topic}</h1>
          </>
        }
        right={
          <>
            {book.status === 'done' && (
              <button onClick={handleDownloadPdf} disabled={pdfLoading} className="text-sm gradient-btn text-white px-5 py-2 rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity font-medium">
                {pdfLoading ? t('common.loading') : t('bookDetail.downloadPdf')}
              </button>
            )}
            <button onClick={handleDelete} className="text-sm text-candy-500 hover:bg-candy-400/10 px-3 py-1.5 rounded-full transition-colors font-medium">{t('common.delete')}</button>
          </>
        }
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <StatusBanner status={book.status} hasImages={hasImages ?? false} hasAllImages={hasAllImages ?? false} />

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-2xl border border-cream-200 p-4">
            <span className="text-midnight/50 text-xs uppercase tracking-wide">{t('bookDetail.childLabel')}</span>
            <p className="font-semibold text-midnight mt-1">{book.childName}</p>
          </div>
          <div className="bg-white rounded-2xl border border-cream-200 p-4">
            <span className="text-midnight/50 text-xs uppercase tracking-wide">{t('bookDetail.templateLabel')}</span>
            <p className="font-semibold text-midnight mt-1">{book.templateTitle}</p>
          </div>
          <div className="bg-white rounded-2xl border border-cream-200 p-4">
            <span className="text-midnight/50 text-xs uppercase tracking-wide">{t('bookDetail.languageLabel')}</span>
            <p className="font-semibold text-midnight mt-1">{book.language.toUpperCase()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-cream-200 p-4">
            <span className="text-midnight/50 text-xs uppercase tracking-wide">{t('bookDetail.createdLabel')}</span>
            <p className="font-semibold text-midnight mt-1">{new Date(book.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {book.pages && book.pages.length > 0 && (
          <div className="mt-8 space-y-6">
            <h2 className="text-lg font-bold text-midnight">{t('bookDetail.pages')}</h2>
            {book.pages.map((page) => (
              <div key={page.id} className="bg-white rounded-2xl border border-cream-200 overflow-hidden card-hover">
                {page.imageUrl && (
                  <img src={page.imageUrl} alt={t('bookDetail.page', { num: page.pageNumber })} className="w-full max-h-96 object-contain bg-cream-50" />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium bg-cream-100 text-midnight/60 px-2.5 py-0.5 rounded-full">{t('bookDetail.page', { num: page.pageNumber })}</span>
                    {!page.imageUrl && page.imagePrompt && (
                      <span className="text-xs text-sunny-500 bg-sunny-400/10 px-2.5 py-0.5 rounded-full font-medium">{t('bookDetail.illustrationPending')}</span>
                    )}
                  </div>
                  {page.text && <p className="text-midnight/80 whitespace-pre-wrap leading-relaxed">{page.text}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visibility & Ratings (done books only) */}
        {book.status === 'done' && (
          <div className="mt-8 space-y-6">
            {/* Visibility toggle */}
            <div className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-lg font-bold text-midnight mb-3">{t('bookCard.visibility')}</h2>
              <button
                onClick={() => toggleVisibility.mutate(book.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${book.isPublic ? 'bg-ocean-400/20 text-ocean-600 hover:bg-ocean-400/30' : 'bg-cream-100 text-midnight/40 hover:bg-cream-200'}`}
              >
                {book.isPublic ? t('bookCard.makePrivate') : t('bookCard.makePublic')}
              </button>
              {book.isPublic && (
                <p className="text-xs text-midnight/50 mt-2">{t('bookCard.publicNotice')}</p>
              )}
            </div>

            {/* Rating section */}
            <div className="bg-white rounded-2xl border border-cream-200 p-6">
              <h2 className="text-lg font-bold text-midnight mb-4">{t('ratings.title')}</h2>

              {book.averageRating != null && (
                <div className="mb-4">
                  <StarRating rating={book.averageRating} ratingCount={book.ratingCount} size="md" />
                </div>
              )}

              {!ratingSubmitted && !ratings?.length && (
                <div className="mb-4 p-5 bg-cream-50 rounded-2xl">
                  <p className="text-sm font-medium text-midnight/70 mb-2">{t('ratings.submitRating')}</p>
                  <div className="mb-3">
                    <StarRating rating={selectedScore} interactive size="md" onRate={setSelectedScore} />
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('ratings.addComment')}
                    className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm resize-none h-20 mb-3 focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500"
                  />
                  <button
                    onClick={() => {
                      if (selectedScore > 0) {
                        submitRating.mutate(
                          { bookId: book.id, score: selectedScore, comment: comment || undefined },
                          { onSuccess: () => setRatingSubmitted(true) },
                        )
                      }
                    }}
                    disabled={selectedScore === 0 || submitRating.isPending}
                    className="px-5 py-2.5 gradient-btn text-white rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {submitRating.isPending ? t('common.saving') : t('ratings.submit')}
                  </button>
                </div>
              )}

              {ratingSubmitted && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-400/10 to-emerald-400/10 text-green-700 rounded-2xl text-sm font-medium">
                  {t('ratings.ratingSubmitted')}
                </div>
              )}

              {ratings && ratings.length > 0 && (
                <div className="space-y-3">
                  {ratings.map((r) => (
                    <div key={r.id} className="border-b border-cream-200 pb-3 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-midnight">{r.userName}</span>
                        <StarRating rating={r.score} />
                      </div>
                      {r.comment && <p className="text-sm text-midnight/60 mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function StatusBanner({ status, hasImages, hasAllImages }: { status: string; hasImages: boolean; hasAllImages: boolean }) {
  const { t } = useTranslation()

  if (status === 'pending') {
    return (
      <div className="bg-gradient-to-r from-sunny-400/20 to-sunny-300/20 border border-sunny-400/30 rounded-2xl p-4 flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sunny-500" />
        <p className="text-sunny-500 font-medium">{t('bookDetail.statusPending')}</p>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div className="bg-gradient-to-r from-blue-400/20 to-indigo-400/20 border border-blue-400/30 rounded-2xl p-4 flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
        <p className="text-blue-600 font-medium">{t('bookDetail.statusProcessing')}</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="bg-gradient-to-r from-candy-400/20 to-candy-500/20 border border-candy-400/30 rounded-2xl p-4">
        <p className="text-candy-500 font-medium">{t('bookDetail.statusFailed')}</p>
      </div>
    )
  }

  if (status === 'done') {
    if (hasAllImages) {
      return (
        <div className="bg-gradient-to-r from-green-400/20 to-emerald-400/20 border border-green-400/30 rounded-2xl p-4">
          <p className="text-green-600 font-medium">{t('bookDetail.statusDoneWithImages')}</p>
        </div>
      )
    }

    if (hasImages) {
      return (
        <div className="bg-gradient-to-r from-blue-400/20 to-indigo-400/20 border border-blue-400/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          <p className="text-blue-600 font-medium">{t('bookDetail.statusDoneGenerating')}</p>
        </div>
      )
    }

    return (
      <div className="bg-gradient-to-r from-blue-400/20 to-indigo-400/20 border border-blue-400/30 rounded-2xl p-4 flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
        <p className="text-blue-600 font-medium">{t('bookDetail.statusDoneStarting')}</p>
      </div>
    )
  }

  return null
}
