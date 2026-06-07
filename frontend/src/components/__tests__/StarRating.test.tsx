import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StarRating } from '../StarRating'

describe('StarRating', () => {
  it('renders correct number of filled stars', () => {
    render(<StarRating rating={3} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)

    // First 3 should be filled (yellow), last 2 empty (gray)
    expect(buttons[0].querySelector('svg')).toHaveClass('text-yellow-500')
    expect(buttons[2].querySelector('svg')).toHaveClass('text-yellow-500')
    expect(buttons[3].querySelector('svg')).toHaveClass('text-gray-300')
    expect(buttons[4].querySelector('svg')).toHaveClass('text-gray-300')
  })

  it('renders all empty stars when rating is 0', () => {
    render(<StarRating rating={0} />)

    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn.querySelector('svg')).toHaveClass('text-gray-300')
    })
  })

  it('renders all empty stars when rating is null', () => {
    render(<StarRating rating={null} />)

    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn.querySelector('svg')).toHaveClass('text-gray-300')
    })
  })

  it('shows rating count when provided', () => {
    render(<StarRating rating={4.5} ratingCount={12} />)

    expect(screen.getByText('4.5 (12)')).toBeInTheDocument()
  })

  it('does not show rating count when not provided', () => {
    render(<StarRating rating={4} />)

    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument()
  })

  it('buttons are disabled when not interactive', () => {
    render(<StarRating rating={3} />)

    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('calls onRate when interactive star is clicked', async () => {
    const user = userEvent.setup()
    const onRate = vi.fn()

    render(<StarRating rating={0} interactive onRate={onRate} />)

    const buttons = screen.getAllByRole('button')
    await user.click(buttons[3])

    expect(onRate).toHaveBeenCalledWith(4)
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<StarRating rating={3} size="sm" />)

    const svg = screen.getAllByRole('button')[0].querySelector('svg')!
    expect(svg).toHaveClass('w-4', 'h-4')

    rerender(<StarRating rating={3} size="md" />)

    const svgMd = screen.getAllByRole('button')[0].querySelector('svg')!
    expect(svgMd).toHaveClass('w-6', 'h-6')
  })
})
