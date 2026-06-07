import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import api from '../client'

vi.mock('../client', async () => {
  const actual = await vi.importActual('../client')
  return actual
})

describe('API client', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('has correct base URL', () => {
    expect(api.defaults.baseURL).toBe('/api')
  })

  it('has withCredentials set', () => {
    expect(api.defaults.withCredentials).toBe(true)
  })
})
