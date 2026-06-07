import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@test.com',
      name: 'Test User',
      avatarUrl: null,
      plan: 'free',
      booksUsed: 0,
      booksLimit: 1,
      canCreate: true,
      currentPeriodEnd: null,
      pendingPlan: null,
      cancelAtPeriodEnd: false,
      locale: 'en',
    })
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({ accessToken: 'new-access-token' })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ ok: true })
  }),

  http.post('/api/auth/dev-login', () => {
    return HttpResponse.json({ accessToken: 'dev-token' })
  }),

  http.get('/api/books', () => {
    return HttpResponse.json([])
  }),

  http.get('/api/children', () => {
    return HttpResponse.json([])
  }),

  http.get('/api/subscription', () => {
    return HttpResponse.json({
      plan: 'free',
      status: 'active',
      booksUsed: 0,
      booksLimit: 1,
      canCreate: true,
      pendingPlan: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    })
  }),

  http.get('/api/catalog', () => {
    return HttpResponse.json({ books: [], total: 0 })
  }),

  http.get('/api/referrals/me', () => {
    return HttpResponse.json({
      code: 'testcode',
      referralUrl: 'http://localhost/login?ref=testcode',
      referrals: [],
      totalReferrals: 0,
      rewardedReferrals: 0,
    })
  }),
]
