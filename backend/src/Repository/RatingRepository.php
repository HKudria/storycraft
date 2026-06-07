<?php

namespace App\Repository;

use App\Entity\Rating;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Rating>
 */
class RatingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Rating::class);
    }

    /**
     * @return Rating[]
     */
    public function findByBook(int $bookId): array
    {
        return $this->createQueryBuilder('r')
            ->join('r.user', 'u')->addSelect('u')
            ->where('r.book = :bookId')
            ->setParameter('bookId', $bookId)
            ->orderBy('r.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByBookAndUser(int $bookId, int $userId): ?Rating
    {
        return $this->findOneBy(['book' => $bookId, 'user' => $userId]);
    }

    /**
     * @return array{average: float, count: int}
     */
    public function getAverageForBook(int $bookId): array
    {
        $result = $this->createQueryBuilder('r')
            ->select('AVG(r.score) as average, COUNT(r.id) as count')
            ->where('r.book = :bookId')
            ->setParameter('bookId', $bookId)
            ->getQuery()
            ->getOneOrNullResult();

        return [
            'average' => $result['average'] !== null ? (float) round((float) $result['average'], 2) : 0.0,
            'count' => (int) $result['count'],
        ];
    }

    public function getAverageForTemplate(int $templateId): ?float
    {
        $result = $this->createQueryBuilder('r')
            ->select('AVG(r.score) as average')
            ->join('r.book', 'b')
            ->where('b.template = :templateId')
            ->setParameter('templateId', $templateId)
            ->getQuery()
            ->getOneOrNullResult();

        return $result['average'] !== null ? (float) round((float) $result['average'], 2) : null;
    }
}
