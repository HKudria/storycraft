<?php

namespace App\Service;

use App\Dto\ChildRequest;
use App\Entity\Child;
use App\Entity\User;
use App\Repository\ChildRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ChildService
{
    public function __construct(
        private readonly ChildRepository $childRepository,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * @return Child[]
     */
    public function listForUser(User $user): array
    {
        return $this->childRepository->findByUser($user);
    }

    public function findForUser(User $user, int $id): Child
    {
        $child = $this->childRepository->find($id);

        if (!$child || $child->getUser()->getId() !== $user->getId() || $child->getDeletedAt() !== null) {
            throw new NotFoundHttpException('Child not found');
        }

        return $child;
    }

    public function create(User $user, ChildRequest $dto): Child
    {
        $child = new Child();
        $child->setUser($user);
        $this->applyDto($child, $dto);

        $this->em->persist($child);
        $this->em->flush();

        return $child;
    }

    public function update(Child $child, ChildRequest $dto): Child
    {
        $this->applyDto($child, $dto);
        $child->setUpdatedAt(new \DateTimeImmutable());

        $this->em->flush();

        return $child;
    }

    public function softDelete(Child $child): void
    {
        $child->setDeletedAt(new \DateTimeImmutable());
        $this->em->flush();
    }

    private function applyDto(Child $child, ChildRequest $dto): void
    {
        $child->setName($dto->name);
        $child->setAge($dto->age);
        $child->setGender($dto->gender);
        $child->setAppearance($dto->appearance);
        $child->setInterests($dto->interests);
        $child->setPetName($dto->petName);
    }
}
