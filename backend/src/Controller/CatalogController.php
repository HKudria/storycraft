<?php

namespace App\Controller;

use App\Entity\Book;
use App\Repository\BookRepository;
use App\Service\StorageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class CatalogController extends AbstractController
{
    public function __construct(
        private readonly BookRepository $bookRepo,
        private readonly StorageService $storageService,
    ) {
    }

    #[Route('/api/catalog', name: 'catalog_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $templateId = $request->query->getInt('templateId') ?: null;
        $language = $request->query->get('language') ?: null;
        $minRatingRaw = $request->query->get('minRating');
        $minRating = $minRatingRaw !== null ? (float) $minRatingRaw : null;
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(50, max(1, $request->query->getInt('limit', 12)));

        $books = $this->bookRepo->findPublicBooks($templateId, $language, $minRating, $page, $limit);
        $total = $this->bookRepo->countPublicBooks($templateId, $language, $minRating);

        return new JsonResponse([
            'books' => array_map(fn(Book $b) => $this->serializeCatalogBook($b), $books),
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ]);
    }

    #[Route('/api/catalog/{id}', name: 'catalog_get', methods: ['GET'])]
    public function get(int $id): JsonResponse
    {
        $book = $this->bookRepo->findWithPages($id);

        if (!$book || !$book->isPublic() || $book->getStatus() !== Book::STATUS_DONE) {
            return new JsonResponse(['error' => 'Book not found'], 404);
        }

        return new JsonResponse($this->serializeCatalogBookDetail($book));
    }

    private function serializeCatalogBook(Book $book): array
    {
        $firstPage = $book->getPages()->first();
        $coverImageUrl = null;
        if ($firstPage && $firstPage->getImageS3Key()) {
            $coverImageUrl = $this->storageService->getPresignedUrl($firstPage->getImageS3Key(), 3600);
        }

        return [
            'id' => $book->getId(),
            'title' => $book->getTitle() ?? $book->getTopic(),
            'templateTitle' => $book->getTemplate()?->getTitle(),
            'language' => $book->getLanguage(),
            'averageRating' => $book->getAverageRating(),
            'ratingCount' => $book->getRatingCount(),
            'coverImageUrl' => $coverImageUrl,
            'createdAt' => $book->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    private function serializeCatalogBookDetail(Book $book): array
    {
        $data = $this->serializeCatalogBook($book);
        $data['pages'] = array_map(
            fn(\App\Entity\Page $p) => [
                'id' => $p->getId(),
                'pageNumber' => $p->getPageNumber(),
                'text' => $p->getText(),
                'imageUrl' => $p->getImageS3Key()
                    ? $this->storageService->getPresignedUrl($p->getImageS3Key(), 3600)
                    : null,
            ],
            $book->getPages()->toArray(),
        );

        return $data;
    }
}
