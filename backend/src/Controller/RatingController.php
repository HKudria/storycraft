<?php

namespace App\Controller;

use App\Service\RatingService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class RatingController extends AbstractController
{
    public function __construct(
        private readonly RatingService $ratingService,
    ) {
    }

    #[Route('/api/books/{id}/ratings', name: 'ratings_create', methods: ['POST'])]
    public function create(Request $request, int $id): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $score = (int) ($data['score'] ?? 0);
        $comment = $data['comment'] ?? null;

        try {
            $rating = $this->ratingService->submitRating($this->getUser(), $id, $score, $comment);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 400);
        }

        return new JsonResponse($this->serializeRating($rating), Response::HTTP_CREATED);
    }

    #[Route('/api/books/{id}/ratings', name: 'ratings_list', methods: ['GET'])]
    public function list(int $id): JsonResponse
    {
        $ratings = $this->ratingService->getRatingsForBook($id);

        return new JsonResponse(array_map(
            fn(\App\Entity\Rating $r) => $this->serializeRating($r),
            $ratings,
        ));
    }

    private function serializeRating(\App\Entity\Rating $r): array
    {
        return [
            'id' => $r->getId(),
            'score' => $r->getScore(),
            'comment' => $r->getComment(),
            'userName' => $r->getUser()?->getName(),
            'createdAt' => $r->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
