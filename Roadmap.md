# StoryCraft — Development Roadmap

## Phase Overview

| Phase | Name | Deliverable | Status |
|---|---|---|---|
| 0 | Infrastructure | Docker environment, all services running locally | **Done** |
| 1 | Authentication | Google OAuth2, JWT, user profile | **Done** |
| 2 | Children & Templates | Child CRUD, template catalog, story wizard UI | |
| 3 | Story Text Generation | Claude API, Symfony Messenger queue, book status | |
| 4 | Illustrations & PDF | DALL-E 3, mPDF assembly, MinIO/S3 storage | |
| 5 | Subscriptions & Billing | Stripe, plans, limits, webhooks | |
| 6 | Referral Program | Referral codes, bonus logic | |
| 7 | Ratings & Public Catalog | Book ratings, public catalog page | |
| 8 | Production | CI/CD, monitoring, security hardening, deploy | |

---

## Phase 0 — Infrastructure & Scaffolding

### 0.1 Monorepo structure
- [x] Create root layout: `storycraft/backend/`, `storycraft/frontend/`, `storycraft/nginx/`
- [x] Root `.gitignore` (ignore `.env`, `vendor/`, `node_modules/`, `var/`, `public/build/`)
- [x] Root `.env.example` with all required variables documented
- [x] `Makefile` with shortcuts:
  - `make up` — `docker compose up -d`
  - `make down` — `docker compose down`
  - `make logs` — `docker compose logs -f`
  - `make migrate` — run Doctrine migrations inside php-fpm
  - `make worker` — tail worker logs
  - `make shell-api` — bash into php-fpm container
  - `make shell-front` — bash into frontend container

### 0.2 Docker Compose (`docker-compose.yml`)
- [x] Service `postgres` — postgres:16, named volume, healthcheck (`pg_isready`)
- [x] Service `redis` — redis:7-alpine, named volume, `maxmemory-policy allkeys-lru`
- [x] Service `minio` — minio/minio, named volume, ports 9000 (API) + 9001 (console), auto-create bucket via `minio/mc` init container
- [x] Service `php-fpm` — custom Dockerfile, mounts `./backend`, depends on postgres + redis
- [x] Service `worker` — same image as php-fpm, entrypoint `bin/console messenger:consume async --time-limit=3600`, depends on php-fpm
- [x] Service `frontend` — custom Dockerfile, mounts `./frontend`, port 5173, Vite dev server
- [x] Service `nginx` — nginx:alpine, mounts `./nginx/default.conf`, port 80, depends on php-fpm + frontend
- [x] All services on a shared `storycraft_network` bridge network
- [x] Named volumes: `postgres_data`, `redis_data`, `minio_data`

### 0.3 Nginx config (`nginx/default.conf`)
- [x] `location /api/` → `fastcgi_pass php-fpm:9000` (PHP-FPM with Symfony front controller)
- [x] `location /` → `proxy_pass http://frontend:5173` (Vite dev) with WebSocket upgrade for HMR
- [x] Gzip, client max body size 20MB (for future image uploads)

### 0.4 Backend — Symfony 8 scaffold (`backend/`) *(upgraded from PHP 8.3/Symfony 7 to PHP 8.4/Symfony 8.1)*
- [x] `composer create-project symfony/skeleton backend`
- [x] Install packages:
  - `symfony/orm-pack` — Doctrine ORM + DBAL
  - `lexik/jwt-authentication-bundle` — JWT
  - `knpuniversity/oauth2-client-bundle` + `league/oauth2-google` — Google OAuth2
  - `symfony/messenger` — async message bus
  - `symfony/redis-messenger` — Redis transport
  - `stripe/stripe-php` — Stripe SDK
  - `aws/aws-sdk-php` — S3/MinIO
  - `mpdf/mpdf` — PDF generation
  - `nelmio/cors-bundle` — CORS headers
  - `symfony/serializer-pack` — JSON serialization
  - `symfony/validator` — request validation
