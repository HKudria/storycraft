<?php

namespace App\Repository;

use App\Entity\Template;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Template>
 */
class TemplateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Template::class);
    }

    /**
     * @return Template[]
     */
    public function findActive(): array
    {
        return $this->findBy(['isActive' => true], ['title' => 'ASC']);
    }

    /**
     * @return Template[]
     */
    public function findFiltered(?string $category, ?int $ageMin, ?int $ageMax): array
    {
        $qb = $this->createQueryBuilder('t')
            ->where('t.isActive = true')
            ->orderBy('t.title', 'ASC');

        if ($category) {
            $qb->andWhere('t.category = :category')->setParameter('category', $category);
        }
        if ($ageMin !== null) {
            $qb->andWhere('t.ageMin <= :ageMin')->setParameter('ageMin', $ageMin);
        }
        if ($ageMax !== null) {
            $qb->andWhere('t.ageMax >= :ageMax')->setParameter('ageMax', $ageMax);
        }

        return $qb->getQuery()->getResult();
    }
}
