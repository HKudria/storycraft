import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useChildren } from '../api/children'
import { useBooks, type BookData } from '../api/books'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { data: children } = useChildren()
  const { data: books } = useBooks()
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)

  const filtered = selectedChildId
    ? books?.filter((b) => b.childId === selectedChildId)
    : books

  const groupedByChild = children?.map((child) => ({
    child,
    books: books?.filter((b) => b.childId === child.id) ?? [],
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{t('app.name')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-gray-600">{user?.name}</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full capitalize">{user?.plan}</span>
            {user?.booksLimit != null && (
              <span className="text-xs text-gray-400">{t('dashboard.booksUsed', { used: user.booksUsed, limit: user.booksLimit >= 999 ? '∞' : user.booksLimit })}</span>
            )}
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">{t('common.logout')}</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/dashboard/children" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.children')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('dashboard.childrenDesc')}</p>
          </Link>
          <Link to="/templates" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.templates')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('dashboard.templatesDesc')}</p>
          </Link>
          <Link to="/books/new" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.createBook')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('dashboard.createBookDesc')}</p>
          </Link>
          <Link to="/dashboard/billing" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.billing')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('dashboard.billingDesc')}</p>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.myBooks')}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('dashboard.filter')}</span>
            <button
              onClick={() => setSelectedChildId(null)}
              className={`text-sm px-3 py-1 rounded-full ${selectedChildId === null ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t('common.all')}
            </button>
            {children?.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`text-sm px-3 py-1 rounded-full ${selectedChildId === child.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>

        {!books || books.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-3">{t('dashboard.noBooks')}</p>
            <Link to="/books/new" className="text-indigo-600 hover:text-indigo-800">{t('dashboard.createFirst')}</Link>
          </div>
        ) : selectedChildId ? (
          filtered && filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">{t('dashboard.noBooksForChild')}</p>
            </div>
          )
        ) : (
          <div className="space-y-8">
            {groupedByChild?.filter((g) => g.books.length > 0).map((group) => (
              <div key={group.child.id}>
                <h3 className="text-sm font-medium text-gray-500 mb-3">{group.child.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.books.map((book) => <BookCard key={book.id} book={book} />)}
                </div>
              </div>
            ))}
            {groupedByChild?.every((g) => g.books.length === 0) && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-500 mb-3">{t('dashboard.noBooks')}</p>
                <Link to="/books/new" className="text-indigo-600 hover:text-indigo-800">{t('dashboard.createFirst')}</Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function BookCard({ book }: { book: BookData }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }

  return (
    <Link to={`/books/${book.id}`} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm block">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 line-clamp-1">{book.title || book.topic}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ml-2 shrink-0 ${statusColors[book.status] || ''}`}>{book.status}</span>
      </div>
      {book.title && book.title !== book.topic && (
      <p className="text-sm text-gray-500 line-clamp-2">{book.topic}</p>
      )}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span>{book.childName}</span>
        <span>·</span>
        <span>{new Date(book.createdAt).toLocaleDateString()}</span>
      </div>
    </Link>
  )
}
