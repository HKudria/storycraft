import { useNavigate } from 'react-router-dom'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    limit: '1 book/month',
    features: ['Story text generation', 'AI illustrations', 'PDF download'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Basic',
    price: '$9.99',
    period: '/mo',
    limit: '5 books/month',
    features: ['Everything in Free', 'Priority generation', 'Multiple children profiles'],
    cta: 'Subscribe',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$19.99',
    period: '/mo',
    limit: 'Unlimited books',
    features: ['Everything in Basic', 'Unlimited stories', 'Early access to new features'],
    cta: 'Subscribe',
    highlight: false,
  },
]

export function PricingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">StoryCraft Pricing</h1>
          <div />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Create magical stories for your children</h2>
          <p className="mt-3 text-gray-500">Choose the plan that fits your family.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-xl border-2 p-6 ${plan.highlight ? 'border-indigo-600 shadow-lg relative' : 'border-gray-200'}`}>
              {plan.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">Popular</span>}
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
