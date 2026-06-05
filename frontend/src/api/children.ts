import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export interface ChildData {
  id: number
  name: string
  age: number
  gender: string | null
  appearance: string | null
  interests: string | null
  petName: string | null
  createdAt: string
}

export function useChildren() {
  return useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      const { data } = await api.get<ChildData[]>('/children')
      return data
    },
  })
}

export function useCreateChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (child: Omit<ChildData, 'id' | 'createdAt'>) => {
      const { data } = await api.post<ChildData>('/children', child)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  })
}

export function useUpdateChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...child }: Partial<ChildData> & { id: number }) => {
      const { data } = await api.put<ChildData>(`/children/${id}`, child)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  })
}

export function useDeleteChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/children/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  })
}
