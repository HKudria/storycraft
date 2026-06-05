# StoryCraft — Project Description

## Overview

StoryCraft is a SaaS platform for generating personalised children's storybooks in PDF format, illustrated by AI. Parents enter their child's name, age, appearance, interests, and a story topic — the platform generates a fully illustrated, beautifully formatted storybook ready to download and print.

The target audience is parents who want to give their child a unique, meaningful story featuring the child as the main character. Every book is one-of-a-kind.

---

## Business Model

| Plan | Price | Features |
|---|---|---|
| Free | $0 | 1 book/month, text only, no illustrations, no PDF download |
| Basic | $9.99/mo | 5 books/month, AI illustrations, PDF download |
| Pro | $19.99/mo | Unlimited books, priority queue, multi-language, referral bonuses |

---

## Tech Stack

### Backend — Symfony 8 (PHP 8.4)
- **Symfony 8** — REST API, business logic, authentication flow
- **Doctrine ORM** — database entities, migrations, repositories
- **Symfony Messenger** — async message bus for story and illustration generation jobs
- **LexikJWTAuthenticationBundle** — JWT token issuance and validation
- **KnpU OAuth2 Client Bundle** — Google OAuth2 integration
- **Stripe PHP SDK** — subscription management, webhook handling
- **AWS SDK for PHP** — S3/MinIO file storage (images, PDFs)
- **mPDF** — PDF generation from HTML templates

### Frontend — React 18 + TypeScript
- **React 18** + **TypeScript** — component-based UI with full type safety
- **Vite** — fast dev server and production bundler
- **TailwindCSS** — utility-first styling
- **React Query (TanStack Query)** — server state management, polling for job status
- **React Router v6** — client-side routing
- **Axios** — HTTP client with JWT interceptors

### AI Services
- **Anthropic Claude API** — personalised story text generation, multi-language support, age-appropriate narratives, per-page illustration prompt generation
- **OpenAI DALL-E 3** — per-page illustration generation in a child-friendly illustration style

### Infrastructure
- **PostgreSQL 16** — primary relational database
- **Redis 7** — Symfony Messenger transport (job queue), session cache
- **MinIO** — S3-compatible object storage for local development (images, PDFs)
- **Production storage** — any S3-compatible provider (AWS S3, Cloudflare R2, etc.)
- **Nginx** — reverse proxy: `/api/*` → PHP-FPM, `/` → React dev/build
- **Docker + Docker Compose** — entire local environment in one `docker-compose.yml`
- **Stripe** — subscription billing, Checkout Sessions, Customer Portal, webhooks

---

## Architectural Decisions

### Async Story Generation via Symfony Messenger

Generating a book involves multiple AI API calls (Claude for text, several DALL-E calls for illustrations) and PDF assembly — this can take 30–90 seconds. It must not block an HTTP request.

Flow:
1. `POST /api/stories` — creates a `Book` entity with status `pending`, dispatches a `GenerateStoryMessage` to the Redis-backed Messenger transport, returns `{ bookId, status: "pending" }` immediately
2. The **worker** container consumes `GenerateStoryMessage` → calls Claude API → splits response into pages → saves `Page` entities → dispatches `GenerateIllustrationMessage` per page
3. Each illustration job calls DALL-E 3, uploads the image to MinIO/S3, saves the S3 key on the `Page`
4. Once all illustrations are done, a `GeneratePdfMessage` is dispatched → assembles the PDF → uploads to S3 → sets `Book.status = done`
5. Frontend polls `GET /api/stories/:id` every 3 seconds via React Query until status is `done` or `failed`

### Separate Worker Container

The Messenger consumer runs in a dedicated `worker` Docker service (`bin/console messenger:consume async`), completely separate from the web process (PHP-FPM). This means slow AI jobs never affect API response times.

### Google OAuth2 → JWT

No passwords. Auth flow:
1. Frontend redirects to `GET /api/auth/google`
2. Symfony handles Google callback, finds or creates `User`
3. Symfony issues a short-lived `accessToken` (JWT, 15 min) and a long-lived `refreshToken` (stored in DB, 7 days)
4. Tokens returned via secure `httpOnly` cookie + redirect to frontend dashboard

### File Storage Abstraction

A `StorageService` wraps the AWS SDK. In development it points to MinIO (`minio:9000`). In production, just change the env vars to point at any S3-compatible provider — zero code changes. Files are stored by key; presigned URLs are generated on demand with a short TTL.

---

## Database Entities

### User
```
id, googleId, email, name, avatarUrl
referralCode (unique)
createdAt, updatedAt
→ hasMany: Children, Books, Subscription (1:1), Ratings
```

### Child
One parent can have multiple children. Each child's details (name, age, appearance, interests, pet) are used to personalise both the story text and illustration prompts.
```
id, userId (FK)
name, age, gender
appearance, interests, petName
createdAt, updatedAt
→ hasMany: Books
```

### Template
Preset story blueprints (Adventure, Bedtime, Educational, Fairy Tale, etc.). Contains the Claude prompt blueprint with placeholders.
```
id, title, description
category, ageMin, ageMax
promptBlueprint       // Claude prompt with {childName}, {topic}, {age} placeholders
coverImageUrl
isActive
```

