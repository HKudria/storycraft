.PHONY: up down logs migrate worker shell-api shell-front

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
