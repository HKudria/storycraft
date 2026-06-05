import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export interface SubscriptionData {
  plan: string
  status: string
  booksUsed: number
  booksLimit: number
  canCreate: boolean
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
