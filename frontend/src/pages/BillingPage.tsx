import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useSubscription, useCheckout, useChangePlan, useRevertChange } from '../api/subscription'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function BillingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: sub } = useSubscription()
  const checkout = useCheckout()
  const changePlan = useChangePlan()
  const revertChange = useRevertChange()

  const handlePlanChange = async (plan: string) => {
    const currentRank = { free: 0, basic: 1, pro: 2 }[sub?.plan ?? 'free'] ?? 0
    const targetRank = { free: 0, basic: 1, pro: 2 }[plan] ?? 0
    const isUpgrade = targetRank > currentRank

    if (isUpgrade && !cancelAtPeriodEnd) {
      // Upgrade: use checkout (may redirect to Stripe for new subscriptions)
      const result = await checkout.mutateAsync(plan)
      if (result.url) {
        window.location.href = result.url
      }
    } else {
      // Downgrade or cancel: use changePlan API
      const result = await changePlan.mutateAsync(plan)
      if (result.url) {
        window.location.href = result.url
      }
    }
  }

  const currentPlan = sub?.plan ?? user?.plan ?? 'free'
  const periodEnd = sub?.currentPeriodEnd ?? user?.currentPeriodEnd ?? null
  const pendingPlan = sub?.pendingPlan ?? user?.pendingPlan ?? null
  const cancelAtPeriodEnd = sub?.cancelAtPeriodEnd ?? user?.cancelAtPeriodEnd ?? false
  const isLoading = checkout.isPending || changePlan.isPending || revertChange.isPending

  const planNames: Record<string, string> = { free: t('billing.planFree'), basic: t('billing.planBasic'), pro: t('billing.planPro') }

  const formatDate = (iso: string | null) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const planPrices: Record<string, string> = { free: t('billing.priceFree'), basic: t('billing.priceBasic'), pro: t('billing.pricePro') }

  const availablePlans = [
    { key: 'basic', name: t('billing.planBasic'), price: t('billing.priceBasic'), limit: t('billing.limitBasic'), rank: 1 },
    { key: 'pro', name: t('billing.planPro'), price: t('billing.pricePro'), limit: t('billing.limitPro'), rank: 2 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">{t('common.back')}</button>
            <h1 className="text-xl font-bold text-gray-900">{t('billing.title')}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('billing.currentPlan')}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {planNames[currentPlan]} — {planPrices[currentPlan]}
                {periodEnd && currentPlan !== 'free' && !cancelAtPeriodEnd && (
                  <span className="ml-2 text-gray-400">{t('billing.renews', { date: formatDate(periodEnd) })}</span>
                )}
              </p>
            </div>
            <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium capitalize">{currentPlan}</span>
          </div>

          {cancelAtPeriodEnd && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <p className="text-sm text-amber-800">
                {periodEnd
                  ? t('billing.cancelWarning', { date: formatDate(periodEnd), plan: planNames[currentPlan] })
                  : t('billing.cancelWarningEnd', { plan: planNames[currentPlan] })}
              </p>
              <button
                onClick={() => revertChange.mutate()}
                disabled={isLoading}
                className="text-sm text-amber-800 hover:text-amber-900 font-medium disabled:opacity-50 whitespace-nowrap ml-4"
              >
                {t('billing.keepPlan', { plan: planNames[currentPlan] })}
              </button>
            </div>
          )}

          {pendingPlan && pendingPlan !== 'free' && !cancelAtPeriodEnd && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <p className="text-sm text-amber-800">
                {t('billing.planChange', { pendingPlan: planNames[pendingPlan ?? ''], date: periodEnd ? formatDate(periodEnd) : '', currentPlan: planNames[currentPlan] })}
              </p>
              <button
                onClick={() => revertChange.mutate()}
                disabled={isLoading}
                className="text-sm text-amber-800 hover:text-amber-900 font-medium disabled:opacity-50 whitespace-nowrap ml-4"
              >
                {t('billing.keepPlan', { plan: planNames[currentPlan] })}
              </button>
            </div>
          )}

          {!cancelAtPeriodEnd && currentPlan !== 'free' && (
            <div className="mt-4">
              <button
                onClick={() => handlePlanChange('free')}
                disabled={isLoading}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {t('billing.cancelSubscription')}
              </button>
            </div>
          )}

          {sub && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>{t('billing.booksThisMonth')}</span>
                <span className="font-medium">{t('billing.usedOfLimit', { used: sub.booksUsed, limit: sub.booksLimit >= 999 ? '∞' : sub.booksLimit })}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (sub.booksUsed / sub.booksLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('billing.availablePlans')}</h3>
        <div className="space-y-3">
          {availablePlans.map((plan) => {
            const currentRank = { free: 0, basic: 1, pro: 2 }[currentPlan] ?? 0
            const isUpgrade = plan.rank > currentRank
            const isCurrent = currentPlan === plan.key
            const isPendingCancel = cancelAtPeriodEnd && pendingPlan === plan.key
            return (
            <div key={plan.key} className={`bg-white rounded-lg border p-4 flex items-center justify-between ${isCurrent ? 'border-indigo-500 bg-indigo-50' : isPendingCancel ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}>
              <div>
                <span className="font-medium text-gray-900">{plan.name}</span>
                <span className="text-sm text-gray-500 ml-2">{plan.price}</span>
                <span className="text-xs text-gray-400 ml-2">{plan.limit}</span>
              </div>
              {isCurrent ? (
                <span className="text-sm text-indigo-600 font-medium">{t('billing.currentPlanLabel')}</span>
              ) : isPendingCancel ? (
                <span className="text-sm text-amber-600 font-medium">{t('billing.pending')}</span>
              ) : (
                <button
                  onClick={() => handlePlanChange(plan.key)}
                  disabled={isLoading}
                  className={`text-sm px-4 py-1.5 rounded-lg disabled:opacity-50 ${isUpgrade ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {isLoading ? t('billing.processing') : isUpgrade ? t('billing.upgrade') : t('billing.downgrade')}
                </button>
              )}
            </div>
          )})}
        </div>
      </main>
    </div>
  )
}
