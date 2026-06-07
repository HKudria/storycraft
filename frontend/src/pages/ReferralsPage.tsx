import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '../components/AppHeader'
import { useReferrals } from '../api/referrals'
import { useAuth } from '../hooks/useAuth'

export function ReferralsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading } = useReferrals()
  const [copied, setCopied] = useState(false)

  const isPro = user?.plan === 'pro'
  const bonusText = isPro ? t('referrals.bonusInfoPro') : t('referrals.bonusInfo')

  const copyToClipboard = () => {
    if (data?.referralUrl) {
      navigator.clipboard.writeText(data.referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <AppHeader
        left={
          <>
            <button onClick={() => navigate('/dashboard')} className="text-midnight/50 hover:text-midnight font-medium transition-colors">
              {t('common.back')}
            </button>
            <h1 className="text-xl font-bold text-midnight">{t('referrals.title')}</h1>
          </>
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-700" />
          </div>
        ) : data && (
          <>
            {/* Referral link */}
            <div className="gradient-bg rounded-3xl p-8 mb-8 text-white shadow-warm">
              <h2 className="text-xl font-bold">{t('referrals.yourLink')}</h2>
              <p className="text-sm text-white/80 mt-1">{bonusText}</p>
              <div className="flex items-center gap-3 mt-5">
                <input
                  readOnly
                  value={data.referralUrl}
                  className="flex-1 bg-white/20 border border-white/30 rounded-full px-5 py-2.5 text-sm text-white placeholder-white/60 select-all backdrop-blur-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    copied
                      ? 'bg-white/40 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                  }`}
                >
                  {copied ? t('referrals.copied') : t('referrals.copy')}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-cream-200 p-6 text-center card-hover">
                <span className="text-3xl mb-2 block">📚</span>
                <p className="text-3xl font-bold text-warm-700">{data.totalReferrals}</p>
                <p className="text-sm text-midnight/50 mt-1 font-medium">{t('referrals.total')}</p>
              </div>
              <div className="bg-white rounded-2xl border border-cream-200 p-6 text-center card-hover">
                <span className="text-3xl mb-2 block">⭐</span>
                <p className="text-3xl font-bold text-sunny-500">{data.rewardedReferrals}</p>
                <p className="text-sm text-midnight/50 mt-1 font-medium">{t('referrals.rewarded')}</p>
              </div>
            </div>

            {/* Referrals table */}
            {data.referrals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-cream-200 p-10 text-center">
                <p className="text-midnight/50">{t('referrals.noReferrals')}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-cream-50 border-b border-cream-200">
                    <tr>
                      <th className="text-left text-sm font-semibold text-midnight/50 px-5 py-3">{t('referrals.name')}</th>
                      <th className="text-left text-sm font-semibold text-midnight/50 px-5 py-3">{t('referrals.status')}</th>
                      <th className="text-left text-sm font-semibold text-midnight/50 px-5 py-3">{t('referrals.date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100">
                    {data.referrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-cream-50 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-medium text-midnight">{ref.refereeName}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            ref.status === 'rewarded'
                              ? 'bg-ocean-400/20 text-ocean-500'
                              : 'bg-sunny-400/20 text-sunny-500'
                          }`}>
                            {ref.status === 'rewarded' ? t('referrals.rewardedStatus') : t('referrals.pending')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-midnight/50">
                          {new Date(ref.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
