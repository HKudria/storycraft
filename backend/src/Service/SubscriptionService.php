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
        ];
    }

    public function changePlan(User $user, string $plan): void
    {
        $sub = $this->getOrCreateSubscription($user);
        $sub->setPlan($plan);
        $sub->setBooksLimit(self::PLAN_LIMITS[$plan] ?? 1);
        $this->em->flush();
    }

    public function resetMonthlyUsage(User $user): void
    {
        $sub = $this->getOrCreateSubscription($user);
        $sub->setBooksUsedThisMonth(0);
        $this->em->flush();
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
}
