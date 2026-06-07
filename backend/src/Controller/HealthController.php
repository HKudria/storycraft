<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Redis;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HealthController extends AbstractController
{
    public function __construct(
        private readonly Connection $connection,
        private readonly string $redisHost = 'redis',
        private readonly int $redisPort = 6379,
    ) {
    }

    #[Route('/api/health', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $checks = [
            'db' => $this->checkDb(),
            'redis' => $this->checkRedis(),
        ];

        $status = in_array('error', $checks, true) ? 'degraded' : 'ok';

        return new JsonResponse(
            array_merge(['status' => $status], $checks),
            $status === 'ok' ? Response::HTTP_OK : Response::HTTP_SERVICE_UNAVAILABLE,
        );
    }

    private function checkDb(): string
    {
        try {
            $this->connection->executeQuery('SELECT 1')->fetchOne();
            return 'ok';
        } catch (\Throwable) {
            return 'error';
        }
    }

    private function checkRedis(): string
    {
        try {
            $redis = new Redis();
            $redis->connect($this->redisHost, $this->redisPort, 2);
            $redis->ping();
            $redis->close();
            return 'ok';
        } catch (\Throwable) {
            return 'error';
        }
    }
}