- [x] `backend/Dockerfile` — php:8.4-fpm, install extensions: `pdo_pgsql`, `redis`, `intl`, `zip`, `gd`, install `composer`
- [x] Configure `.env`: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `S3_ENDPOINT`, `S3_KEY`, `S3_SECRET`, `S3_BUCKET`, `APP_FRONTEND_URL`
- [x] Healthcheck endpoint: `GET /api/health` → `{ status: "ok", db: "ok", redis: "ok" }`

### 0.5 Frontend — React scaffold (`frontend/`)
- [x] `npm create vite@latest frontend -- --template react-ts`
- [x] Install packages:
  - `@tanstack/react-query` — server state + polling
  - `react-router-dom` — routing
  - `axios` — HTTP client
  - `tailwindcss` + `@tailwindcss/vite` — styling
  - `zod` — schema validation for forms
  - `react-hook-form` + `@hookform/resolvers` — form management
- [x] `frontend/Dockerfile` — node:20-alpine, dev stage (Vite)
- [x] Configure Vite proxy: `/api` → `http://nginx:80` (in dev, to avoid CORS)
- [x] Setup `axios` instance: base URL `/api`, request interceptor to attach JWT from cookie/localStorage, response interceptor to handle 401 → refresh token
- [x] Setup `QueryClientProvider` in `main.tsx`
- [x] Base routing in `App.tsx`: `/`, `/login`, `/dashboard`, `/books/:id`

### 0.6 Database — Doctrine entities v1
- [x] Create all entities in `src/Entity/`: `User`, `Child`, `Template`, `Book`, `Page`, `Job`, `Subscription`, `Rating`, `Referral`
- [x] Define all relationships with Doctrine annotations/attributes
- [x] Generate and run first migration: `bin/console doctrine:migrations:diff && bin/console doctrine:migrations:migrate`
- [x] Data fixtures (`DoctrineFixturesBundle`): seed 6 `Template` records (Adventure, Bedtime, Educational, Fairy Tale, Space, Ocean)

---

## Phase 1 — Authentication

### 1.1 Backend — Google OAuth2 flow
- [x] Configure `knpuniversity/oauth2-client-bundle` for Google provider in `config/packages/knpu_oauth2_client.yaml`
- [x] `src/Security/AuthService.php` — handles user upsert, token issuance/refresh/invalidation
  - `findOrCreateUser()` — upsert by `googleId`
  - `issueTokens()` — generate `accessToken` (JWT) + `refreshToken` (random, stored in DB, 7 days TTL)
  - `refreshAccessToken()` — validate `refreshToken`, issue new `accessToken`
  - `invalidateRefreshToken()` — clear `refreshToken` in DB
- [x] `src/Controller/AuthController.php` — all auth endpoints:
  - `GET /api/auth/google` — redirect to Google consent screen
  - `GET /api/auth/google/callback` — exchange code, upsert user, set refresh cookie, redirect to frontend
  - `POST /api/auth/refresh` — validate `refreshToken` from cookie, issue new `accessToken`
  - `POST /api/auth/logout` — clear `refreshToken` in DB + clear cookie
  - `GET /api/auth/me` — return current user from JWT
  - `POST /api/auth/dev-login` — dev-only email+name login (bypass Google OAuth)
- [x] `User` entity implements `UserInterface`, `roles` JSON column added
- [x] `UserRepository` — `findByGoogleId()`, `findByEmail()`, `findByRefreshToken()`
- [x] `security.yaml` — Doctrine user provider, stateless JWT firewall on `/api/`, public auth/health routes
- [x] `refreshToken` sent as `httpOnly` cookie via `Set-Cookie` header

