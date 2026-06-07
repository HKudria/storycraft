<?php

namespace App\Repository;

use App\Entity\Referral;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Referral>
 */
class ReferralRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Referral::class);
    }

    public function findPendingByReferee(int $refereeId): ?Referral
    {
        return $this->findOneBy(['referee' => $refereeId, 'status' => Referral::STATUS_PENDING]);
    }

    public function findByReferrer(int $referrerId): array
    {
        return $this->findBy(['referrer' => $referrerId], ['createdAt' => 'DESC']);
    }
}
