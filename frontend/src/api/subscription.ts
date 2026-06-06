import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export interface SubscriptionData {
  plan: string
  status: string
  booksUsed: number
  booksLimit: number
  canCreate: boolean
  pendingPlan: string | null
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get<SubscriptionData>('/subscription')
      return data
    },
  })
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (plan: string) => {
      const { data } = await api.post<{ url: string }>('/subscription/checkout', { plan })
      return data
    },
  })
}

export function usePortal() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ url: string }>('/subscription/portal')
      return data
    },
  })
}

export function useChangePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (plan: string) => {
      const { data } = await api.post<{ success: boolean; url?: string }>('/subscription/change', { plan })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
  })
}

export async function syncSubscription(sessionId?: string) {
  const { data } = await api.post<SubscriptionData>('/subscription/sync', {
    session_id: sessionId || undefined,
  })
  return data
}
