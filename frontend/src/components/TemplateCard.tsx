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

const categoryKey: Record<string, string> = {
  'adventure': 'templates.categoryAdventure',
  'bedtime': 'templates.categoryBedtime',
  'educational': 'templates.categoryEducational',
  'fantasy': 'templates.categoryFantasy',
  'sci-fi': 'templates.categorySciFi',
  'nature': 'templates.categoryNature',
}

const categoryColors: Record<string, string> = {
  adventure: '#F97316',
  bedtime: '#818CF8',
  educational: '#14B8A6',
  fantasy: '#C084FC',
  'sci-fi': '#3B82F6',
  nature: '#22C55E',
}

const categoryEmojis: Record<string, string> = {
  adventure: '🗺️',
  bedtime: '🌙',
  educational: '📚',
  fantasy: '🧙',
  'sci-fi': '🚀',
  nature: '🌿',
}

interface Props {
  template: TemplateData
  onSelect: (template: TemplateData) => void
}

export function TemplateCard({ template, onSelect }: Props) {
  const { t } = useTranslation()
  const color = categoryColors[template.category] || '#7C3AED'
  const emoji = categoryEmojis[template.category] || '📖'

  return (
    <div
      className="bg-white rounded-2xl border border-cream-200 p-5 flex flex-col card-hover"
      style={{ borderLeftWidth: '4px', borderLeftColor: color }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: color }}>
          {t(categoryKey[template.category] || template.category)}
        </span>
        <span className="text-xs bg-cream-100 text-midnight/60 px-2.5 py-1 rounded-full">{t('templateCard.ages', { min: template.ageMin, max: template.ageMax })}</span>
      </div>
      <h3 className="font-semibold text-midnight text-lg">{t(titleKey[template.title] || template.title)}</h3>
      <p className="text-sm text-midnight/60 mt-1 flex-1">{t(descKey[template.title] || template.description)}</p>
      <button
        onClick={() => onSelect(template)}
        className="mt-4 w-full px-4 py-2.5 gradient-btn text-white text-sm font-semibold rounded-2xl"
      >
        {t('templateCard.useTemplate')}
      </button>
    </div>
  )
}
