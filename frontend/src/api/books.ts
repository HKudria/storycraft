import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export interface PageData {
  id: number
  pageNumber: number
  text: string | null
  imagePrompt: string | null
}

export interface BookData {
  id: number
  title: string | null
  topic: string
  language: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  childId?: number | null
  childName?: string | null
  templateTitle?: string | null
  createdAt: string
  pages?: PageData[]
}

export interface CreateBookPayload {
  childId: number
  templateId: number
  topic: string
  language: string
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
      const status = query.state.data?.status
      return status === 'pending' || status === 'processing' ? 3000 : false
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
