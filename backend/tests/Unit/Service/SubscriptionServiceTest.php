<?php

namespace App\Tests\Unit\Service;

use App\Entity\Subscription;
use App\Entity\User;
use App\Service\SubscriptionService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;

class SubscriptionServiceTest extends TestCase
{
    private EntityManagerInterface $em;
    private EntityRepository $subRepo;
    private EntityRepository $userRepo;
    private SubscriptionService $service;

    protected function setUp(): void
    {
        $this->subRepo = $this->createMock(EntityRepository::class);
        $this->userRepo = $this->createMock(EntityRepository::class);

        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->em->method('getRepository')->willReturnCallback(
            fn(string $class) => match ($class) {
                Subscription::class => $this->subRepo,
                User::class => $this->userRepo,
                default => $this->createMock(EntityRepository::class),
            }
        );

        $this->service = new SubscriptionService(
            $this->em,
            'price_basic',
            'price_pro',
        );
    }

    private function createUser(int $id): User
    {
        $user = new User();
        $reflection = new \ReflectionClass($user);
        $prop = $reflection->getProperty('id');
        $prop->setValue($user, $id);
        return $user;
    }

    private function createSubscription(User $user): Subscription
    {
        $sub = new Subscription();
        $sub->setUser($user);
        return $sub;
    }

    public function testCanCreateBookActiveUnderLimit(): void
    {
        $user = $this->createUser(1);
        $sub = $this->createSubscription($user);
        $sub->setStatus(Subscription::STATUS_ACTIVE);
        $sub->setBooksLimit(5);
        $sub->setBooksUsedThisMonth(3);

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->assertTrue($this->service->canCreateBook($user));
    }

    public function testCanCreateBookAtLimit(): void
    {
        $user = $this->createUser(1);
        $sub = $this->createSubscription($user);
        $sub->setStatus(Subscription::STATUS_ACTIVE);
        $sub->setBooksLimit(5);
        $sub->setBooksUsedThisMonth(5);

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->assertFalse($this->service->canCreateBook($user));
    }

    public function testCanCreateBookCancelledSubscription(): void
    {
        $user = $this->createUser(1);
        $sub = $this->createSubscription($user);
        $sub->setStatus(Subscription::STATUS_CANCELLED);
        $sub->setBooksLimit(5);
        $sub->setBooksUsedThisMonth(0);

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->assertFalse($this->service->canCreateBook($user));
    }

    public function testChangePlanToPro(): void
    {
        $user = $this->createUser(1);
        $sub = $this->createSubscription($user);

        $this->subRepo->method('findOneBy')->willReturn($sub);
        $this->em->expects($this->once())->method('flush');

        $this->service->changePlan($user, Subscription::PLAN_PRO);

        $this->assertSame(Subscription::PLAN_PRO, $sub->getPlan());
        $this->assertSame(999, $sub->getBooksLimit());
    }

    public function testChangePlanToBasic(): void
    {
        $user = $this->createUser(1);
        $sub = $this->createSubscription($user);

        $this->subRepo->method('findOneBy')->willReturn($sub);
        $this->em->expects($this->once())->method('flush');

        $this->service->changePlan($user, Subscription::PLAN_BASIC);

        $this->assertSame(Subscription::PLAN_BASIC, $sub->getPlan());
        $this->assertSame(5, $sub->getBooksLimit());
    }

    public function testChangePlanUnknownDefaultsToLimit1(): void
    {
        $user = $this->createUser(1);
        $sub = $this->createSubscription($user);

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->service->changePlan($user, 'unknown_plan');

        $this->assertSame('unknown_plan', $sub->getPlan());
        $this->assertSame(1, $sub->getBooksLimit());
    }

    public function testActivateSubscriptionUserNotFound(): void
    {
        $this->userRepo->method('find')->willReturn(null);
        $this->em->expects($this->never())->method('flush');

        $this->service->activateSubscription(999, Subscription::PLAN_PRO);
    }

