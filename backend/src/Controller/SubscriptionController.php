<?php

namespace App\Controller;

use App\Entity\Subscription;
use App\Service\ReferralService;
use App\Service\SubscriptionService;
use Stripe\Stripe;
use Stripe\Subscription as StripeSubscription;
use Stripe\Checkout\Session as CheckoutSession;
use Stripe\CustomerPortal\Session as PortalSession;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

class SubscriptionController extends AbstractController
{
    private readonly string $stripeKey;

    public function __construct(
        private readonly SubscriptionService $subscriptionService,
        private readonly ReferralService $referralService,
        private readonly TranslatorInterface $translator,
        private readonly string $frontendUrl,
        string $stripeSecretKey,
        private readonly string $basicPriceId,
        private readonly string $proPriceId,
    ) {
        $this->stripeKey = $stripeSecretKey;
    }

    #[Route('/api/subscription', name: 'subscription_current', methods: ['GET'])]
    public function current(): JsonResponse
    {
        return new JsonResponse(
            $this->subscriptionService->getSubscriptionInfo($this->getUser()),
        );
    }

    #[Route('/api/subscription/sync', name: 'subscription_sync', methods: ['POST'])]
    public function sync(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $sub = $user->getSubscription();
        $data = json_decode($request->getContent(), true) ?: [];
        $sessionId = $data['session_id'] ?? null;

        Stripe::setApiKey($this->stripeKey);

        // Sync from checkout session (after redirect from Stripe)
        if ($sessionId) {
            try {
                $session = CheckoutSession::retrieve($sessionId);
                $stripeSubscriptionId = $session->subscription ?? null;
                $stripeCustomerId = $session->customer ?? null;
                $plan = $session->metadata['plan'] ?? null;
                $userId = (int) ($session->client_reference_id ?? 0);

                if ($stripeSubscriptionId) {
                    $stripeSub = StripeSubscription::retrieve($stripeSubscriptionId);
                    $priceId = $stripeSub->items->data[0]->price->id ?? null;
                    [$periodStart, $periodEnd] = $this->getSubscriptionPeriodDates($stripeSub);

                    $this->subscriptionService->activateSubscription(
                        $userId ?: $user->getId(),
                        $plan ?? 'basic',
                        $stripeCustomerId,
                        $stripeSubscriptionId,
                        $periodStart,
                        $periodEnd,
                    );

                    return new JsonResponse($this->subscriptionService->getSubscriptionInfo($user));
                }
            } catch (\Throwable $e) {
                return new JsonResponse(['error' => $this->translator->trans('error.sync_failed') . ': ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }

        // Sync from existing Stripe subscription
        if ($sub?->getStripeSubscriptionId()) {
            try {
                $stripeSub = StripeSubscription::retrieve($sub->getStripeSubscriptionId());
                $priceId = $stripeSub->items->data[0]->price->id ?? null;
                [$periodStart, $periodEnd] = $this->getSubscriptionPeriodDates($stripeSub);
                $this->subscriptionService->syncFromStripe(
                    $sub->getStripeSubscriptionId(),
                    null,
                    $stripeSub->status,
                    $priceId,
                    $periodStart,
                    $periodEnd,
                );
            } catch (\Throwable) {}
        }

        return new JsonResponse($this->subscriptionService->getSubscriptionInfo($user));
    }

    #[Route('/api/subscription/checkout', name: 'subscription_checkout', methods: ['POST'])]
    public function checkout(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $plan = $data['plan'] ?? 'basic';

        if (!in_array($plan, ['basic', 'pro'], true)) {
            return new JsonResponse(['error' => $this->translator->trans('error.invalid_plan')], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->getUser();
        $sub = $user->getSubscription();

        Stripe::setApiKey($this->stripeKey);

        $priceId = $plan === 'pro' ? $this->proPriceId : $this->basicPriceId;

        try {
            $session = CheckoutSession::create([
                'mode' => 'subscription',
                'payment_method_types' => ['card'],
                'customer_email' => $user->getEmail(),
                'client_reference_id' => (string) $user->getId(),
                'line_items' => [[
                    'price' => $priceId,
                    'quantity' => 1,
                ]],
                'success_url' => $this->frontendUrl . '/billing/success?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $this->frontendUrl . '/dashboard/billing',
                'metadata' => [
                    'user_id' => $user->getId(),
                    'plan' => $plan,
                ],
            ]);

            return new JsonResponse(['url' => $session->url]);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/subscription/portal', name: 'subscription_portal', methods: ['POST'])]
    public function portal(): JsonResponse
    {
        $user = $this->getUser();
        $sub = $user->getSubscription();
        $stripeCustomerId = $sub?->getStripeCustomerId();

        if (!$stripeCustomerId) {
            return new JsonResponse(['url' => $this->frontendUrl . '/dashboard/billing']);
        }

        Stripe::setApiKey($this->stripeKey);

        try {
            $session = PortalSession::create([
                'customer' => $stripeCustomerId,
                'return_url' => $this->frontendUrl . '/dashboard/billing',
            ]);

            return new JsonResponse(['url' => $session->url]);
        } catch (\Throwable $e) {
            return new JsonResponse(['url' => $this->frontendUrl . '/dashboard/billing']);
        }
    }

    #[Route('/api/subscription/change', name: 'subscription_change', methods: ['POST'])]
    public function changePlan(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $targetPlan = $data['plan'] ?? null;

        if (!in_array($targetPlan, ['free', 'basic', 'pro'], true)) {
            return new JsonResponse(['error' => $this->translator->trans('error.invalid_plan')], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->getUser();
        $sub = $user->getSubscription();
        $currentPlan = $sub?->getPlan() ?? 'free';

        if ($currentPlan === $targetPlan) {
            return new JsonResponse(['error' => $this->translator->trans('error.already_on_plan')], Response::HTTP_BAD_REQUEST);
        }

        Stripe::setApiKey($this->stripeKey);

        $currentRank = ['free' => 0, 'basic' => 1, 'pro' => 2][$currentPlan] ?? 0;
        $targetRank = ['free' => 0, 'basic' => 1, 'pro' => 2][$targetPlan] ?? 0;
        $isUpgrade = $targetRank > $currentRank;

        // Downgrade or cancel — schedule at period end, no extra charge
        if (!$isUpgrade) {
            return $this->scheduleChange($sub, $targetPlan);
        }

        // Upgrade — no existing Stripe subscription
        $stripeSubId = $sub?->getStripeSubscriptionId();
        if (!$stripeSubId) {
            // Dev mode: apply locally
            $this->subscriptionService->changePlan($user, $targetPlan);
            return new JsonResponse(['success' => true]);
        }

        // Upgrade — existing subscription, update price with proration (charges only the difference)
        $targetPriceId = $this->subscriptionService->getPlanPriceId($targetPlan);

        try {
            $stripeSub = StripeSubscription::retrieve($stripeSubId);
            \Stripe\SubscriptionItem::update($stripeSub->items->data[0]->id, [
                'price' => $targetPriceId,
                'proration_behavior' => 'create_prorations',
            ]);
            $this->subscriptionService->changePlan($user, $targetPlan);

            return new JsonResponse(['success' => true]);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function getSubscriptionPeriodDates(StripeSubscription $stripeSub): array
    {
        // Latest Stripe API removed current_period_start/end from Subscription.
        // Get them from the latest invoice line instead.
        $periodEnd = null;
        $periodStart = null;

        try {
            $invoices = \Stripe\Invoice::all([
                'subscription' => $stripeSub->id,
                'limit' => 1,
            ]);
            if (!empty($invoices->data)) {
                $lines = $invoices->data[0]->lines->data;
                if (!empty($lines)) {
                    $periodStart = $lines[0]->period->start;
                    $periodEnd = $lines[0]->period->end;
                }
            }
        } catch (\Throwable) {}

        return [$periodStart ? (int) $periodStart : null, $periodEnd ? (int) $periodEnd : null];
    }

    #[Route('/api/subscription/revert', name: 'subscription_revert', methods: ['POST'])]
    public function revert(): JsonResponse
    {
        $user = $this->getUser();
        $sub = $user->getSubscription();

        if (!$sub || !$sub->getPendingPlan()) {
            return new JsonResponse(['error' => $this->translator->trans('error.no_pending_change')], Response::HTTP_BAD_REQUEST);
        }

        Stripe::setApiKey($this->stripeKey);

        // No Stripe subscription — just clear locally (dev mode)
        if (!$sub->getStripeSubscriptionId()) {
            $sub->setPendingPlan(null)->setCancelAtPeriodEnd(false);
            $this->subscriptionService->em()->persist($sub);
            $this->subscriptionService->em()->flush();
            return new JsonResponse(['success' => true]);
        }

        try {
            if ($sub->isCancelAtPeriodEnd()) {
                // Revert cancellation to free — remove cancel_at_period_end
                StripeSubscription::update($sub->getStripeSubscriptionId(), [
                    'cancel_at_period_end' => false,
                ]);
            } else {
                // Revert downgrade — restore original price
                $currentPriceId = $this->subscriptionService->getPlanPriceId($sub->getPlan());
                $stripeSub = StripeSubscription::retrieve($sub->getStripeSubscriptionId());
                StripeSubscription::update($sub->getStripeSubscriptionId(), [
                    'items' => [[
                        'id' => $stripeSub->items->data[0]->id,
                        'price' => $currentPriceId,
                    ]],
                    'proration_behavior' => 'none',
                ]);
            }

            $sub->setPendingPlan(null)->setCancelAtPeriodEnd(false);
            $this->subscriptionService->em()->persist($sub);
            $this->subscriptionService->em()->flush();

            return new JsonResponse(['success' => true]);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function scheduleChange(?Subscription $sub, string $targetPlan): JsonResponse
    {
        if (!$sub) {
            return new JsonResponse(['error' => $this->translator->trans('error.no_subscription')], Response::HTTP_BAD_REQUEST);
        }

        // No Stripe subscription — apply locally immediately (dev mode)
        if (!$sub->getStripeSubscriptionId()) {
            $this->subscriptionService->changePlan($this->getUser(), $targetPlan);
            return new JsonResponse(['success' => true]);
        }

        try {
            if ($targetPlan === Subscription::PLAN_FREE) {
                // Cancel: subscription deleted at period end
                StripeSubscription::update($sub->getStripeSubscriptionId(), [
                    'cancel_at_period_end' => true,
                ]);
                $sub->setPendingPlan($targetPlan)
                    ->setCancelAtPeriodEnd(true);
            } else {
                // Downgrade: change price for next billing cycle, subscription continues
                $targetPriceId = $this->subscriptionService->getPlanPriceId($targetPlan);
                $stripeSub = StripeSubscription::retrieve($sub->getStripeSubscriptionId());
                StripeSubscription::update($sub->getStripeSubscriptionId(), [
                    'items' => [[
                        'id' => $stripeSub->items->data[0]->id,
                        'price' => $targetPriceId,
                    ]],
                    'proration_behavior' => 'none',
                ]);
                $sub->setPendingPlan($targetPlan)
                    ->setCancelAtPeriodEnd(false);
            }
            $this->subscriptionService->em()->persist($sub);
            $this->subscriptionService->em()->flush();

            return new JsonResponse(['success' => true]);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/webhooks/stripe', name: 'stripe_webhook', methods: ['POST'])]
    public function webhook(Request $request): JsonResponse
    {
        Stripe::setApiKey($this->stripeKey);

        $payload = $request->getContent();
        $event = json_decode($payload, true);

        if (!$event) {
            return new JsonResponse(['error' => $this->translator->trans('error.invalid_payload')], Response::HTTP_BAD_REQUEST);
        }

        $type = $event['type'] ?? '';
        $object = $event['data']['object'] ?? [];

        switch ($type) {
            case 'checkout.session.completed':
                $userId = (int) ($object['client_reference_id'] ?? 0);
                $plan = $object['metadata']['plan'] ?? 'basic';
                $stripeCustomerId = $object['customer'] ?? null;
                $stripeSubscriptionId = $object['subscription'] ?? null;

                // Fetch period dates from the Stripe subscription
                $periodStart = null;
                $periodEnd = null;
                if ($stripeSubscriptionId) {
                    try {
                        $stripeSub = StripeSubscription::retrieve($stripeSubscriptionId);
                        [$periodStart, $periodEnd] = $this->getSubscriptionPeriodDates($stripeSub);
                    } catch (\Throwable) {}
                }

                if ($userId && $plan) {
                    $this->subscriptionService->activateSubscription(
                        $userId,
                        $plan,
                        $stripeCustomerId,
                        $stripeSubscriptionId,
                        $periodStart,
                        $periodEnd,
                    );

                    $referee = $this->getDoctrine()->getRepository(\App\Entity\User::class)->find($userId);
                    if ($referee) {
                        $this->referralService->rewardReferrer($referee);
                    }
                }
                break;

            case 'customer.subscription.updated':
                $stripeSubscriptionId = $object['id'] ?? null;
                $planName = $object['metadata']['plan'] ?? null;
                $status = $object['status'] ?? null;
                $priceId = $object['items']['data'][0]['price']['id'] ?? null;
                $periodStart = $object['current_period_start'] ?? null;
                $periodEnd = $object['current_period_end'] ?? null;

                // Fallback: fetch period dates from invoice if not in webhook payload
                if (!$periodEnd && $stripeSubscriptionId) {
                    try {
                        $stripeSub = StripeSubscription::retrieve($stripeSubscriptionId);
                        [$periodStart, $periodEnd] = $this->getSubscriptionPeriodDates($stripeSub);
                    } catch (\Throwable) {}
                }

                if ($stripeSubscriptionId) {
                    $this->subscriptionService->syncFromStripe($stripeSubscriptionId, $planName, $status, $priceId, $periodStart, $periodEnd);
                }
                break;

            case 'customer.subscription.deleted':
                $stripeSubscriptionId = $object['id'] ?? null;
                if ($stripeSubscriptionId) {
                    $this->subscriptionService->cancelByStripeId($stripeSubscriptionId);
                }
                break;

            case 'invoice.payment_succeeded':
                $stripeSubscriptionId = $object['subscription'] ?? null;
                if ($stripeSubscriptionId) {
                    $this->subscriptionService->resetUsageByStripeId($stripeSubscriptionId);
                }
                break;
        }

        return new JsonResponse(['received' => true]);
    }
}
