import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '../components/AppHeader'

export function PricingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const plans = [
    {
      name: t('pricing.freeName'),
      price: t('pricing.freePrice'),
      period: t('pricing.perMonth'),
      limit: t('pricing.freeLimit'),
      features: [t('pricing.freeStoryGen'), t('pricing.freeIllustrations'), t('pricing.freePdf')],
      cta: t('pricing.getStarted'),
      highlight: false,
      emoji: '🌱',
      stripClass: 'bg-gradient-to-r from-ocean-400 to-ocean-500',
      badge: null,
      btnClass: 'bg-cream-100 text-midnight hover:bg-cream-50',
    },
    {
      name: t('pricing.basicName'),
      price: t('pricing.basicPrice'),
      period: t('pricing.perMonth'),
      limit: t('pricing.basicLimit'),
      features: [t('pricing.basicEverything'), t('pricing.basicPriority'), t('pricing.basicChildren')],
      cta: t('pricing.subscribe'),
      highlight: true,
      emoji: '⭐',
      stripClass: 'bg-gradient-to-r from-sunny-400 to-sunny-500',
      badge: { label: t('pricing.popular'), class: 'bg-sunny-400 text-white' },
      btnClass: 'gradient-btn text-white',
    },
    {
      name: t('pricing.proName'),
      price: t('pricing.proPrice'),
      period: t('pricing.perMonth'),
      limit: t('pricing.proLimit'),
      features: [t('pricing.proEverythingBasic'), t('pricing.proUnlimited'), t('pricing.proEarlyAccess')],
      cta: t('pricing.subscribe'),
      highlight: false,
      emoji: '👑',
      stripClass: 'bg-gradient-to-r from-warm-700 to-purple-400',
      badge: { label: 'Best Value', class: 'bg-warm-700 text-white' },
      btnClass: 'bg-cream-100 text-midnight hover:bg-cream-50',
    },
  ]

  return (
    <div className="min-h-screen bg-cream-50">
      <AppHeader left={<><button onClick={() => navigate('/')} className="text-midnight/50 hover:text-midnight">{t('common.back')}</button><h1 className="text-xl font-bold text-midnight">{t('pricing.title')}</h1></>} />

      {/* Gradient hero section */}
      <div className="gradient-bg-fun text-white text-center py-10 px-4">
        <h2 className="text-3xl font-bold">{t('pricing.subtitle')}</h2>
        <p className="mt-2 text-white/80 text-lg">{t('pricing.choosePlan')}</p>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-warm card-hover overflow-hidden ${plan.highlight ? 'ring-2 ring-sunny-400' : ''}`}
            >
              {/* Colored top strip */}
              <div className={`h-1 ${plan.stripClass}`} />

              {/* Badge */}
              {plan.badge && (
                <span className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full ${plan.badge.class}`}>
                  {plan.badge.label}
                </span>
              )}

              <div className="p-6">
                {/* Emoji icon + plan name */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{plan.emoji}</span>
                  <h3 className="text-lg font-bold text-midnight">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mt-2">
                  <span className="text-3xl font-bold text-midnight">{plan.price}</span>
                  <span className="text-midnight/50">{plan.period}</span>
                </div>

                {/* Limit line */}
                <p className="mt-2 text-sm font-medium text-warm-700">{plan.limit}</p>

                {/* Features */}
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-midnight/70 flex items-start gap-2">
                      <span className="shrink-0">✅</span> {f}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  onClick={() => navigate('/login')}
                  className={`mt-6 w-full py-2.5 rounded-full font-bold text-sm ${plan.btnClass}`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