    public function testActivateSubscriptionHappyPath(): void
    {
        $user = $this->createUser(1);
        $sub = $this->createSubscription($user);

        $this->userRepo->method('find')->willReturn($user);
        $this->subRepo->method('findOneBy')->willReturn($sub);
        $this->em->expects($this->once())->method('flush');

        $this->service->activateSubscription(
            1,
            Subscription::PLAN_PRO,
            'cus_123',
            'sub_456',
            1000000,
            2000000,
        );

        $this->assertSame(Subscription::PLAN_PRO, $sub->getPlan());
        $this->assertSame(Subscription::STATUS_ACTIVE, $sub->getStatus());
        $this->assertSame(999, $sub->getBooksLimit());
        $this->assertSame('cus_123', $sub->getStripeCustomerId());
        $this->assertSame('sub_456', $sub->getStripeSubscriptionId());
        $this->assertNull($sub->getPendingPlan());
        $this->assertFalse($sub->isCancelAtPeriodEnd());
        $this->assertNotNull($sub->getCurrentPeriodStart());
        $this->assertNotNull($sub->getCurrentPeriodEnd());
    }

    public function testActivateSubscriptionOptionalParamsNull(): void
    {
        $user = $this->createUser(1);
        $sub = $this->createSubscription($user);

        $this->userRepo->method('find')->willReturn($user);
        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->service->activateSubscription(1, Subscription::PLAN_BASIC);

        $this->assertSame(Subscription::PLAN_BASIC, $sub->getPlan());
        $this->assertNull($sub->getStripeCustomerId());
        $this->assertNull($sub->getStripeSubscriptionId());
        $this->assertNull($sub->getCurrentPeriodStart());
        $this->assertNull($sub->getCurrentPeriodEnd());
    }

    public function testSyncFromStripeSubscriptionNotFound(): void
    {
        $this->subRepo->method('findOneBy')->willReturn(null);
        $this->em->expects($this->never())->method('flush');

        $this->service->syncFromStripe('sub_missing', Subscription::PLAN_BASIC);
    }

    public function testSyncFromStripeWithPriceId(): void
    {
        $sub = $this->createSubscription($this->createUser(1));

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->service->syncFromStripe('sub_123', null, 'active', 'price_pro');

        $this->assertSame(Subscription::PLAN_PRO, $sub->getPlan());
        $this->assertSame(999, $sub->getBooksLimit());
        $this->assertSame(Subscription::STATUS_ACTIVE, $sub->getStatus());
    }

    public function testSyncFromStripePastDueStatus(): void
    {
        $sub = $this->createSubscription($this->createUser(1));

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->service->syncFromStripe('sub_123', Subscription::PLAN_BASIC, 'past_due');

        $this->assertSame(Subscription::STATUS_PAST_DUE, $sub->getStatus());
    }

    public function testSyncFromStripeUnknownPriceIdNoPlan(): void
    {
        $sub = $this->createSubscription($this->createUser(1));
        $sub->setPlan(Subscription::PLAN_PRO);

        $this->subRepo->method('findOneBy')->willReturn($sub);
        $this->em->expects($this->never())->method('flush');

        $this->service->syncFromStripe('sub_123', null, 'active', 'price_unknown');

        $this->assertSame(Subscription::PLAN_PRO, $sub->getPlan());
    }

    public function testCancelNotFound(): void
    {
        $this->subRepo->method('findOneBy')->willReturn(null);
        $this->em->expects($this->never())->method('flush');

        $this->service->cancelByStripeId('sub_missing');
    }

    public function testCancelWithPendingPaidPlan(): void
    {
        $sub = $this->createSubscription($this->createUser(1));
        $sub->setPendingPlan(Subscription::PLAN_BASIC);

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->service->cancelByStripeId('sub_123');

        $this->assertSame(Subscription::PLAN_BASIC, $sub->getPlan());
        $this->assertSame(5, $sub->getBooksLimit());
        $this->assertNull($sub->getPendingPlan());
        $this->assertFalse($sub->isCancelAtPeriodEnd());
    }

