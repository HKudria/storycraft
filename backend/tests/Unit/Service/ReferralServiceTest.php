<?php

namespace App\Tests\Unit\Service;

use App\Entity\Referral;
use App\Entity\Subscription;
use App\Entity\User;
use App\Repository\ReferralRepository;
use App\Repository\UserRepository;
use App\Security\AuthService;
use App\Service\ReferralService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

class ReferralServiceTest extends TestCase
{
    private EntityManagerInterface $em;
    private ReferralRepository $referralRepo;
    private UserRepository $userRepo;
    private AuthService $authService;
    private ReferralService $service;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->referralRepo = $this->createMock(ReferralRepository::class);
        $this->userRepo = $this->createMock(UserRepository::class);
        $this->authService = $this->createMock(AuthService::class);

        $this->service = new ReferralService(
            $this->em,
            $this->referralRepo,
            $this->userRepo,
            $this->authService,
            '',
        );
    }

    private function createUser(int $id, ?string $referralCode = null): User
    {
        $user = new User();
        $reflection = new \ReflectionClass($user);
        $prop = $reflection->getProperty('id');
        $prop->setValue($user, $id);
        if ($referralCode) {
            $user->setReferralCode($referralCode);
        }
        return $user;
    }

    public function testProcessReferralCodeHappyPath(): void
    {
        $referee = $this->createUser(1);
        $referrer = $this->createUser(2, 'abc12345');

        $this->userRepo->method('findOneBy')->willReturn($referrer);
        $this->referralRepo->method('findPendingByReferee')->willReturn(null);
        $this->em->expects($this->once())->method('persist');
        $this->em->expects($this->once())->method('flush');

        $this->service->processReferralCode($referee, 'abc12345');
    }

    public function testProcessReferralCodeSelfReferral(): void
    {
        $referee = $this->createUser(1, 'abc12345');

        $this->userRepo->method('findOneBy')->willReturn($referee);
        $this->em->expects($this->never())->method('persist');

        $this->service->processReferralCode($referee, 'abc12345');
    }

    public function testProcessReferralCodeReferrerNotFound(): void
    {
        $referee = $this->createUser(1);

        $this->userRepo->method('findOneBy')->willReturn(null);
        $this->em->expects($this->never())->method('persist');

        $this->service->processReferralCode($referee, 'notfound');
    }

    public function testProcessReferralCodeExistingPending(): void
    {
        $referee = $this->createUser(1);
        $referrer = $this->createUser(2, 'abc12345');

        $this->userRepo->method('findOneBy')->willReturn($referrer);
        $this->referralRepo->method('findPendingByReferee')->willReturn(new Referral());
        $this->em->expects($this->never())->method('persist');

        $this->service->processReferralCode($referee, 'abc12345');
    }

    public function testRewardReferrerNoPendingReferral(): void
    {
        $referee = $this->createUser(1);

        $this->referralRepo->method('findPendingByReferee')->willReturn(null);
        $this->em->expects($this->never())->method('flush');

        $this->service->rewardReferrer($referee);
    }

    public function testRewardReferrerNoSubscription(): void
    {
        $referee = $this->createUser(1);
        $referrer = $this->createUser(2);
        $referral = new Referral();
        $referral->setReferrer($referrer);
        $referral->setReferee($referee);

        $this->referralRepo->method('findPendingByReferee')->willReturn($referral);
        $this->em->expects($this->once())->method('flush');

        $this->service->rewardReferrer($referee);

        $this->assertSame(Referral::STATUS_REWARDED, $referral->getStatus());
        $this->assertNotNull($referral->getRewardedAt());
    }

    public function testRewardReferrerNonProGetsBooksLimitBonus(): void
    {
        $referee = $this->createUser(1);
        $referrer = $this->createUser(2);
        $sub = new Subscription();
        $sub->setUser($referrer);
        $sub->setPlan(Subscription::PLAN_BASIC);
        $sub->setBooksLimit(5);

        // Link subscription back to referrer (inverse side)
        $reflection = new \ReflectionClass($referrer);
        $prop = $reflection->getProperty('subscription');
        $prop->setValue($referrer, $sub);

        $referral = new Referral();
        $referral->setReferrer($referrer);
        $referral->setReferee($referee);

        $this->referralRepo->method('findPendingByReferee')->willReturn($referral);
        $this->em->expects($this->once())->method('flush');

        $this->service->rewardReferrer($referee);

        $this->assertSame(7, $sub->getBooksLimit());
    }

    public function testGetReferralInfoGeneratesCodeIfMissing(): void
    {
        $user = $this->createUser(1);

        $this->authService->method('generateUniqueReferralCode')->willReturn('newcode1');
        $this->referralRepo->method('findByReferrer')->willReturn([]);

        $info = $this->service->getReferralInfo($user, 'http://localhost');

        $this->assertSame('newcode1', $info['code']);
        $this->assertSame('http://localhost/login?ref=newcode1', $info['referralUrl']);
        $this->assertSame(0, $info['totalReferrals']);
    }

    public function testGetReferralInfoWithExistingCode(): void
    {
        $user = $this->createUser(1, 'mycode99');

        $this->referralRepo->method('findByReferrer')->willReturn([]);

        $info = $this->service->getReferralInfo($user, 'http://localhost');

        $this->assertSame('mycode99', $info['code']);
        $this->assertSame('http://localhost/login?ref=mycode99', $info['referralUrl']);
    }
}
