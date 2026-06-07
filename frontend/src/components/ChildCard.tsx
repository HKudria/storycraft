import { useTranslation } from 'react-i18next'
import type { ChildData } from '../api/children'

interface Props {
  child: ChildData
  onEdit: (child: ChildData) => void
  onDelete: (id: number) => void
}

const avatarGradients = [
  'from-warm-700 to-candy-400',
  'from-ocean-400 to-sunny-400',
  'from-candy-400 to-warm-700',
  'from-sunny-400 to-ocean-400',
  'from-ocean-500 to-warm-700',
]

export function ChildCard({ child, onEdit, onDelete }: Props) {
  const { t } = useTranslation()
  const initials = child.name.slice(0, 2).toUpperCase()
  const gradient = avatarGradients[child.id % avatarGradients.length]

  return (
    <div className="bg-white rounded-2xl border border-cream-200 p-5 card-hover">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} text-white flex items-center justify-center text-base font-bold shadow-warm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-midnight truncate text-lg">{child.name}</p>
          <p className="text-sm text-midnight/50">{t('common.age', { num: child.age })}{child.gender ? ` · ${child.gender}` : ''}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onEdit(child)} className="text-sm text-midnight/50 hover:text-warm-700 font-medium transition-colors">{t('common.edit')}</button>
          <button onClick={() => onDelete(child.id)} className="text-sm text-candy-500 hover:text-candy-400 font-medium transition-colors">{t('common.delete')}</button>
        </div>
      </div>
      {child.interests && <p className="mt-3 text-sm text-midnight/60"><span className="text-midnight/40">{t('childCard.interests')}</span> {child.interests}</p>}
      {child.petName && <p className="text-sm text-midnight/60"><span className="text-midnight/40">{t('childCard.pet')}</span> {child.petName}</p>}
    </div>
  )
}
