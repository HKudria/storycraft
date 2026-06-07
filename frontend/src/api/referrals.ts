import { useQuery } from '@tanstack/react-query'
import api from './client'

export interface ReferralData {
  id: number
  refereeName: string
  status: 'pending' | 'rewarded'
  createdAt: string
  rewardedAt: string | null
}

export interface ReferralInfo {
  code: string
  referralUrl: string
  referrals: ReferralData[]
  totalReferrals: number
  rewardedReferrals: number
}

export function useReferrals() {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const { data } = await api.get<ReferralInfo>('/referrals/me')
      return data
    },
  })
}
