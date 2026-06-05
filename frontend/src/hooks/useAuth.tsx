import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

interface User {
  id: number
  email: string
  name: string
  avatarUrl: string | null
  plan: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  loginWithToken: (token: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
  loginWithToken: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [manualToken, setManualToken] = useState<string | null>(null)

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me')
      return data as User
    },
    retry: false,
    enabled: !!localStorage.getItem('accessToken') || !!manualToken,
  })

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore errors
    }
    localStorage.removeItem('accessToken')
    setManualToken(null)
    queryClient.setQueryData(['me'], null)
    queryClient.clear()
    window.location.href = '/login'
  }, [queryClient])

  const loginWithToken = useCallback((token: string) => {
    localStorage.setItem('accessToken', token)
    setManualToken(token)
    queryClient.invalidateQueries({ queryKey: ['me'] })
  }, [queryClient])

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      isLoading,
      isAuthenticated: !!user,
      logout,
      loginWithToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