    public function testCancelWithPendingFreePlan(): void
    {
        $sub = $this->createSubscription($this->createUser(1));
        $sub->setStripeSubscriptionId('sub_123');
        $sub->setPendingPlan(Subscription::PLAN_FREE);

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->service->cancelByStripeId('sub_123');

        $this->assertSame(Subscription::PLAN_FREE, $sub->getPlan());
        $this->assertSame(Subscription::STATUS_CANCELLED, $sub->getStatus());
        $this->assertNull($sub->getStripeSubscriptionId());
        $this->assertNull($sub->getPendingPlan());
        $this->assertFalse($sub->isCancelAtPeriodEnd());
    }

    public function testCancelWithoutPendingPlan(): void
    {
        $sub = $this->createSubscription($this->createUser(1));
        $sub->setPlan(Subscription::PLAN_PRO);
        $sub->setStripeSubscriptionId('sub_123');

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->service->cancelByStripeId('sub_123');

        $this->assertSame(Subscription::PLAN_FREE, $sub->getPlan());
        $this->assertSame(Subscription::STATUS_CANCELLED, $sub->getStatus());
        $this->assertNull($sub->getStripeSubscriptionId());
    }

    public function testResetUsageNotFound(): void
    {
        $this->subRepo->method('findOneBy')->willReturn(null);
        $this->em->expects($this->never())->method('flush');

        $this->service->resetUsageByStripeId('sub_missing');
    }

    public function testResetUsageWithPendingPlan(): void
    {
        $sub = $this->createSubscription($this->createUser(1));
        $sub->setBooksUsedThisMonth(5);
        $sub->setPendingPlan(Subscription::PLAN_PRO);

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->service->resetUsageByStripeId('sub_123');

        $this->assertSame(0, $sub->getBooksUsedThisMonth());
        $this->assertSame(Subscription::PLAN_PRO, $sub->getPlan());
        $this->assertSame(999, $sub->getBooksLimit());
        $this->assertNull($sub->getPendingPlan());
        $this->assertFalse($sub->isCancelAtPeriodEnd());
    }

    public function testResetUsageNoPendingPlan(): void
    {
        $sub = $this->createSubscription($this->createUser(1));
        $sub->setBooksUsedThisMonth(3);

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $this->service->resetUsageByStripeId('sub_123');

        $this->assertSame(0, $sub->getBooksUsedThisMonth());
    }

    public function testGetOrCreateExisting(): void
    {
        $user = $this->createUser(1);
        $sub = $this->createSubscription($user);

        $this->subRepo->method('findOneBy')->willReturn($sub);

        $info = $this->service->getSubscriptionInfo($user);

        $this->assertSame(Subscription::PLAN_FREE, $info['plan']);
        $this->assertSame(Subscription::STATUS_ACTIVE, $info['status']);
    }

    public function testGetOrCreateNew(): void
    {
        $user = $this->createUser(1);

        $this->subRepo->method('findOneBy')->willReturn(null);
        $this->em->expects($this->exactly(2))->method('persist');
        $this->em->expects($this->atLeastOnce())->method('flush');

        $info = $this->service->getSubscriptionInfo($user);

        $this->assertSame(Subscription::PLAN_FREE, $info['plan']);
    }

    public function testGetPlanPriceIdBasic(): void
    {
        $this->assertSame('price_basic', $this->service->getPlanPriceId(Subscription::PLAN_BASIC));
    }

    public function testGetPlanPriceIdPro(): void
    {
        $this->assertSame('price_pro', $this->service->getPlanPriceId(Subscription::PLAN_PRO));
    }

    public function testGetPlanPriceIdUnknown(): void
    {
        $this->assertNull($this->service->getPlanPriceId('unknown'));
    }

    public function testIncrementUsage(): void
    {
        $user = $this->createUser(1);
        $sub = $this->createSubscription($user);
        $sub->setBooksUsedThisMonth(2);

        $this->subRepo->method('findOneBy')->willReturn($sub);
        $this->em->expects($this->once())->method('flush');

        $this->service->incrementUsage($user);

        $this->assertSame(3, $sub->getBooksUsedThisMonth());
    }
}