### 1.2 Frontend — Auth flow
- [x] `/login` page — "Continue with Google" button → redirects to `GET /api/auth/google`
- [x] Dev login form — email + name fields, calls `POST /api/auth/dev-login` (dev mode only)
- [x] `/auth/callback` page — reads `?token=` from URL, stores `accessToken` in localStorage, redirects to `/dashboard`
- [x] `useAuth()` hook — `{ user, isLoading, isAuthenticated, logout, loginWithToken }`
- [x] `AuthProvider` — React context wrapping app, auto-fetches `/auth/me` on load
- [x] `AuthGuard` component — wraps protected routes, redirects to `/login` if not authenticated
- [x] `AxiosInterceptor` — attach `Authorization: Bearer <token>` to every request; on 401 → call refresh endpoint with mutex → retry original request → if refresh fails → redirect to `/login`
- [x] `/dashboard` page — shows user avatar, name, current plan badge, logout button

---

## Phase 2 — Children & Templates

### 2.1 Backend — Children CRUD
- [ ] `ChildController` with routes:
  - `GET /api/children` — list current user's children
  - `POST /api/children` — create child (validate: name required, age 1–18)
  - `GET /api/children/:id` — get child (ownership check)
  - `PUT /api/children/:id` — update child
  - `DELETE /api/children/:id` — soft delete (`deletedAt` timestamp)
- [ ] `ChildService` — all business logic, always scopes queries by `userId`
- [ ] `ChildRepository` — `findByUser(User $user): array`
- [ ] Request DTOs with `symfony/validator` constraints

### 2.2 Backend — Templates
- [ ] `TemplateController` with routes:
  - `GET /api/templates` — list active templates (public, no auth required)
  - `GET /api/templates/:id` — template detail
- [ ] Query filters: `?category=`, `?ageMin=`, `?ageMax=`
- [ ] Templates are read-only via API (managed via fixtures/migrations)

### 2.3 Frontend — Children management
- [ ] `/dashboard/children` page — list of children cards
- [ ] `ChildCard` component — avatar (initials), name, age
- [ ] `AddChildModal` — form: name, age, gender, appearance description, interests, pet name
- [ ] `EditChildModal` — same form pre-filled
- [ ] Delete confirmation dialog

### 2.4 Frontend — Template catalog & story wizard
- [ ] `/templates` page — grid of `TemplateCard` components with category filter tabs
- [ ] `TemplateCard` — cover image, title, description, age range badge
- [ ] `/books/new` — multi-step wizard:
  - Step 1: Select child (or add new inline)
  - Step 2: Select template
  - Step 3: Customise — topic, language (EN/PL/DE/FR), any extra details
  - Step 4: Review & confirm (show plan limit warning if needed)
- [ ] Wizard state managed with `useReducer` + URL params for deep-linking

---

## Phase 3 — Story Text Generation

### 3.1 Backend — Books API
- [ ] `BookController`:
  - `POST /api/books` — create book:
    1. Check `SubscriptionService::canCreateBook($user)` → 403 if over limit
    2. Create `Book` entity with `status = pending`
    3. Create `Job` entity with `type = generate_story`, `status = queued`
    4. Dispatch `GenerateStoryMessage($bookId)` to Messenger
    5. Return `{ id, status: "pending" }` with HTTP 202
  - `GET /api/books` — list user's books (paginated, with child + template info)
  - `GET /api/books/:id` — book detail with pages (without images if free plan)
  - `DELETE /api/books/:id` — delete book + all S3 assets + jobs
- [ ] `BookRepository` — `findByUser()`, `findWithPages()`

### 3.2 Backend — Symfony Messenger setup
- [ ] Configure Messenger in `config/packages/messenger.yaml`:
  - Transport `async` → Redis (`redis://redis:6379/messages`)
  - Routing: `GenerateStoryMessage` → `async`, `GenerateIllustrationMessage` → `async`, `GeneratePdfMessage` → `async`
  - Failure transport: `failed` (also Redis) for dead-letter queue
  - Retry strategy: 3 attempts, multiplier 2, max delay 10 minutes
