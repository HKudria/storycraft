<?php

namespace App\Service;

use App\Entity\Subscription;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class SubscriptionService
{
    public const PLAN_LIMITS = [
        Subscription::PLAN_FREE => 1,
        Subscription::PLAN_BASIC => 5,
        Subscription::PLAN_PRO => 999,
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly string $basicPriceId = '',
        private readonly string $proPriceId = '',
    ) {
    }

    public function canCreateBook(User $user): bool
    {
        $sub = $this->getOrCreateSubscription($user);

        return $sub->getStatus() === Subscription::STATUS_ACTIVE
            && $sub->getBooksUsedThisMonth() < $sub->getBooksLimit();
    }

    public function incrementUsage(User $user): void
    {
        $sub = $this->getOrCreateSubscription($user);
        $sub->setBooksUsedThisMonth($sub->getBooksUsedThisMonth() + 1);
        $this->em->flush();
    }

    public function getSubscriptionInfo(User $user): array
    {
        $sub = $this->getOrCreateSubscription($user);

        return [
            'plan' => $sub->getPlan(),
            'status' => $sub->getStatus(),
            'booksUsed' => $sub->getBooksUsedThisMonth(),
            'booksLimit' => $sub->getBooksLimit(),
            'canCreate' => $this->canCreateBook($user),
            'pendingPlan' => $sub->getPendingPlan(),
            'cancelAtPeriodEnd' => $sub->isCancelAtPeriodEnd(),
            'currentPeriodEnd' => $sub->getCurrentPeriodEnd()?->format('c'),
        ];
    }

    public function changePlan(User $user, string $plan): void
    {
        $sub = $this->getOrCreateSubscription($user);
        $sub->setPlan($plan);
        $sub->setBooksLimit(self::PLAN_LIMITS[$plan] ?? 1);
        $this->em->flush();
    }

    public function activateSubscription(int $userId, string $plan, ?string $stripeCustomerId = null, ?string $stripeSubscriptionId = null, ?int $periodStart = null, ?int $periodEnd = null): void
    {
        $user = $this->em->getRepository(User::class)->find($userId);
        if (!$user) {
            return;
        }

        $sub = $this->getOrCreateSubscription($user);
        $sub->setPlan($plan)
            ->setStatus(Subscription::STATUS_ACTIVE)
            ->setBooksLimit(self::PLAN_LIMITS[$plan] ?? 1)
            ->setPendingPlan(null)
            ->setCancelAtPeriodEnd(false);

        if ($stripeCustomerId) {
            $sub->setStripeCustomerId($stripeCustomerId);
        }
        if ($stripeSubscriptionId) {
            $sub->setStripeSubscriptionId($stripeSubscriptionId);
        }
        if ($periodStart) {
            $sub->setCurrentPeriodStart(new \DateTimeImmutable("@{$periodStart}"));
        }
        if ($periodEnd) {
            $sub->setCurrentPeriodEnd(new \DateTimeImmutable("@{$periodEnd}"));
        }

        $this->em->flush();
    }

    public function syncFromStripe(string $stripeSubscriptionId, ?string $plan, ?string $status = null, ?string $priceId = null, ?int $periodStart = null, ?int $periodEnd = null): void
    {
        $sub = $this->em->getRepository(Subscription::class)->findOneBy(['stripeSubscriptionId' => $stripeSubscriptionId]);
        if (!$sub) {
            return;
        }

        if ($priceId) {
            $plan = $this->resolvePlanFromPriceId($priceId);
        }
        if (!$plan) {
            return;
        }
        if (!$plan) {
            return;
        }

        $sub->setPlan($plan)
            ->setBooksLimit(self::PLAN_LIMITS[$plan] ?? 1);

        if ($status === 'active') {
            $sub->setStatus(Subscription::STATUS_ACTIVE);
        } elseif ($status === 'past_due') {
            $sub->setStatus(Subscription::STATUS_PAST_DUE);
        }

        if ($periodStart) {
            $sub->setCurrentPeriodStart(new \DateTimeImmutable("@{$periodStart}"));
        }
        if ($periodEnd) {
            $sub->setCurrentPeriodEnd(new \DateTimeImmutable("@{$periodEnd}"));
        }

        $this->em->flush();
    }

    public function cancelByStripeId(string $stripeSubscriptionId): void
    {
        $sub = $this->em->getRepository(Subscription::class)->findOneBy(['stripeSubscriptionId' => $stripeSubscriptionId]);
        if (!$sub) {
            return;
        }

        if ($sub->getPendingPlan() && $sub->getPendingPlan() !== Subscription::PLAN_FREE) {
            // Downgrade to another paid plan — subscription was re-created by Stripe with new price
            $plan = $sub->getPendingPlan();
            $sub->setPlan($plan)
                ->setBooksLimit(self::PLAN_LIMITS[$plan] ?? 1)
                ->setPendingPlan(null)
                ->setCancelAtPeriodEnd(false);
        } elseif ($sub->getPendingPlan() === Subscription::PLAN_FREE) {
            $sub->setPlan(Subscription::PLAN_FREE)
                ->setStatus(Subscription::STATUS_CANCELLED)
                ->setBooksLimit(self::PLAN_LIMITS[Subscription::PLAN_FREE])
                ->setStripeSubscriptionId(null)
                ->setPendingPlan(null)
                ->setCancelAtPeriodEnd(false);
        } else {
            $sub->setPlan(Subscription::PLAN_FREE)
                ->setStatus(Subscription::STATUS_CANCELLED)
                ->setBooksLimit(self::PLAN_LIMITS[Subscription::PLAN_FREE])
                ->setStripeSubscriptionId(null);
        }

        $this->em->flush();
    }

    public function resetUsageByStripeId(string $stripeSubscriptionId): void
    {
        $sub = $this->em->getRepository(Subscription::class)->findOneBy(['stripeSubscriptionId' => $stripeSubscriptionId]);
        if (!$sub) {
            return;
        }

        $sub->setBooksUsedThisMonth(0);

        // Apply pending plan change on renewal
        if ($sub->getPendingPlan() && $sub->getPendingPlan() !== Subscription::PLAN_FREE) {
            $plan = $sub->getPendingPlan();
            $sub->setPlan($plan)
                ->setBooksLimit(self::PLAN_LIMITS[$plan] ?? 1)
                ->setPendingPlan(null)
                ->setCancelAtPeriodEnd(false);
        }

        $this->em->flush();
    }

    public function resetMonthlyUsage(User $user): void
    {
        $sub = $this->getOrCreateSubscription($user);
        $sub->setBooksUsedThisMonth(0);
        $this->em->flush();
    }

    public function em(): EntityManagerInterface
    {
        return $this->em;
    }

    private function getOrCreateSubscription(User $user): Subscription
    {
        $sub = $this->em->getRepository(Subscription::class)->findOneBy(['user' => $user]);

        if ($sub === null) {
            $sub = new Subscription();
            $sub->setUser($user);
            $this->em->persist($sub);
            $this->em->flush();
        }

        return $sub;
    }

    private function resolvePlanFromPriceId(string $priceId): ?string
    {
        return match ($priceId) {
            $this->basicPriceId => Subscription::PLAN_BASIC,
            $this->proPriceId => Subscription::PLAN_PRO,
            default => null,
        };
    }

    public function getPlanPriceId(string $plan): ?string
    {
        return match ($plan) {
            Subscription::PLAN_BASIC => $this->basicPriceId,
            Subscription::PLAN_PRO => $this->proPriceId,
            default => null,
        };
    }
}
