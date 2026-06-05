<?php

namespace App\Controller;

use App\Dto\ChildRequest;
use App\Entity\Child;
use App\Service\ChildService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

class ChildController extends AbstractController
{
    public function __construct(
        private readonly ChildService $childService,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/api/children', name: 'children_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $children = $this->childService->listForUser($this->getUser());

        return new JsonResponse(array_map(
            fn(Child $c) => $this->serializeChild($c),
            $children,
        ));
    }

    #[Route('/api/children', name: 'children_create', methods: ['POST'])]
    public function create(#[MapRequestPayload] ChildRequest $request): JsonResponse
    {
        $child = $this->childService->create($this->getUser(), $request);

        return new JsonResponse($this->serializeChild($child), Response::HTTP_CREATED);
    }

    #[Route('/api/children/{id}', name: 'children_get', methods: ['GET'])]
    public function get(int $id): JsonResponse
    {
        $child = $this->childService->findForUser($this->getUser(), $id);

        return new JsonResponse($this->serializeChild($child));
    }

    #[Route('/api/children/{id}', name: 'children_update', methods: ['PUT'])]
    public function update(int $id, #[MapRequestPayload] ChildRequest $request): JsonResponse
    {
        $child = $this->childService->findForUser($this->getUser(), $id);
        $this->childService->update($child, $request);

        return new JsonResponse($this->serializeChild($child));
    }

    #[Route('/api/children/{id}', name: 'children_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $child = $this->childService->findForUser($this->getUser(), $id);
        $this->childService->softDelete($child);

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    private function serializeChild(Child $child): array
    {
        return [
            'id' => $child->getId(),
            'name' => $child->getName(),
            'age' => $child->getAge(),
            'gender' => $child->getGender(),
            'appearance' => $child->getAppearance(),
            'interests' => $child->getInterests(),
            'petName' => $child->getPetName(),
            'createdAt' => $child->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
