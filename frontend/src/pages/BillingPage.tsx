import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubscription, useCheckout } from '../api/subscription'

const planNames: Record<string, string> = { free: 'Free', basic: 'Basic', pro: 'Pro' }
const planPrices: Record<string, string> = { free: '$0/mo', basic: '$9.99/mo', pro: '$19.99/mo' }

export function BillingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: sub } = useSubscription()
  const checkout = useCheckout()

  const handleUpgrade = async (plan: string) => {
    const result = await checkout.mutateAsync(plan)
    if (result.url) {
      window.location.href = result.url
    }
  }

  const currentPlan = sub?.plan ?? user?.plan ?? 'free'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Billing & Plan</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
              <p className="text-sm text-gray-500 mt-1">
                {planNames[currentPlan]} — {planPrices[currentPlan]}
              </p>
            </div>
            <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium capitalize">{currentPlan}</span>
          </div>

          {sub && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Books this month</span>
                <span className="font-medium">{sub.booksUsed} / {sub.booksLimit >= 999 ? '∞' : sub.booksLimit}</span>
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

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
        <div className="space-y-3">
          {[
            { key: 'free', name: 'Free', price: '$0/mo', limit: '1 book/month', rank: 0 },
            { key: 'basic', name: 'Basic', price: '$9.99/mo', limit: '5 books/month', rank: 1 },
            { key: 'pro', name: 'Pro', price: '$19.99/mo', limit: 'Unlimited books', rank: 2 },
          ].map((plan) => {
            const currentRank = { free: 0, basic: 1, pro: 2 }[currentPlan] ?? 0
            const isUpgrade = plan.rank > currentRank
            return (
            <div key={plan.key} className={`bg-white rounded-lg border p-4 flex items-center justify-between ${currentPlan === plan.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
              <div>
                <span className="font-medium text-gray-900">{plan.name}</span>
                <span className="text-sm text-gray-500 ml-2">{plan.price}</span>
                <span className="text-xs text-gray-400 ml-2">{plan.limit}</span>
              </div>
              {currentPlan === plan.key ? (
                <span className="text-sm text-indigo-600 font-medium">Current plan</span>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={checkout.isPending}
                  className={`text-sm px-4 py-1.5 rounded-lg disabled:opacity-50 ${isUpgrade ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {checkout.isPending ? 'Processing…' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                </button>
              )}
            </div>
          )})}
        </div>
      </main>
    </div>
  )
}