- [ ] Message classes in `src/Message/`:
  - `GenerateStoryMessage(int $bookId)`
  - `GenerateIllustrationMessage(int $bookId, int $pageId)`
  - `GeneratePdfMessage(int $bookId)`

### 3.3 Backend — Story generation handler
- [ ] `GenerateStoryHandler` implements `MessageHandlerInterface`:
  1. Load `Book` with `Child` and `Template`
  2. Update `Book.status = processing`, update `Job.status = running`
  3. Build Claude prompt from `Template.promptBlueprint` with child details substituted:
     - Child name, age, appearance, interests, pet
     - Story topic (parent-supplied)
     - Language
     - Instructions: generate N pages, each page = JSON `{ text, imagePrompt }`
  4. Call Claude API (`claude-sonnet-4-5`, streaming or single call)
  5. Parse JSON response → extract pages array
  6. Persist `Page` entities (pageNumber, text, imagePrompt)
  7. Update `Job.status = done`, `Job.finishedAt`
  8. For each page: dispatch `GenerateIllustrationMessage($bookId, $pageId)`
  9. On exception: set `Book.status = failed`, `Job.status = failed`, `Job.errorMessage`
- [ ] `AnthropicService` — wraps Claude API HTTP calls (using `symfony/http-client`):
  - `generateStory(string $prompt): array` — returns parsed pages
  - Configurable model, max tokens, temperature

### 3.4 Frontend — Book status polling
- [ ] After wizard submit → `POST /api/books` → redirect to `/books/:id`
- [ ] `/books/:id` page — uses `useQuery` with `refetchInterval: 3000` while `status !== 'done' && status !== 'failed'`
- [ ] `BookStatusBanner` component:
  - `pending` — "Your story is in the queue…" with animated dots
  - `processing` — "Claude is writing your story…" with progress indicator
  - `done` — show book content
  - `failed` — error message + "Try again" button
- [ ] `/dashboard/books` — list of all user's books with status badges

---

## Phase 4 — Illustrations & PDF

### 4.1 Backend — Illustration generation handler
- [ ] `GenerateIllustrationHandler`:
  1. Load `Page` with its `Book` and `Child`
  2. Enrich `Page.imagePrompt` with child appearance details + style instructions:
     - "Children's book illustration, watercolour style, child-safe, friendly characters"
     - Child appearance description
  3. Call DALL-E 3 API (1024×1024, `standard` quality, `vivid` style)
  4. Download image bytes from OpenAI response URL
  5. Upload to MinIO/S3 via `StorageService`: key = `books/{bookId}/pages/{pageId}.png`
  6. Save `Page.imageS3Key`
  7. Update `Job` record for this page
  8. Check if all pages have `imageS3Key` set → if yes, dispatch `GeneratePdfMessage($bookId)`
- [ ] `OpenAiService` — wraps DALL-E 3 API calls:
  - `generateIllustration(string $prompt): string` — returns image URL
  - Content policy check before dispatch (block inappropriate prompts)

### 4.2 Backend — PDF generation handler
- [ ] `GeneratePdfHandler`:
  1. Load `Book` with all `Pages` ordered by `pageNumber`, with presigned image URLs
  2. Render HTML template (`Twig`) — cover page + one page per chapter
  3. Pass HTML to mPDF:
     - Child-friendly fonts (`Nunito` or `Patrick Hand`)
     - Colourful borders and decorative elements
     - Full-bleed illustrations per page
     - Text block below illustration
  4. Output PDF bytes
  5. Upload PDF to S3: key = `books/{bookId}/book.pdf`
  6. Save `Book.pdfS3Key`
  7. Set `Book.status = done`
  8. Increment `Subscription.booksUsedThisMonth`
- [ ] Twig template: `templates/pdf/book.html.twig`

