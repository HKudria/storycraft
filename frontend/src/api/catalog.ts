import { useQuery } from '@tanstack/react-query'
import api from './client'
import type { CatalogResponse, BookData } from './books'

export interface CatalogFilters {
  templateId?: number | null
  language?: string | null
  minRating?: number | null
  page?: number
}

export function useCatalogBooks(filters?: CatalogFilters) {
  return useQuery({
    queryKey: ['catalog', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.templateId) params.set('templateId', String(filters.templateId))
      if (filters?.language) params.set('language', filters.language)
      if (filters?.minRating !== undefined && filters.minRating !== null)
        params.set('minRating', String(filters.minRating))
      if (filters?.page && filters.page > 1) params.set('page', String(filters.page))
      const qs = params.toString()
      const { data } = await api.get<CatalogResponse>(`/catalog${qs ? `?${qs}` : ''}`)
      return data
    },
  })
}

export function usePublicBook(id: number | null) {
  return useQuery({
    queryKey: ['catalog', 'book', id],
    queryFn: async () => {
      const { data } = await api.get<BookData>(`/catalog/${id}`)
      return data
    },
    enabled: id !== null,
  })
}
