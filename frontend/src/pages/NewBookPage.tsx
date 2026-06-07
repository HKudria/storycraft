import { useReducer, useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useChildren } from '../api/children'
import { useTemplates, useTemplate } from '../api/templates'
import { useCreateBook } from '../api/books'
import { useAuth } from '../hooks/useAuth'
import { AppHeader } from '../components/AppHeader'

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

const STEP_EMOJIS = ['👶', '📖', '🎨', '✅']

export function NewBookPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
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
      setSubmitError(err.response?.data?.error || t('newBook.failedToCreate'))
    }
  }

  useEffect(() => {
    setParams({ step: String(state.step) })
  }, [state.step, setParams])

  useEffect(() => {
    const s = Number(params.get('step'))
    if (s >= 1 && s <= 4) dispatch({ type: 'SET_STEP', step: s })
  }, [])

  const steps = [t('newBook.stepChild'), t('newBook.stepTemplate'), t('newBook.stepCustomise'), t('newBook.stepReview')]

  return (
    <div className="min-h-screen bg-cream-50">
      <AppHeader left={
        <>
          <button onClick={() => navigate('/dashboard')} className="text-midnight/50 hover:text-midnight transition-colors">{t('common.back')}</button>
          <h1 className="text-xl font-bold text-midnight">{t('newBook.title')}</h1>
        </>
      } />

      <main className="max-w-3xl mx-auto px-4 py-8">

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-10">
        {steps.map((label, i) => {
          const stepNum = i + 1
          const isCompleted = stepNum < state.step
          const isCurrent = stepNum === state.step
          const isFuture = stepNum > state.step

          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isCompleted ? 'bg-ocean-500 text-white' :
                  isCurrent ? 'bg-warm-700 text-white ring-4 ring-warm-700/20' :
                  'bg-cream-200 text-midnight/30'
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    STEP_EMOJIS[i]
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-warm-700' : isCompleted ? 'text-ocean-500' : 'text-midnight/30'}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] ${stepNum < state.step ? 'bg-ocean-500' : 'bg-cream-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {state.step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-midnight mb-4">{t('newBook.selectChild')}</h2>
          {children && children.length > 0 ? (
            <div className="space-y-3">
              {children.map((child) => (
                <button key={child.id} onClick={() => dispatch({ type: 'SET_CHILD', childId: child.id })} className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${state.childId === child.id ? 'border-warm-700 bg-warm-700/5 shadow-warm' : 'border-cream-200 bg-white hover:border-cream-200 hover:bg-cream-50'}`}>
                  <span className="font-semibold text-midnight">{child.name}</span>
                  <span className="text-sm text-midnight/50 ml-2">{t('common.age', { num: child.age })}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-cream-200">
              <div className="text-4xl mb-3">👶</div>
              <p className="text-midnight/50 mb-3">{t('newBook.noChildren')}</p>
              <a href="/dashboard/children" className="text-warm-700 hover:text-warm-700/80 font-medium">{t('newBook.addChildFirst')}</a>
            </div>
          )}
          {state.childId && (
            <button onClick={() => dispatch({ type: 'SET_STEP', step: 2 })} className="mt-6 px-8 py-3 gradient-btn text-white rounded-full font-medium hover:opacity-90 transition-opacity">{t('common.next')}</button>
          )}
        </div>
      )}

      {state.step === 2 && (
        <div>
          <h2 className="text-lg font-bold text-midnight mb-4">{t('newBook.selectTemplate')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates?.map((tmpl) => (
              <button key={tmpl.id} onClick={() => dispatch({ type: 'SET_TEMPLATE', templateId: tmpl.id })} className={`text-left p-4 rounded-2xl border-2 transition-all ${state.templateId === tmpl.id ? 'border-warm-700 bg-warm-700/5 shadow-warm' : 'border-cream-200 bg-white hover:border-cream-200 hover:bg-cream-50'}`}>
                <p className="font-semibold text-midnight">{tmpl.title}</p>
                <p className="text-sm text-midnight/50 mt-1">{tmpl.description}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => dispatch({ type: 'SET_STEP', step: 1 })} className="px-5 py-2.5 border border-cream-200 rounded-full hover:bg-cream-50 text-midnight/60 font-medium transition-all">{t('common.back')}</button>
            {state.templateId && (
              <button onClick={() => dispatch({ type: 'SET_STEP', step: 3 })} className="px-8 py-2.5 gradient-btn text-white rounded-full font-medium hover:opacity-90 transition-opacity">{t('common.next')}</button>
            )}
          </div>
        </div>
      )}

      {state.step === 3 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-midnight">{t('newBook.customiseStory')}</h2>
          <div>
            <label className="block text-sm font-medium text-midnight/70 mb-1.5">{t('newBook.topic')}</label>
            <input value={state.topic} onChange={(e) => dispatch({ type: 'SET_TOPIC', topic: e.target.value })} className="w-full px-4 py-3 border border-cream-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500 transition-all" placeholder={t('newBook.topicPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-midnight/70 mb-1.5">{t('newBook.language')}</label>
            <div className="flex flex-wrap gap-2">
              {(['en', 'pl', 'de', 'fr', 'ua', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => dispatch({ type: 'SET_LANGUAGE', language: lang })}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${state.language === lang ? 'bg-warm-700 text-white shadow-warm' : 'bg-cream-100 text-midnight/60 hover:bg-cream-200'}`}
                >
                  {t(`languages.${lang === 'ua' ? 'ua' : lang}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => dispatch({ type: 'SET_STEP', step: 2 })} className="px-5 py-2.5 border border-cream-200 rounded-full hover:bg-cream-50 text-midnight/60 font-medium transition-all">{t('common.back')}</button>
            <button disabled={!state.topic} onClick={() => dispatch({ type: 'SET_STEP', step: 4 })} className="px-8 py-2.5 gradient-btn text-white rounded-full font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">{t('newBook.stepReview')}</button>
          </div>
        </div>
      )}

      {state.step === 4 && (
        <div>
          <h2 className="text-lg font-bold text-midnight mb-4">{t('newBook.stepReview')}</h2>
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-warm">
            <div className="p-4 border-b border-cream-200"><span className="text-sm text-midnight/50">{t('newBook.childLabel')}</span> <span className="font-semibold text-midnight">{selectedChild?.name}, age {selectedChild?.age}</span></div>
            <div className="p-4 border-b border-cream-200"><span className="text-sm text-midnight/50">{t('newBook.templateLabel')}</span> <span className="font-semibold text-midnight">{selectedTemplate?.title}</span></div>
            <div className="p-4 border-b border-cream-200"><span className="text-sm text-midnight/50">{t('newBook.topicLabel')}</span> <span className="font-semibold text-midnight">{state.topic}</span></div>
            <div className="p-4 border-b border-cream-200"><span className="text-sm text-midnight/50">{t('newBook.languageLabel')}</span> <span className="font-semibold text-midnight">{state.language.toUpperCase()}</span></div>
            <div className="p-4"><span className="text-sm text-midnight/50">{t('newBook.forLabel')}</span> <span className="font-semibold text-midnight">{user?.name}</span></div>
          </div>
          {user?.canCreate === false ? (
            <div className="mt-5 bg-gradient-to-r from-sunny-400/20 to-sunny-300/20 border border-sunny-400/30 rounded-2xl p-5">
              <p className="text-sunny-500 font-bold">{t('newBook.limitReached')}</p>
              <p className="text-sm text-sunny-500/70 mt-1">{t('newBook.upgradePrompt')}</p>
              <Link to="/dashboard/billing" className="mt-3 inline-block gradient-btn text-white px-5 py-2.5 rounded-full hover:opacity-90 text-sm font-medium transition-opacity">{t('newBook.upgradePlan')}</Link>
            </div>
          ) : (
            <div className="flex gap-3 mt-5">
              <button onClick={() => dispatch({ type: 'SET_STEP', step: 3 })} className="px-5 py-2.5 border border-cream-200 rounded-full hover:bg-cream-50 text-midnight/60 font-medium transition-all">{t('common.back')}</button>
              <button onClick={handleCreate} disabled={createBook.isPending} className="px-8 py-3 gradient-btn text-white rounded-full font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-lg">
                {createBook.isPending ? t('newBook.creating') : `✨ ${t('newBook.createStorybook')}`}
              </button>
            </div>
          )}
          {submitError && <p className="mt-3 text-sm text-candy-500 font-medium">{submitError}</p>}
        </div>
      )}
      </main>
    </div>
  )
}
