# StoryCraft

AI-powered personalized children's storybook platform. Parents enter child details + topic, and the app generates an illustrated story PDF via AI.

## Screenshots

| Login | Dashboard |
|---|---|
| ![Login page](docs/index.png) | ![Dashboard](docs/dashboard.png) |

| Template selection | Book creation |
|---|---|
| ![Templates](docs/template.png) | ![Creating a book](docs/bookCreating.png) |

| Book detail | Billing |
|---|---|
| ![Book with illustrations](docs/book.png) | ![Subscription management](docs/billing.png) |

## Quick start

```bash
# 1. Copy env templates
cp backend/.env.dist backend/.env
cp frontend/.env.dist frontend/.env

# 2. Edit backend/.env — fill in your API keys

# 3. Start
docker compose up -d --build

# 4. Generate JWT keys
docker compose exec php-fpm mkdir -p config/jwt
docker compose exec php-fpm openssl genrsa -out config/jwt/private.pem 4096
docker compose exec php-fpm openssl rsa -in config/jwt/private.pem -pubout -out config/jwt/public.pem

# 5. Setup database
docker compose exec php-fpm php bin/console doctrine:migration:migrate -n
docker compose exec php-fpm php bin/console doctrine:fixtures:load -n

# 6. Open http://localhost
```

## Environment variables

See `backend/.env.dist` and `frontend/.env.dist` for all required variables.

Key variables to configure:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth ([setup guide](https://console.cloud.google.com/))
- `GEMINI_API_KEY` — Gemini AI for story generation
- `CF_ACCOUNT_ID` / `CF_API_TOKEN` — Cloudflare Workers AI for illustrations
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe billing

## Commands

```bash
# Run tests
docker compose exec php-fpm php bin/phpunit
docker compose exec frontend npm test

# Retry failed jobs
docker compose exec php-fpm php bin/console app:retry-story <bookId>
docker compose exec php-fpm php bin/console app:retry-illustrations <bookId>

# View logs
docker compose exec php-fpm tail -f var/log/dev.log

# Rebuild after dependency changes
docker compose up -d --build
```

## Tech stack

- **Backend:** Symfony 8.1 (PHP 8.4), PostgreSQL, Redis, MinIO
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **AI:** Gemini (story), Cloudflare Workers AI (illustrations)
- **Payments:** Stripe Checkout + Subscriptions
- **Auth:** Google OAuth2 + JWT
