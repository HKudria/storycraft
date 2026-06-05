import { useQuery } from '@tanstack/react-query'
import api from './client'

export interface TemplateData {
  id: number
  title: string
  description: string
  category: string
  ageMin: number
  ageMax: number
  coverImageUrl: string | null
}

export function useTemplates(filters?: { category?: string; ageMin?: number; ageMax?: number }) {
  return useQuery({
    queryKey: ['templates', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category) params.set('category', filters.category)
      if (filters?.ageMin !== undefined) params.set('ageMin', String(filters.ageMin))
      if (filters?.ageMax !== undefined) params.set('ageMax', String(filters.ageMax))
      const { data } = await api.get<TemplateData[]>(`/templates?${params}`)
      return data
    },
  })
}

export function useTemplate(id: number | null) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: async () => {
      const { data } = await api.get<TemplateData>(`/templates/${id}`)
      return data
    },
    enabled: id !== null,
  })
}