### Book
The core entity. Ties together user, child, and template. Tracks generation status.
```
id, userId (FK), childId (FK), templateId (FK)
title, language
topic                 // parent-supplied story topic
status                // pending | processing | done | failed
pdfS3Key
isPublic
createdAt, updatedAt
→ hasMany: Pages, Jobs, Ratings
```

### Page
One book has multiple pages. Each page has generated text and an AI illustration.
```
id, bookId (FK)
pageNumber
text                  // generated by Claude
imagePrompt           // generated by Claude, passed to DALL-E
imageS3Key            // uploaded illustration
createdAt
```

### Job
Logs every async job dispatched through Symfony Messenger. Enables status tracking, retry history, and debugging.
```
id, bookId (FK)
type                  // generate_story | generate_illustration | generate_pdf
status                // queued | running | done | failed
attempts, errorMessage
startedAt, finishedAt
createdAt
```

### Subscription
Manages user plan and usage. Tied to Stripe.
```
id, userId (FK) [unique]
plan                  // free | basic | pro
status                // active | cancelled | past_due
stripeSubscriptionId, stripeCustomerId
currentPeriodStart, currentPeriodEnd
booksUsedThisMonth, booksLimit
```

### Rating
Users can rate a book after generation.
```
id, bookId (FK), userId (FK) [unique per book]
score                 // 1–5
comment
createdAt
```

### Referral
```
id
referrerId (FK → User)
refereeId  (FK → User)
status                // pending | rewarded
rewardedAt, createdAt
```

---

## Entity Relationships

```
User ──< Child
User ──< Book
User ──1 Subscription
User ──< Rating
User ── Referral (as referrer or referee)
Child ──< Book
Template ──< Book
Book ──< Page
Book ──< Job
Book ──< Rating
```

---

## Docker Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| nginx | nginx:alpine | 80 | Reverse proxy |
| php-fpm | php:8.4-fpm (custom) | 9000 | Symfony web process |
| worker | php:8.4-fpm (custom) | — | Messenger consumer |
| postgres | postgres:16 | 5432 | Primary database |
| redis | redis:7-alpine | 6379 | Queue + cache |
| minio | minio/minio | 9000/9001 | S3-compatible storage (dev) |
| frontend | node:20-alpine (custom) | 5173 | Vite dev server |

All services share a single `docker-compose.yml` in the project root. Each has its own `Dockerfile` in its respective directory.

---

## Project Structure

```
storycraft/
├── docker-compose.yml
├── .env.example
├── Makefile
├── nginx/
│   └── default.conf
├── backend/                   # Symfony 8
│   ├── Dockerfile
│   ├── src/
│   │   ├── Controller/
│   │   ├── Entity/
│   │   ├── Message/           # Messenger message classes
│   │   ├── MessageHandler/    # Messenger handlers (workers)
│   │   ├── Repository/
│   │   ├── Service/
│   │   └── Security/          # Google OAuth, JWT
│   ├── config/
│   ├── migrations/
│   └── .env
└── frontend/                  # React 18 + TypeScript + Vite
    ├── Dockerfile
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── hooks/
    │   ├── api/
    │   ├── store/
    │   └── types/
    ├── public/
    └── vite.config.ts
```

---

*This document is updated as development progresses.*

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/google` | No | Redirect to Google OAuth consent screen |
| GET | `/api/auth/google/callback` | No | Google OAuth callback, issues JWT + refresh cookie |
| POST | `/api/auth/dev-login` | No | Dev-only: creates/finds mock user, issues JWT (dev env only) |
| POST | `/api/auth/refresh` | Cookie | Refresh access token using httpOnly refresh cookie |
| POST | `/api/auth/logout` | JWT | Invalidate refresh token, clear cookie |
| GET | `/api/auth/me` | JWT | Return current user profile (id, email, name, avatarUrl, plan) |

### Children

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/children` | JWT | List current user's children (excludes soft-deleted) |
| POST | `/api/children` | JWT | Create child (name, age required; gender, appearance, interests, petName optional) |
| GET | `/api/children/{id}` | JWT | Get child detail (ownership check) |
| PUT | `/api/children/{id}` | JWT | Update child (ownership check) |
| DELETE | `/api/children/{id}` | JWT | Soft delete child (ownership check) |

### Templates

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/templates` | No | List active templates. Query: `?category=&ageMin=&ageMax=` |
| GET | `/api/templates/{id}` | No | Template detail |

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check (status, db, redis) |

---

## Frontend Routes

| Path | Auth | Page |
|---|---|---|
| `/login` | No | Login page (Google OAuth + dev login) |
| `/auth/callback` | No | OAuth callback handler (stores token from URL) |
| `/dashboard` | Yes | Dashboard with navigation cards |
| `/dashboard/children` | Yes | Children management (add, edit, delete) |
| `/templates` | No | Template catalog with category filters |
| `/books/new` | Yes | 4-step story wizard (child → template → customise → review) |
| `/books/:id` | Yes | Book detail (placeholder) |