### 4.3 Backend — Storage service
- [ ] `StorageService`:
  - `upload(string $key, string $content, string $contentType): void`
  - `getPresignedUrl(string $key, int $ttlSeconds = 3600): string`
  - `delete(string $key): void`
  - `exists(string $key): bool`
- [ ] Configured via env: in dev points to MinIO (`http://minio:9000`), in prod to real S3 endpoint — zero code change

### 4.4 Frontend — Book reader
- [ ] On `Book.status = done`:
  - **Free plan**: show text of first 2 pages, blur remaining, "Upgrade to read full story" CTA
  - **Paid plan**: full page-by-page reader
- [ ] `BookReader` component — prev/next navigation, page counter, full-screen mode
- [ ] "Download PDF" button → `GET /api/books/:id/download` → presigned URL → browser download
- [ ] Illustration images loaded from presigned URLs (short TTL, refreshed on demand)

---

## Phase 5 — Subscriptions & Billing

### 5.1 Backend — Stripe integration
- [ ] Create products and prices in Stripe Dashboard: Free, Basic ($9.99/mo), Pro ($19.99/mo)
- [ ] `SubscriptionController`:
  - `POST /api/subscriptions/checkout` — create Stripe Checkout Session, return `{ url }`
  - `POST /api/subscriptions/portal` — create Stripe Customer Portal session, return `{ url }`
  - `GET /api/subscriptions/current` — return current plan, status, usage
  - `POST /api/subscriptions/webhook` — Stripe webhook handler (verify signature)
- [ ] Webhook event handlers in `StripeWebhookService`:
  - `checkout.session.completed` → activate subscription, set plan + limits
  - `invoice.payment_succeeded` → renew period, reset `booksUsedThisMonth`
  - `customer.subscription.updated` → sync plan changes
  - `customer.subscription.deleted` → downgrade to free
- [ ] `SubscriptionService::canCreateBook(User $user): bool` — checks plan limits

### 5.2 Frontend — Billing pages
- [ ] `/pricing` page — plan comparison table (Free / Basic / Pro)
- [ ] "Upgrade" button → `POST /api/subscriptions/checkout` → redirect to Stripe Checkout
- [ ] `/dashboard/billing` page — current plan, books used/remaining this month, "Manage subscription" button (→ Stripe Portal)
- [ ] `useSubscription()` hook — `{ plan, booksUsed, booksLimit, canCreate }`
- [ ] Wizard step 4 — show upgrade prompt if `!canCreate` instead of confirm button
- [ ] Success/cancel return URL pages: `/billing/success`, `/billing/cancelled`

---

## Phase 6 — Referral Program

### 6.1 Backend
- [ ] Generate unique `referralCode` on `User` creation (e.g. `nanoid`, 8 chars)
- [ ] `ReferralController`:
  - `GET /api/referrals/me` — return `{ code, referralUrl, referrals: [...] }`
  - List shows referred users: name, join date, reward status
- [ ] On user registration: if `?ref=CODE` in session → create `Referral { referrerId, refereeId, status: pending }`
- [ ] `ReferralService::rewardReferrer(User $referee)` — called after referee's first payment:
  - Set `Referral.status = rewarded`
  - Apply bonus to referrer (e.g. `booksLimit += 2` for one month, or discount via Stripe coupon)
- [ ] Hook into `StripeWebhookService::handleFirstPayment()` to call `ReferralService`

### 6.2 Frontend
- [ ] `/dashboard/referrals` page:
  - Referral link with copy-to-clipboard button
  - Stats: how many invited, how many converted, total bonuses earned
  - Table of referred users (name, joined date, reward status)

---

## Phase 7 — Ratings & Public Catalog

### 7.1 Backend — Ratings
- [ ] `RatingController`:
  - `POST /api/books/:id/ratings` — submit rating (score 1–5, optional comment); one per user per book
  - `GET /api/books/:id/ratings` — list ratings for a book
