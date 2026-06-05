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
}
