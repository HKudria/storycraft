import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useChildren } from '../api/children'
import { useBooks, useToggleVisibility, type BookData } from '../api/books'
import { AppHeader } from '../components/AppHeader'
import { StarRating } from '../components/StarRating'

const navCards = [
  { key: 'children', to: '/dashboard/children', emoji: '📚', color: 'from-amber-400 to-orange-400' },
  { key: 'templates', to: '/templates', emoji: '📖', color: 'from-blue-400 to-indigo-400' },
  { key: 'createBook', to: '/books/new', emoji: '✨', color: 'from-purple-400 to-pink-400' },
  { key: 'catalog', to: '/catalog', emoji: '🌍', color: 'from-teal-400 to-emerald-400' },
  { key: 'billing', to: '/dashboard/billing', emoji: '💳', color: 'from-cyan-400 to-blue-400' },
  { key: 'referrals', to: '/dashboard/referrals', emoji: '🎁', color: 'from-rose-400 to-red-400' },
] as const

export function DashboardPage() {
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
    <div className="min-h-screen bg-cream-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Nav cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {navCards.map((card) => (
            <Link
              key={card.key}
              to={card.to}
              className="bg-white rounded-2xl border border-cream-200 p-5 card-hover text-center group"
            >
              <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                {card.emoji}
              </div>
              <h2 className="text-sm font-bold text-midnight">{t(`dashboard.${card.key}`)}</h2>
              <p className="text-xs text-midnight/50 mt-0.5">{t(`dashboard.${card.key}Desc`)}</p>
            </Link>
          ))}
        </div>

        {/* Books section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-midnight">{t('dashboard.myBooks')}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-midnight/40">{t('dashboard.filter')}</span>
            <button
              onClick={() => setSelectedChildId(null)}
              className={`text-sm px-3 py-1 rounded-full font-semibold transition-all duration-150 ${selectedChildId === null ? 'bg-warm-700 text-white' : 'bg-cream-100 text-midnight/60 hover:bg-cream-200'}`}
            >
              {t('common.all')}
            </button>
            {children?.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`text-sm px-3 py-1 rounded-full font-semibold transition-all duration-150 ${selectedChildId === child.id ? 'bg-warm-700 text-white' : 'bg-cream-100 text-midnight/60 hover:bg-cream-200'}`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>

        {!books || books.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-10 text-center card-hover">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-midnight/50 mb-3 font-medium">{t('dashboard.noBooks')}</p>
            <Link to="/books/new" className="gradient-btn inline-block px-6 py-2 text-white rounded-full font-semibold text-sm">{t('dashboard.createFirst')}</Link>
          </div>
        ) : selectedChildId ? (
          filtered && filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-cream-200 p-8 text-center">
              <p className="text-midnight/50 font-medium">{t('dashboard.noBooksForChild')}</p>
            </div>
          )
        ) : (
          <div className="space-y-8">
            {groupedByChild?.filter((g) => g.books.length > 0).map((group) => (
              <div key={group.child.id}>
                <h3 className="text-sm font-semibold text-midnight/40 mb-3">{group.child.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.books.map((book) => <BookCard key={book.id} book={book} />)}
                </div>
              </div>
            ))}
            {groupedByChild?.every((g) => g.books.length === 0) && (
              <div className="bg-white rounded-2xl border border-cream-200 p-10 text-center">
                <div className="text-5xl mb-4">📖</div>
                <p className="text-midnight/50 mb-3 font-medium">{t('dashboard.noBooks')}</p>
                <Link to="/books/new" className="gradient-btn inline-block px-6 py-2 text-white rounded-full font-semibold text-sm">{t('dashboard.createFirst')}</Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-sunny-400/20', text: 'text-sunny-500' },
  processing: { bg: 'bg-blue-400/20', text: 'text-blue-600' },
  done: { bg: 'bg-green-400/20', text: 'text-green-600' },
  failed: { bg: 'bg-candy-400/20', text: 'text-candy-500' },
}

function BookCard({ book }: { book: BookData }) {
  const { t } = useTranslation()
  const toggleVisibility = useToggleVisibility()
  const style = statusStyles[book.status] || { bg: 'bg-gray-100', text: 'text-gray-600' }

  return (
    <Link to={`/books/${book.id}`} className="bg-white rounded-2xl border border-cream-200 p-4 card-hover block">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-midnight line-clamp-1">{book.title || book.topic}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ml-2 shrink-0 ${style.bg} ${style.text}`}>{book.status}</span>
      </div>
      {book.title && book.title !== book.topic && (
        <p className="text-sm text-midnight/50 line-clamp-2">{book.topic}</p>
      )}
      <div className="flex items-center gap-2 mt-3 text-xs text-midnight/30">
        <span>{book.childName}</span>
        <span>·</span>
        <span>{new Date(book.createdAt).toLocaleDateString()}</span>
        {book.averageRating != null && (
          <>
            <span>·</span>
            <StarRating rating={book.averageRating} ratingCount={book.ratingCount} />
          </>
        )}
      </div>
      {book.status === 'done' && (
        <div className="mt-2">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleVisibility.mutate(book.id) }}
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold transition-all duration-150 ${book.isPublic ? 'bg-ocean-400/20 text-ocean-600' : 'bg-cream-100 text-midnight/40 hover:bg-cream-200'}`}
          >
            {book.isPublic ? `🌍 ${t('bookCard.public')}` : `🔒 ${t('bookCard.private')}`}
          </button>
        </div>
      )}
    </Link>
  )
}
