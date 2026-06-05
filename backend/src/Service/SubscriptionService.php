<?php

namespace App\Service;

use App\Entity\Subscription;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class SubscriptionService
{
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
