<?php

namespace App\Controller;

use App\Security\AuthService;
use App\Service\SubscriptionService;
use Doctrine\ORM\EntityManagerInterface;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class AuthController extends AbstractController
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly EntityManagerInterface $em,
        private readonly SubscriptionService $subscriptionService,
    ) {
    }

    #[Route('/api/auth/google', name: 'auth_google', methods: ['GET'])]
    public function googleRedirect(ClientRegistry $clientRegistry): Response
    {
        return $clientRegistry
            ->getClient('google')
            ->redirect(['email', 'profile'], []);
    }

    #[Route('/api/auth/google/callback', name: 'auth_google_callback', methods: ['GET'])]
    public function googleCallback(ClientRegistry $clientRegistry): Response
    {
        $client = $clientRegistry->getClient('google');
        $googleUser = $client->fetchUser();

        $user = $this->authService->findOrCreateUser(
            $googleUser->getId(),
            $googleUser->getEmail(),
            $googleUser->getName(),
            $googleUser->getAvatar(),
        );

        $tokens = $this->authService->issueTokens($user);

        $response = $this->redirect($_ENV['APP_FRONTEND_URL'] . '/auth/callback?token=' . $tokens['accessToken']);
        $response->headers->setCookie($this->createRefreshTokenCookie($tokens['refreshToken']));

        return $response;
    }

    #[Route('/api/auth/dev-login', name: 'auth_dev_login', methods: ['POST'])]
    public function devLogin(): JsonResponse
    {
        if ($this->getParameter('kernel.environment') !== 'dev') {
            return new JsonResponse(['error' => 'Not available'], Response::HTTP_NOT_FOUND);
        }

        $user = $this->authService->findOrCreateUser(
            'dev:mock',
            'dev@storycraft.test',
            'Developer',
            null,
        );

        $tokens = $this->authService->issueTokens($user);

        $response = new JsonResponse(['accessToken' => $tokens['accessToken']]);
        $response->headers->setCookie($this->createRefreshTokenCookie($tokens['refreshToken']));

        return $response;
    }

    #[Route('/api/auth/refresh', name: 'auth_refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $request->cookies->get('refreshToken');

        if (!$refreshToken) {
            return new JsonResponse(['error' => 'No refresh token'], Response::HTTP_UNAUTHORIZED);
        }

        $accessToken = $this->authService->refreshAccessToken($refreshToken);

        if (!$accessToken) {
            $response = new JsonResponse(['error' => 'Invalid or expired refresh token'], Response::HTTP_UNAUTHORIZED);
            $response->headers->clearCookie('refreshToken');
            return $response;
        }

        return new JsonResponse(['accessToken' => $accessToken]);
    }

    #[Route('/api/auth/logout', name: 'auth_logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        $user = $this->getUser();

        if ($user) {
            $this->authService->invalidateRefreshToken($user);
        }

        $response = new JsonResponse(null, Response::HTTP_NO_CONTENT);
        $response->headers->clearCookie('refreshToken');

        return $response;
    }

    #[Route('/api/auth/me', name: 'auth_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();
        $sub = $this->subscriptionService->getSubscriptionInfo($user);

        return new JsonResponse([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'avatarUrl' => $user->getAvatarUrl(),
            'plan' => $sub['plan'],
            'booksUsed' => $sub['booksUsed'],
            'booksLimit' => $sub['booksLimit'],
            'canCreate' => $sub['canCreate'],
        ]);
    }

    private function createRefreshTokenCookie(string $refreshToken): Cookie
    {
        return Cookie::create('refreshToken')
            ->withValue($refreshToken)
            ->withHttpOnly(true)
            ->withSameSite('lax')
            ->withPath('/api/auth')
            ->withSecure(false)
            ->withExpires(time() + 7 * 86400);
    }
}
