import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useAuth, AuthProvider } from '../useAuth'
import { server } from '../../test/server'
import { http, HttpResponse } from 'msw'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns unauthenticated when no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('fetches user when token exists', async () => {
    localStorage.setItem('accessToken', 'test-token')

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    expect(result.current.user?.email).toBe('test@test.com')
    expect(result.current.user?.name).toBe('Test User')
  })

  it('loginWithToken sets token and triggers fetch', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)

    result.current.loginWithToken('new-token')

    expect(localStorage.getItem('accessToken')).toBe('new-token')

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  it('logout clears token', async () => {
    localStorage.setItem('accessToken', 'test-token')

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    // Mock window.location.href setter to prevent actual navigation
    const hrefMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { href: { set: hrefMock } },
      writable: true,
      configurable: true,
    })

    await result.current.logout()

    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  it('handles 401 gracefully', async () => {
    localStorage.setItem('accessToken', 'bad-token')

    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({}, { status: 401 })),
      http.post('/api/auth/refresh', () => HttpResponse.json({}, { status: 401 })),
    )

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
  })
})
