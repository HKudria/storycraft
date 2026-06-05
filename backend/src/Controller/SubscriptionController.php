<?php

namespace App\Controller;

use App\Service\SubscriptionService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class SubscriptionController extends AbstractController
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService,
        private readonly string $frontendUrl,
    ) {
    }

    #[Route('/api/subscription', name: 'subscription_current', methods: ['GET'])]
    public function current(): JsonResponse
    {
        return new JsonResponse(
            $this->subscriptionService->getSubscriptionInfo($this->getUser()),
        );
    }

    #[Route('/api/subscription/checkout', name: 'subscription_checkout', methods: ['POST'])]
    public function checkout(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $plan = $data['plan'] ?? 'basic';

        if (!in_array($plan, ['basic', 'pro'], true)) {
            return new JsonResponse(['error' => 'Invalid plan.'], Response::HTTP_BAD_REQUEST);
        }

        // TODO: replace with real Stripe Checkout Session when keys are available
        $this->subscriptionService->changePlan($this->getUser(), $plan);

        return new JsonResponse(['url' => $this->frontendUrl . '/billing/success']);
    }

    #[Route('/api/subscription/portal', name: 'subscription_portal', methods: ['POST'])]
    public function portal(): JsonResponse
    {
        // TODO: replace with real Stripe Customer Portal Session
        return new JsonResponse(['url' => $this->frontendUrl . '/dashboard/billing']);
    }

    #[Route('/api/webhooks/stripe', name: 'stripe_webhook', methods: ['POST'])]
    public function webhook(): JsonResponse
    {
        // TODO: verify Stripe signature and handle events
        return new JsonResponse(['received' => true]);
    }
}
