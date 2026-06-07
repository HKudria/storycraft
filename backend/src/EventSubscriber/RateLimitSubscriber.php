<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

class RateLimitSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly RateLimiterFactoryInterface $bookCreateLimiter,
        private readonly RateLimiterFactoryInterface $authLimiter,
        private readonly TokenStorageInterface $tokenStorage,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => 'onKernelRequest',
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $path = $request->getPathInfo();
        $method = $request->getMethod();

        // Rate limit book creation
        if ($method === 'POST' && $path === '/api/books') {
            $user = $this->tokenStorage->getToken()?->getUser();
            if ($user) {
                $limiter = $this->bookCreateLimiter->create((string) $user->getUserIdentifier());
                if (!$limiter->consume(1)->isAccepted()) {
                    $event->setResponse(new JsonResponse(
                        ['error' => 'Rate limit exceeded. Try again later.'],
                        429
                    ));
                }
            }
        }

        // Rate limit auth endpoints
        if (($method === 'POST' && str_starts_with($path, '/api/auth/'))
            || ($method === 'GET' && str_starts_with($path, '/api/auth/google'))
        ) {
            $limiter = $this->authLimiter->create($request->getClientIp() ?? 'unknown');
            if (!$limiter->consume(1)->isAccepted()) {
                $event->setResponse(new JsonResponse(
                    ['error' => 'Too many requests. Try again later.'],
                    429
                ));
            }
        }
    }
}
