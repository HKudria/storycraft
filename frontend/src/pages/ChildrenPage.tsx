import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useChildren, useCreateChild, useUpdateChild, useDeleteChild } from '../api/children'
import type { ChildData } from '../api/children'
import { ChildCard } from '../components/ChildCard'
import { ChildModal } from '../components/ChildModal'
import { AppHeader } from '../components/AppHeader'

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
    <div className="min-h-screen bg-cream-50">
      <AppHeader
        left={<><button onClick={() => navigate('/dashboard')} className="text-midnight/50 hover:text-midnight font-medium transition-colors">{t('common.back')}</button><h1 className="text-xl font-bold text-midnight">{t('children.title')}</h1></>}
        right={<button onClick={() => { setEditing(null); setModalOpen(true) }} className="px-5 py-2.5 gradient-btn text-white rounded-2xl font-semibold text-sm shadow-warm">{t('children.addChild')}</button>}
      />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-midnight/50">{t('common.loading')}</div>
        ) : children && children.length > 0 ? (
          <div className="space-y-4">
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
          <div className="text-center py-16">
            <p className="text-midnight/50 mb-6 text-lg">{t('children.noChildren')}</p>
            <button onClick={() => { setEditing(null); setModalOpen(true) }} className="px-6 py-3 gradient-btn text-white rounded-2xl font-semibold shadow-warm">
              {t('children.addChild')}
            </button>
        </div>
        )}

        <div className="mt-10">
          <Link to="/templates" className="text-warm-700 hover:text-warm-700/80 text-sm font-medium">{t('children.browseTemplates')}</Link>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm shadow-warm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-midnight mb-2">{t('children.deleteChild')}</h3>
            <p className="text-sm text-midnight/60 mb-6">{t('children.cannotUndo')}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2.5 border border-cream-200 rounded-2xl text-midnight/70 hover:bg-cream-50 font-medium transition-colors">{t('common.cancel')}</button>
              <button onClick={() => { deleteChild.mutate(confirmDelete); setConfirmDelete(null) }} className="flex-1 px-4 py-2.5 bg-candy-400 text-white rounded-2xl hover:bg-candy-500 font-medium transition-colors">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
