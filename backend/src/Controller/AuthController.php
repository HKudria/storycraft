<?php

namespace App\Controller;

use App\Security\AuthService;
use App\Service\ReferralService;
use App\Service\SubscriptionService;
use Doctrine\ORM\EntityManagerInterface;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

class AuthController extends AbstractController
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly EntityManagerInterface $em,
        private readonly SubscriptionService $subscriptionService,
        private readonly ReferralService $referralService,
        private readonly TranslatorInterface $translator,
    ) {
    }

    #[Route('/api/auth/google', name: 'auth_google', methods: ['GET'])]
    public function googleRedirect(Request $request, ClientRegistry $clientRegistry): Response
    {
        $referralCode = $request->query->get('ref');
        if ($referralCode) {
            $request->getSession()->set('referral_code', $referralCode);
        }

        return $clientRegistry
            ->getClient('google')
            ->redirect(['email', 'profile'], []);
    }

    #[Route('/api/auth/google/callback', name: 'auth_google_callback', methods: ['GET'])]
    public function googleCallback(Request $request, ClientRegistry $clientRegistry): Response
    {
        $client = $clientRegistry->getClient('google');
        $googleUser = $client->fetchUser();

        $user = $this->authService->findOrCreateUser(
            $googleUser->getId(),
            $googleUser->getEmail(),
            $googleUser->getName(),
            $googleUser->getAvatar(),
        );

        $referralCode = $request->getSession()->get('referral_code');
        $request->getSession()->remove('referral_code');
        if ($referralCode) {
            $this->referralService->processReferralCode($user, $referralCode);
        }

        $tokens = $this->authService->issueTokens($user);

        $response = $this->redirect($_ENV['APP_FRONTEND_URL'] . '/auth/callback?token=' . $tokens['accessToken']);
        $response->headers->setCookie($this->createRefreshTokenCookie($tokens['refreshToken']));

        return $response;
    }

    #[Route('/api/auth/dev-login', name: 'auth_dev_login', methods: ['POST'])]
    public function devLogin(Request $request): JsonResponse
    {
        if ($this->getParameter('kernel.environment') !== 'dev') {
            return new JsonResponse(['error' => $this->translator->trans('error.not_available')], Response::HTTP_NOT_FOUND);
        }

        $user = $this->authService->findOrCreateUser(
            'dev:mock',
            'dev@storycraft.test',
            'Developer',
            null,
        );

        $data = json_decode($request->getContent(), true);
        $referralCode = $data['ref'] ?? null;
        if ($referralCode) {
            $this->referralService->processReferralCode($user, $referralCode);
        }

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
            return new JsonResponse(['error' => $this->translator->trans('error.no_refresh_token')], Response::HTTP_UNAUTHORIZED);
        }

        $accessToken = $this->authService->refreshAccessToken($refreshToken);

        if (!$accessToken) {
            $response = new JsonResponse(['error' => $this->translator->trans('error.invalid_refresh_token')], Response::HTTP_UNAUTHORIZED);
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
            'currentPeriodEnd' => $sub['currentPeriodEnd'],
            'pendingPlan' => $sub['pendingPlan'],
            'cancelAtPeriodEnd' => $sub['cancelAtPeriodEnd'],
            'locale' => $user->getLocale(),
        ]);
    }

    #[Route('/api/auth/profile', name: 'auth_profile', methods: ['PUT'])]
    public function updateProfile(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $locale = $data['locale'] ?? null;

        if (!in_array($locale, ['en', 'pl', 'ua', 'ru', 'de'], true)) {
            return new JsonResponse(['error' => 'Invalid locale.'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->getUser();
        $user->setLocale($locale);
        $this->em->flush();

        return new JsonResponse(['locale' => $locale]);
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
