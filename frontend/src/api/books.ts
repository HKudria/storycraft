import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export interface PageData {
  id: number
  pageNumber: number
  text: string | null
  imagePrompt: string | null
  imageUrl: string | null
}

export interface BookData {
  id: number
  title: string | null
  topic: string
  language: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  childId?: number | null
  childName?: string | null
  templateId?: number | null
  templateTitle?: string | null
  isPublic?: boolean
  averageRating?: number | null
  ratingCount?: number
  createdAt: string
  pages?: PageData[]
}

export interface CreateBookPayload {
  childId: number
  templateId: number
  topic: string
  language: string
}

export interface RatingData {
  id: number
  score: number
  comment: string | null
  userName: string
  createdAt: string
}

export interface CatalogBookData {
  id: number
  title: string | null
  templateTitle: string | null
  language: string
  averageRating: number | null
  ratingCount: number
  coverImageUrl: string | null
  createdAt: string
}

export interface CatalogResponse {
  books: CatalogBookData[]
  total: number
  page: number
  limit: number
}

export function useBooks() {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data } = await api.get<BookData[]>('/books')
      return data
    },
  })
}

export function useBook(id: number | null) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: async () => {
      const { data } = await api.get<BookData>(`/books/${id}`)
      return data
    },
    enabled: id !== null,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      if (data.status === 'pending' || data.status === 'processing') return 3000
      const allImagesReady = data.pages?.every((p) => p.imageUrl) ?? false
      return data.status === 'done' && !allImagesReady ? 5000 : false
    },
  })
}

export function useCreateBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateBookPayload) => {
      const { data } = await api.post<{ id: number; status: string }>('/books', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  })
}

export function useDeleteBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/books/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  })
}

export function useToggleVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<{ isPublic: boolean }>(`/books/${id}/visibility`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  })
}

export function useRatings(bookId: number | null) {
  return useQuery({
    queryKey: ['ratings', bookId],
    queryFn: async () => {
      const { data } = await api.get<RatingData[]>(`/books/${bookId}/ratings`)
      return data
    },
    enabled: bookId !== null,
  })
}

export function useSubmitRating() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId, score, comment }: { bookId: number; score: number; comment?: string }) => {
      const { data } = await api.post(`/books/${bookId}/ratings`, { score, comment })
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['ratings', variables.bookId] })
      qc.invalidateQueries({ queryKey: ['books', variables.bookId] })
    },
  })
}
