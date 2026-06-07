<?php

namespace App\Controller;

use App\Service\ReferralService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class ReferralController extends AbstractController
{
    public function __construct(
        private readonly ReferralService $referralService,
        private readonly string $frontendUrl,
    ) {
    }

    #[Route('/api/referrals/me', name: 'referrals_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        return new JsonResponse(
            $this->referralService->getReferralInfo($user, $this->frontendUrl),
        );
    }
}
