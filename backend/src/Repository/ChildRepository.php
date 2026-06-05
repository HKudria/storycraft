<?php

namespace App\Repository;

use App\Entity\Child;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Child>
 */
class ChildRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Child::class);
    }

    /**
     * @return Child[]
     */
    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.user = :userId')
            ->andWhere('c.deletedAt IS NULL')
            ->setParameter('userId', $user->getId())
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
