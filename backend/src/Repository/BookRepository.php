<?php

namespace App\Repository;

use App\Entity\Book;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Book>
 */
class BookRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Book::class);
    }

    /**
     * @return Book[]
     */
    public function findByUser(User $user): array
    {
        return $this->findBy(['user' => $user->getId()], ['createdAt' => 'DESC']);
    }

    public function findWithPages(int $id): ?Book
    {
        return $this->createQueryBuilder('b')
            ->leftJoin('b.pages', 'p')->addSelect('p')
            ->leftJoin('b.child', 'c')->addSelect('c')
            ->leftJoin('b.template', 't')->addSelect('t')
            ->where('b.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return Book[]
     */
    public function findPublicBooks(?int $templateId, ?string $language, ?float $minRating, int $page, int $limit): array
    {
        $qb = $this->createQueryBuilder('b')
            ->leftJoin('b.pages', 'p')->addSelect('p')
            ->leftJoin('b.child', 'c')->addSelect('c')
            ->leftJoin('b.template', 't')->addSelect('t')
            ->where('b.isPublic = true')
            ->andWhere('b.status = :status')
            ->setParameter('status', Book::STATUS_DONE);

        if ($templateId !== null) {
            $qb->andWhere('b.template = :templateId')
                ->setParameter('templateId', $templateId);
        }

        if ($language !== null) {
            $qb->andWhere('b.language = :language')
                ->setParameter('language', $language);
        }

        if ($minRating !== null) {
            $qb->andWhere('b.averageRating >= :minRating')
                ->setParameter('minRating', $minRating);
        }

        return $qb->orderBy('b.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function countPublicBooks(?int $templateId, ?string $language, ?float $minRating): int
    {
        $qb = $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.isPublic = true')
            ->andWhere('b.status = :status')
            ->setParameter('status', Book::STATUS_DONE);

        if ($templateId !== null) {
            $qb->andWhere('b.template = :templateId')
                ->setParameter('templateId', $templateId);
        }

        if ($language !== null) {
            $qb->andWhere('b.language = :language')
                ->setParameter('language', $language);
        }

        if ($minRating !== null) {
            $qb->andWhere('b.averageRating >= :minRating')
                ->setParameter('minRating', $minRating);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}
