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
    },
    {
      name: t('pricing.basicName'),
      price: t('pricing.basicPrice'),
      period: t('pricing.perMonth'),
      limit: t('pricing.basicLimit'),
      features: [t('pricing.basicEverything'), t('pricing.basicPriority'), t('pricing.basicChildren')],
      cta: t('pricing.subscribe'),
      highlight: true,
    },
    {
      name: t('pricing.proName'),
      price: t('pricing.proPrice'),
      period: t('pricing.perMonth'),
      limit: t('pricing.proLimit'),
      features: [t('pricing.proEverythingBasic'), t('pricing.proUnlimited'), t('pricing.proEarlyAccess')],
      cta: t('pricing.subscribe'),
      highlight: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader left={<><button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">{t('common.back')}</button><h1 className="text-xl font-bold text-gray-900">{t('pricing.title')}</h1></>} />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{t('pricing.subtitle')}</h2>
          <p className="mt-3 text-gray-500">{t('pricing.choosePlan')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-xl border-2 p-6 ${plan.highlight ? 'border-indigo-600 shadow-lg relative' : 'border-gray-200'}`}>
              {plan.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">{t('pricing.popular')}</span>}
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-3">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-indigo-600 font-medium">{plan.limit}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login')} className={`mt-6 w-full py-2 rounded-lg font-medium ${plan.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
