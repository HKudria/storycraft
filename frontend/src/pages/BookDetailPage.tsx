import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/client'
import { useBook, useDeleteBook } from '../api/books'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: book, isLoading, error } = useBook(id ? Number(id) : null)
  const deleteBook = useDeleteBook()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('bookDetail.failedToLoad')}</p>
          <button onClick={() => navigate('/dashboard')} className="text-indigo-600 hover:text-indigo-800">{t('bookDetail.backToDashboard')}</button>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">{t('common.back')}</button>
            <h1 className="text-xl font-bold text-gray-900">{book.title || book.topic}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {book.status === 'done' && (
              <button onClick={handleDownloadPdf} disabled={pdfLoading} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {pdfLoading ? t('common.loading') : t('bookDetail.downloadPdf')}
              </button>
            )}
            <button onClick={handleDelete} className="text-sm text-red-600 hover:text-red-800">{t('common.delete')}</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <StatusBanner status={book.status} hasImages={hasImages ?? false} hasAllImages={hasAllImages ?? false} />

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg border p-3">
            <span className="text-gray-500">{t('bookDetail.childLabel')}</span>
            <p className="font-medium">{book.childName}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <span className="text-gray-500">{t('bookDetail.templateLabel')}</span>
            <p className="font-medium">{book.templateTitle}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <span className="text-gray-500">{t('bookDetail.languageLabel')}</span>
            <p className="font-medium">{book.language.toUpperCase()}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <span className="text-gray-500">{t('bookDetail.createdLabel')}</span>
            <p className="font-medium">{new Date(book.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {book.pages && book.pages.length > 0 && (
          <div className="mt-8 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('bookDetail.pages')}</h2>
            {book.pages.map((page) => (
              <div key={page.id} className="bg-white rounded-lg border overflow-hidden">
                {page.imageUrl && (
                  <img src={page.imageUrl} alt={t('bookDetail.page', { num: page.pageNumber })} className="w-full max-h-96 object-contain bg-gray-100" />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">{t('bookDetail.page', { num: page.pageNumber })}</span>
                    {!page.imageUrl && page.imagePrompt && (
                      <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">{t('bookDetail.illustrationPending')}</span>
                    )}
                  </div>
                  {page.text && <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{page.text}</p>}
                </div>
              </div>
            ))}
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600" />
        <p className="text-yellow-800">{t('bookDetail.statusPending')}</p>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
        <p className="text-blue-800">{t('bookDetail.statusProcessing')}</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{t('bookDetail.statusFailed')}</p>
      </div>
    )
  }

  if (status === 'done') {
    if (hasAllImages) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{t('bookDetail.statusDoneWithImages')}</p>
        </div>
      )
    }

    if (hasImages) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          <p className="text-blue-800">{t('bookDetail.statusDoneGenerating')}</p>
        </div>
      )
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
        <p className="text-blue-800">{t('bookDetail.statusDoneStarting')}</p>
      </div>
    )
  }

  return null
}
