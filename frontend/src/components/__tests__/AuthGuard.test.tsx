import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthGuard } from '../AuthGuard'
import { useAuth } from '../../hooks/useAuth'

vi.mock('../../hooks/useAuth')

const mockedUseAuth = vi.mocked(useAuth)

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

describe('AuthGuard', () => {
  it('shows spinner when loading', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      logout: async () => {},
      loginWithToken: () => {},
    })

    const { container } = render(
      <AuthGuard>Protected Content</AuthGuard>,
      { wrapper }
    )

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: async () => {},
      loginWithToken: () => {},
    })

    render(<AuthGuard>Protected Content</AuthGuard>, { wrapper })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@test.com', name: 'Test', avatarUrl: null, plan: 'free', booksUsed: 0, booksLimit: 1, canCreate: true, currentPeriodEnd: null, pendingPlan: null, cancelAtPeriodEnd: false, locale: 'en' },
      isLoading: false,
      isAuthenticated: true,
      logout: async () => {},
      loginWithToken: () => {},
    })

    render(<AuthGuard>Protected Content</AuthGuard>, { wrapper })

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
