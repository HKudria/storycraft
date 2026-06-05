import { useReducer, useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useChildren } from '../api/children'
import { useTemplates, useTemplate } from '../api/templates'
import { useCreateBook } from '../api/books'
import { useAuth } from '../hooks/useAuth'

interface WizardState {
  step: number
  childId: number | null
  templateId: number | null
  topic: string
  language: string
}

type Action =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_CHILD'; childId: number }
  | { type: 'SET_TEMPLATE'; templateId: number }
  | { type: 'SET_TOPIC'; topic: string }
  | { type: 'SET_LANGUAGE'; language: string }

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.step }
    case 'SET_CHILD': return { ...state, childId: action.childId, step: 2 }
    case 'SET_TEMPLATE': return { ...state, templateId: action.templateId, step: 3 }
    case 'SET_TOPIC': return { ...state, topic: action.topic }
    case 'SET_LANGUAGE': return { ...state, language: action.language }
  }
}

export function NewBookPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: children } = useChildren()
  const { data: templates } = useTemplates()
  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    childId: null,
    templateId: params.get('templateId') ? Number(params.get('templateId')) : null,
    topic: '',
    language: 'en',
  })

  const { data: selectedTemplate } = useTemplate(state.templateId)
  const selectedChild = children?.find((c) => c.id === state.childId)
  const createBook = useCreateBook()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!state.childId || !state.templateId) return
    try {
      setSubmitError(null)
      const result = await createBook.mutateAsync({
        childId: state.childId,
        templateId: state.templateId,
        topic: state.topic,
        language: state.language,
      })
      navigate(`/books/${result.id}`)
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to create book.')
    }
  }

  useEffect(() => {
    setParams({ step: String(state.step) })
  }, [state.step, setParams])

  useEffect(() => {
    const s = Number(params.get('step'))
    if (s >= 1 && s <= 4) dispatch({ type: 'SET_STEP', step: s })
  }, [])

  const steps = ['Child', 'Template', 'Customise', 'Review']

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Create a Storybook</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

      <div className="flex gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={i} className={`flex-1 text-center text-sm py-2 rounded-lg ${i + 1 === state.step ? 'bg-indigo-600 text-white' : i + 1 < state.step ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
            {label}
          </div>
        ))}
      </div>

      {state.step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Select child</h2>
          {children && children.length > 0 ? (
            <div className="space-y-2">
              {children.map((child) => (
                <button key={child.id} onClick={() => dispatch({ type: 'SET_CHILD', childId: child.id })} className={`w-full text-left p-3 rounded-lg border ${state.childId === child.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <span className="font-medium">{child.name}</span>
                  <span className="text-sm text-gray-500 ml-2">Age {child.age}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">No children yet.</p>
              <a href="/dashboard/children" className="text-indigo-600 hover:text-indigo-800">Add a child first →</a>
            </div>
          )}
          {state.childId && (
            <button onClick={() => dispatch({ type: 'SET_STEP', step: 2 })} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Next</button>
          )}
        </div>
      )}

      {state.step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Select template</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates?.map((t) => (
              <button key={t.id} onClick={() => dispatch({ type: 'SET_TEMPLATE', templateId: t.id })} className={`text-left p-3 rounded-lg border ${state.templateId === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-gray-500">{t.description}</p>
              </button>
            ))}
          </div>
          <button onClick={() => dispatch({ type: 'SET_STEP', step: 1 })} className="mt-4 mr-2 px-4 py-2 border rounded-lg hover:bg-gray-50">Back</button>
          {state.templateId && (
            <button onClick={() => dispatch({ type: 'SET_STEP', step: 3 })} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Next</button>
          )}
        </div>
      )}

      {state.step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Customise story</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
            <input value={state.topic} onChange={(e) => dispatch({ type: 'SET_TOPIC', topic: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="A brave adventure in a magical forest..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select value={state.language} onChange={(e) => dispatch({ type: 'SET_LANGUAGE', language: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="en">English</option>
              <option value="pl">Polish</option>
              <option value="de">German</option>
              <option value="fr">French</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => dispatch({ type: 'SET_STEP', step: 2 })} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Back</button>
            <button disabled={!state.topic} onClick={() => dispatch({ type: 'SET_STEP', step: 4 })} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Review</button>
          </div>
        </div>
      )}

      {state.step === 4 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Review</h2>
          <div className="bg-white border rounded-lg divide-y">
            <div className="p-3"><span className="text-sm text-gray-500">Child:</span> <span className="font-medium">{selectedChild?.name}, age {selectedChild?.age}</span></div>
            <div className="p-3"><span className="text-sm text-gray-500">Template:</span> <span className="font-medium">{selectedTemplate?.title}</span></div>
            <div className="p-3"><span className="text-sm text-gray-500">Topic:</span> <span className="font-medium">{state.topic}</span></div>
            <div className="p-3"><span className="text-sm text-gray-500">Language:</span> <span className="font-medium">{state.language.toUpperCase()}</span></div>
            <div className="p-3"><span className="text-sm text-gray-500">For:</span> <span className="font-medium">{user?.name}</span></div>
          </div>
          {user?.canCreate === false ? (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">You've reached your monthly book limit.</p>
              <p className="text-sm text-yellow-700 mt-1">Upgrade your plan to create more stories.</p>
              <Link to="/dashboard/billing" className="mt-3 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">Upgrade Plan</Link>
            </div>
          ) : (
            <div className="flex gap-2 mt-4">
              <button onClick={() => dispatch({ type: 'SET_STEP', step: 3 })} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={handleCreate} disabled={createBook.isPending} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {createBook.isPending ? 'Creating…' : 'Create Storybook'}
              </button>
            </div>
          )}
          {submitError && <p className="mt-2 text-sm text-red-600">{submitError}</p>}
        </div>
      )}
      </main>
    </div>
  )
}
