.PHONY: up down logs migrate worker shell-api shell-front \
        prod-up prod-down prod-logs prod-migrate prod-worker prod-shell-api prod-restart

# ── Development ──────────────────────────────────────────────

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	docker compose exec php-fpm php bin/console doctrine:migrations:migrate --no-interaction

fixtures:
	docker compose exec php-fpm php bin/console doctrine:fixtures:load --no-interaction

worker:
	docker compose logs -f worker

shell-api:
	docker compose exec php-fpm bash

shell-front:
	docker compose exec frontend sh

# ── Production ───────────────────────────────────────────────

COMPOSE_PROD = docker compose -f docker-compose.prod.yml

prod-up:
	$(COMPOSE_PROD) up -d --build

prod-down:
	$(COMPOSE_PROD) down

prod-logs:
	$(COMPOSE_PROD) logs -f

prod-migrate:
	$(COMPOSE_PROD) exec php-fpm php bin/console doctrine:migrations:migrate --no-interaction

prod-worker:
	$(COMPOSE_PROD) logs -f worker

prod-shell-api:
	$(COMPOSE_PROD) exec php-fpm bash

prod-restart:
	$(COMPOSE_PROD) up -d --build --force-recreate
