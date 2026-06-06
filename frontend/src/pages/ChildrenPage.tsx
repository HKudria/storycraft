import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useChildren, useCreateChild, useUpdateChild, useDeleteChild } from '../api/children'
import type { ChildData } from '../api/children'
import { ChildCard } from '../components/ChildCard'
import { ChildModal } from '../components/ChildModal'

export function ChildrenPage() {
  const { t } = useTranslation()
  const { data: children, isLoading } = useChildren()
  const createChild = useCreateChild()
  const updateChild = useUpdateChild()
  const deleteChild = useDeleteChild()
  const navigate = useNavigate()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ChildData | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← Back</button>
            <h1 className="text-xl font-bold text-gray-900">{t('children.title')}</h1>
          </div>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            {t('children.addChild')}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-gray-500">{t('common.loading')}</div>
        ) : children && children.length > 0 ? (
          <div className="space-y-3">
            {children.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                onEdit={(c) => { setEditing(c); setModalOpen(true) }}
                onDelete={(id) => setConfirmDelete(id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{t('children.noChildren')}</p>
            <button onClick={() => { setEditing(null); setModalOpen(true) }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              {t('children.addChild')}
            </button>
        </div>
        )}

        <div className="mt-8">
          <Link to="/templates" className="text-indigo-600 hover:text-indigo-800 text-sm">{t('children.browseTemplates')}</Link>
        </div>
      </main>

      {modalOpen && (
        <ChildModal
          child={editing}
          loading={createChild.isPending || updateChild.isPending}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSubmit={(data) => {
            if (editing) {
              updateChild.mutate({ id: editing.id, ...data }, { onSuccess: () => setModalOpen(false) })
            } else {
              createChild.mutate(data as Parameters<typeof createChild.mutate>[0], { onSuccess: () => setModalOpen(false) })
            }
          }}
        />
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('children.deleteChild')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('children.cannotUndo')}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={() => { deleteChild.mutate(confirmDelete); setConfirmDelete(null) }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
