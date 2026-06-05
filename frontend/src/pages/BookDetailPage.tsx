import { useParams, useNavigate } from 'react-router-dom'
import { useBook, useDeleteBook } from '../api/books'

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: book, isLoading, error } = useBook(id ? Number(id) : null)
  const deleteBook = useDeleteBook()

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
          <p className="text-red-600 mb-4">Failed to load book.</p>
          <button onClick={() => navigate('/dashboard')} className="text-indigo-600 hover:text-indigo-800">← Back to dashboard</button>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm('Delete this book? This cannot be undone.')) return
    await deleteBook.mutateAsync(book.id)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← Back</button>
            <h1 className="text-xl font-bold text-gray-900">{book.title || book.topic}</h1>
          </div>
          <button onClick={handleDelete} className="text-sm text-red-600 hover:text-red-800">Delete</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <StatusBanner status={book.status} />

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg border p-3">
            <span className="text-gray-500">Child</span>
            <p className="font-medium">{book.childName}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <span className="text-gray-500">Template</span>
            <p className="font-medium">{book.templateTitle}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <span className="text-gray-500">Language</span>
            <p className="font-medium">{book.language.toUpperCase()}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <span className="text-gray-500">Created</span>
            <p className="font-medium">{new Date(book.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {book.pages && book.pages.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Pages</h2>
            {book.pages.map((page) => (
              <div key={page.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">Page {page.pageNumber}</span>
                </div>
                {page.text && <p className="text-gray-700 whitespace-pre-wrap">{page.text}</p>}
                {page.imagePrompt && (
                  <p className="mt-2 text-xs text-gray-400 italic">Illustration: {page.imagePrompt}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function StatusBanner({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600" />
          <p className="text-yellow-800">In queue… waiting for story generation to start.</p>
        </div>
      )
    case 'processing':
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          <p className="text-blue-800">Writing your story…</p>
        </div>
      )
    case 'failed':
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Story generation failed. Please try again.</p>
        </div>
      )
    case 'done':
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">Story complete! Illustrations will be generated in a future update.</p>
        </div>
      )
    default:
      return null
  }
}
