<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HealthController extends AbstractController
{
    #[Route('/api/health', methods: ['GET'])]
    public function __invoke(Connection $connection): JsonResponse
    {
        $db = 'ok';
        try {
            $connection->executeQuery('SELECT 1')->fetchOne();
        } catch (\Throwable) {
            $db = 'error';
        }

        $redis = 'ok';
        try {
            $redisClient = new \Redis();
            $redisClient->connect(
                parse_url($_ENV['REDIS_URL'] ?? 'redis://redis:6379', PHP_URL_HOST) ?? 'redis',
                parse_url($_ENV['REDIS_URL'] ?? 'redis://redis:6379', PHP_URL_PORT) ?? 6379
            );
            $redisClient->ping();
            $redisClient->close();
        } catch (\Throwable) {
            $redis = 'error';
        }

        $status = ($db === 'ok' && $redis === 'ok') ? 'ok' : 'degraded';

        return new JsonResponse([
            'status' => $status,
            'db' => $db,
            'redis' => $redis,
        ], $status === 'ok' ? Response::HTTP_OK : Response::HTTP_SERVICE_UNAVAILABLE);
    }
}
