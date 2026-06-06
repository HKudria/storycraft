import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import type { ChildData } from '../api/children'

interface Props {
  child?: ChildData | null
  onSubmit: (data: { name: string; age: number; gender?: string; appearance?: string; interests?: string; petName?: string }) => void
  onClose: () => void
  loading?: boolean
}

export function ChildModal({ child, onSubmit, onClose, loading }: Props) {
  const { t } = useTranslation()

  const schema = z.object({
    name: z.string().min(1, t('childModal.nameRequired')).max(100),
    age: z.number().min(1).max(18),
    gender: z.string().max(20).optional().or(z.literal('')),
    appearance: z.string().max(500).optional().or(z.literal('')),
    interests: z.string().max(500).optional().or(z.literal('')),
    petName: z.string().max(100).optional().or(z.literal('')),
  })

  type FormData = z.infer<typeof schema>

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: child ? {
      name: child.name,
      age: child.age,
      gender: child.gender ?? '',
      appearance: child.appearance ?? '',
      interests: child.interests ?? '',
      petName: child.petName ?? '',
    } : { name: '', age: undefined as unknown as number },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{child ? t('childModal.editChild') : t('childModal.addChild')}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('childModal.name')}</label>
            <input {...register('name')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('childModal.ageField')}</label>
            <input {...register('age', { valueAsNumber: true })} type="number" min={1} max={18} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {errors.age && <p className="text-sm text-red-600">{errors.age.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('childModal.gender')}</label>
            <input {...register('gender')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('childModal.appearance')}</label>
            <textarea {...register('appearance')} rows={2} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('childModal.interestsField')}</label>
            <input {...register('interests')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('childModal.petName')}</label>
            <input {...register('petName')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? t('common.saving') : child ? t('childModal.update') : t('childModal.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
