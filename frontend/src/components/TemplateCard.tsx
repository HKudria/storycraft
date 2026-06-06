import { useTranslation } from 'react-i18next'
import type { TemplateData } from '../api/templates'

const titleKey: Record<string, string> = {
  'Adventure': 'templates.adventure',
  'Bedtime': 'templates.bedtime',
  'Educational': 'templates.educational',
  'Fairy Tale': 'templates.fairyTale',
  'Space': 'templates.space',
  'Ocean': 'templates.ocean',
}

const descKey: Record<string, string> = {
  'Adventure': 'templates.adventureDesc',
  'Bedtime': 'templates.bedtimeDesc',
  'Educational': 'templates.educationalDesc',
  'Fairy Tale': 'templates.fairyTaleDesc',
  'Space': 'templates.spaceDesc',
  'Ocean': 'templates.oceanDesc',
}

interface Props {
  template: TemplateData
  onSelect: (template: TemplateData) => void
}

export function TemplateCard({ template, onSelect }: Props) {
  const { t } = useTranslation()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full capitalize">{template.category}</span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t('templateCard.ages', { min: template.ageMin, max: template.ageMax })}</span>
      </div>
      <h3 className="font-semibold text-gray-900">{t(titleKey[template.title] || template.title)}</h3>
      <p className="text-sm text-gray-600 mt-1 flex-1">{t(descKey[template.title] || template.description)}</p>
      <button
        onClick={() => onSelect(template)}
        className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
      >
        {t('templateCard.useTemplate')}
      </button>
    </div>
  )
}
