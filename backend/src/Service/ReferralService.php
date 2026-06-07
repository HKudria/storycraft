<?php

namespace App\Service;

use App\Entity\Referral;
use App\Entity\Subscription;
use App\Entity\User;
use App\Repository\ReferralRepository;
use App\Repository\UserRepository;
use App\Security\AuthService;
use Doctrine\ORM\EntityManagerInterface;
use Stripe\Stripe;
use Stripe\Coupon;

class ReferralService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ReferralRepository $referralRepository,
        private readonly UserRepository $userRepository,
        private readonly AuthService $authService,
        private readonly string $stripeSecretKey = '',
    ) {
    }

    public function processReferralCode(User $referee, string $code): void
    {
        $referrer = $this->userRepository->findOneBy(['referralCode' => $code]);
        if (!$referrer || $referrer->getId() === $referee->getId()) {
            return;
        }

        if ($this->referralRepository->findPendingByReferee($referee->getId())) {
            return;
        }

        $referral = new Referral();
        $referral->setReferrer($referrer);
        $referral->setReferee($referee);
        $referral->setStatus(Referral::STATUS_PENDING);

        $this->em->persist($referral);
        $this->em->flush();
    }

    public function rewardReferrer(User $referee): void
    {
        $referral = $this->referralRepository->findPendingByReferee($referee->getId());
        if (!$referral) {
            return;
        }

        $referral->setStatus(Referral::STATUS_REWARDED);
        $referral->setRewardedAt(new \DateTimeImmutable());

        $referrer = $referral->getReferrer();
        $sub = $referrer->getSubscription();
        if (!$sub) {
            $this->em->flush();
            return;
        }

        if ($sub->getPlan() === Subscription::PLAN_PRO && $sub->getStripeSubscriptionId()) {
            $this->applyStripeDiscount($sub->getStripeSubscriptionId());
        } else {
            $sub->setBooksLimit($sub->getBooksLimit() + 2);
        }

        $this->em->flush();
    }

    private function applyStripeDiscount(string $stripeSubscriptionId): void
    {
        if (!$this->stripeSecretKey) {
            return;
        }

        Stripe::setApiKey($this->stripeSecretKey);

        $coupon = Coupon::create([
            'amount_off' => 500,
            'currency' => 'usd',
            'duration' => 'once',
            'name' => 'Referral Reward',
        ]);

        $subscription = \Stripe\Subscription::retrieve($stripeSubscriptionId);
        $subscription->coupon = $coupon->id;
        $subscription->save();
    }

    public function getReferralInfo(User $user, string $frontendUrl): array
    {
        if (!$user->getReferralCode()) {
            $user->setReferralCode($this->authService->generateUniqueReferralCode());
            $this->em->flush();
        }

        $referrals = $this->referralRepository->findByReferrer($user->getId());

        return [
            'code' => $user->getReferralCode(),
            'referralUrl' => $frontendUrl . '/login?ref=' . $user->getReferralCode(),
            'referrals' => array_map(fn(Referral $r) => [
                'id' => $r->getId(),
                'refereeName' => $r->getReferee()->getName(),
                'status' => $r->getStatus(),
                'createdAt' => $r->getCreatedAt()->format('c'),
                'rewardedAt' => $r->getRewardedAt()?->format('c'),
            ], $referrals),
            'totalReferrals' => count($referrals),
            'rewardedReferrals' => count(array_filter($referrals, fn(Referral $r) => $r->getStatus() === Referral::STATUS_REWARDED)),
        ];
    }
}