- [ ] Aggregate average rating on `Book` entity (computed on save)
- [ ] `TemplateService::getAverageRating(Template $template): float` — based on all books using that template

### 7.2 Backend — Public catalog
- [ ] `CatalogController`:
  - `GET /api/catalog` — public books (`Book.isPublic = true`), paginated
  - Filters: `?templateId=`, `?language=`, `?minRating=`
  - Returns book title, template, language, rating, cover image (first page illustration)
- [ ] `PATCH /api/books/:id/visibility` — toggle `isPublic` (owner only)

### 7.3 Frontend
- [ ] `/catalog` page — public book gallery with filter sidebar
- [ ] `BookCard` — cover image, title, rating stars, template name
- [ ] `StarRating` component — interactive rating input shown after book is done
- [ ] Visibility toggle in `/dashboard/books` list

---

## Phase 8 — Production & DevOps

### 8.1 Production Dockerfiles
- [ ] `backend/Dockerfile` — multi-stage: `composer install --no-dev`, `php-fpm` with OPcache enabled, no dev dependencies
- [ ] `frontend/Dockerfile` — multi-stage: `npm run build` → `nginx:alpine` serving `/dist`
- [ ] `docker-compose.prod.yml` — no volume mounts, uses built images, proper restart policies

### 8.2 CI/CD (GitHub Actions)
- [ ] `.github/workflows/ci.yml`:
  - `php-lint` → `phpstan` (static analysis) → `phpunit` (unit tests)
  - `eslint` → `tsc --noEmit` → `vitest` (frontend tests)
- [ ] `.github/workflows/deploy.yml` — on push to `main`: build images → push to registry → SSH deploy

### 8.3 Security hardening
- [ ] Rate limiting via `symfony/rate-limiter`:
  - `POST /api/books` — max 10/hour per user
  - `POST /api/auth/*` — max 20/hour per IP
- [ ] CORS via `nelmio/cors-bundle` — allow only `APP_FRONTEND_URL`
- [ ] Content moderation: scan story prompts for inappropriate content before sending to Claude/DALL-E
- [ ] Stripe webhook signature verification (`Stripe\Webhook::constructEvent`)
- [ ] All S3 bucket objects private; access only via presigned URLs
- [ ] `helmet` equivalent headers via Nginx config

### 8.4 Monitoring & observability
- [ ] Structured JSON logging via Symfony Monolog
- [ ] `GET /api/health` — checks DB connection, Redis ping, S3 access
- [ ] Sentry integration: `sentry/sentry-symfony` + `@sentry/react`
- [ ] Symfony Messenger monitoring: log job start/end/failure with duration
- [ ] Optional: `flower`-equivalent dashboard for queue inspection (custom admin page)

---

## Phase Dependencies

```
Phase 0 (infrastructure)
    └── Phase 1 (auth)
            └── Phase 2 (children + templates)
                    └── Phase 3 (story generation)
                            └── Phase 4 (illustrations + PDF)
                                    ├── Phase 5 (billing)     ← can start in parallel with Phase 3
                                    ├── Phase 6 (referrals)   ← after Phase 5
                                    ├── Phase 7 (ratings)     ← after Phase 4
                                    └── Phase 8 (production)  ← last
```

---

## Effort Estimates

| Phase | Complexity | Estimated time |
|---|---|---|
| 0 — Infrastructure | Medium | 1–2 days |
| 1 — Authentication | Medium | 1–2 days |
| 2 — Children & Templates | Low | 1 day |
| 3 — Story generation | High | 3–4 days |
| 4 — Illustrations & PDF | High | 3–4 days |
| 5 — Billing | Medium | 2–3 days |
| 6 — Referrals | Low | 1 day |
| 7 — Ratings | Low | 1 day |
| 8 — Production | Medium | 2–3 days |
| **Total** | | **~15–20 working days** |

---

*This roadmap is updated as each phase is completed. Track progress via GitHub Issues.*
