import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useSubscription, useCheckout, useChangePlan, useRevertChange } from '../api/subscription'
import { AppHeader } from '../components/AppHeader'

const planColors: Record<string, { bg: string; text: string; gradient: string; strip: string }> = {
  free: { bg: 'bg-ocean-400/10', text: 'text-ocean-500', gradient: 'from-ocean-400 to-ocean-500', strip: 'bg-gradient-to-r from-ocean-400 to-ocean-500' },
  basic: { bg: 'bg-sunny-400/10', text: 'text-sunny-500', gradient: 'from-sunny-400 to-sunny-500', strip: 'bg-gradient-to-r from-sunny-400 to-sunny-500' },
  pro: { bg: 'bg-warm-700/10', text: 'text-warm-700', gradient: 'from-warm-700 to-candy-400', strip: 'bg-gradient-to-r from-warm-700 to-candy-400' },
}

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

  const currentColors = planColors[currentPlan] ?? planColors.free

  return (
    <div className="min-h-screen bg-cream-50">
      <AppHeader left={<><button onClick={() => navigate('/dashboard')} className="text-midnight/50 hover:text-midnight font-medium transition-colors">{t('common.back')}</button><h1 className="text-xl font-bold text-midnight">{t('billing.title')}</h1></>} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-cream-200 p-6 mb-6 shadow-warm overflow-hidden">
          {/* Colored strip at top */}
          <div className={`h-1.5 -mx-6 -mt-6 mb-6 ${currentColors.strip}`} />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-midnight">{t('billing.currentPlan')}</h2>
              <p className="text-sm text-midnight/50 mt-1">
                {planNames[currentPlan]} — {planPrices[currentPlan]}
                {periodEnd && currentPlan !== 'free' && !cancelAtPeriodEnd && (
                  <span className="ml-2 text-midnight/40">{t('billing.renews', { date: formatDate(periodEnd) })}</span>
                )}
              </p>
            </div>
            <span className={`text-sm ${currentColors.bg} ${currentColors.text} px-4 py-1.5 rounded-full font-semibold capitalize`}>{currentPlan}</span>
          </div>

          {cancelAtPeriodEnd && (
            <div className="mt-4 p-4 bg-sunny-400/20 border border-sunny-400 rounded-2xl flex items-center justify-between">
              <p className="text-sm text-sunny-500 font-medium">
                {periodEnd
                  ? t('billing.cancelWarning', { date: formatDate(periodEnd), plan: planNames[currentPlan] })
                  : t('billing.cancelWarningEnd', { plan: planNames[currentPlan] })}
              </p>
              <button
                onClick={() => revertChange.mutate()}
                disabled={isLoading}
                className="text-sm text-sunny-500 hover:text-sunny-400 font-semibold disabled:opacity-50 whitespace-nowrap ml-4"
              >
                {t('billing.keepPlan', { plan: planNames[currentPlan] })}
              </button>
            </div>
          )}

          {pendingPlan && pendingPlan !== 'free' && !cancelAtPeriodEnd && (
            <div className="mt-4 p-4 bg-sunny-400/20 border border-sunny-400 rounded-2xl flex items-center justify-between">
              <p className="text-sm text-sunny-500 font-medium">
                {t('billing.planChange', { pendingPlan: planNames[pendingPlan ?? ''], date: periodEnd ? formatDate(periodEnd) : '', currentPlan: planNames[currentPlan] })}
              </p>
              <button
                onClick={() => revertChange.mutate()}
                disabled={isLoading}
                className="text-sm text-sunny-500 hover:text-sunny-400 font-semibold disabled:opacity-50 whitespace-nowrap ml-4"
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
                className="text-sm text-candy-500 hover:text-candy-400 bg-candy-400/20 rounded-full px-4 py-1.5 font-medium transition-colors disabled:opacity-50"
              >
                {t('billing.cancelSubscription')}
              </button>
            </div>
          )}

          {sub && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-midnight/60 mb-2">
                <span>{t('billing.booksThisMonth')}</span>
                <span className="font-semibold text-midnight">{t('billing.usedOfLimit', { used: sub.booksUsed, limit: sub.booksLimit >= 999 ? '∞' : sub.booksLimit })}</span>
              </div>
              <div className="w-full bg-cream-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all bg-gradient-to-r from-warm-700 to-warm-500"
                  style={{ width: `${Math.min(100, (sub.booksUsed / sub.booksLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-midnight mb-4">{t('billing.availablePlans')}</h3>
        <div className="space-y-4">
          {availablePlans.map((plan) => {
            const currentRank = { free: 0, basic: 1, pro: 2 }[currentPlan] ?? 0
            const isUpgrade = plan.rank > currentRank
            const isCurrent = currentPlan === plan.key
            const isPendingCancel = cancelAtPeriodEnd && pendingPlan === plan.key
            const planColor = planColors[plan.key] ?? planColors.free
            return (
            <div key={plan.key} className={`bg-white rounded-2xl border overflow-hidden card-hover ${isCurrent ? 'border-warm-700/50 bg-warm-700/5' : isPendingCancel ? 'border-sunny-400 bg-sunny-400/5' : 'border-cream-200'}`}>
              {/* Colored strip */}
              <div className={`h-1 ${planColor.strip}`} />
              <div className="p-5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-midnight text-lg">{plan.name}</span>
                  <span className="text-sm text-midnight/50 ml-3">{plan.price}</span>
                  <span className="text-xs text-midnight/40 ml-2">{plan.limit}</span>
                </div>
                {isCurrent ? (
                  <span className="text-sm text-warm-700 font-semibold bg-warm-700/10 px-4 py-1.5 rounded-full">{t('billing.currentPlanLabel')}</span>
                ) : isPendingCancel ? (
                  <span className="text-sm text-sunny-500 font-semibold bg-sunny-400/10 px-4 py-1.5 rounded-full">{t('billing.pending')}</span>
                ) : (
                  <button
                    onClick={() => handlePlanChange(plan.key)}
                    disabled={isLoading}
                    className={`text-sm px-5 py-2 rounded-full font-semibold disabled:opacity-50 transition-colors ${isUpgrade ? 'gradient-btn text-white shadow-warm' : 'bg-cream-100 text-midnight/70 hover:bg-cream-200'}`}
                  >
                    {isLoading ? t('billing.processing') : isUpgrade ? t('billing.upgrade') : t('billing.downgrade')}
                  </button>
                )}
              </div>
            </div>
          )})}
        </div>
      </main>
    </div>
  )
}
