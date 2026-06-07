<?php

namespace App\Controller;

use App\Dto\BookRequest;
use App\Entity\Book;
use App\Service\BookService;
use App\Service\StorageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

class BookController extends AbstractController
{
    public function __construct(
        private readonly BookService $bookService,
        private readonly StorageService $storageService,
        private readonly TranslatorInterface $translator,
    ) {
    }

    #[Route('/api/books', name: 'books_create', methods: ['POST'])]
    public function create(#[MapRequestPayload] BookRequest $request): JsonResponse
    {
        try {
            $book = $this->bookService->create($this->getUser(), $request);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 400);
        }

        return new JsonResponse(
            ['id' => $book->getId(), 'status' => $book->getStatus()],
            Response::HTTP_ACCEPTED,
        );
    }

    #[Route('/api/books', name: 'books_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $books = $this->bookService->listForUser($this->getUser());

        return new JsonResponse(array_map(
            fn(Book $b) => $this->serializeBook($b),
            $books,
        ));
    }

    #[Route('/api/books/{id}', name: 'books_get', methods: ['GET'])]
    public function get(int $id): JsonResponse
    {
        try {
            $book = $this->bookService->findForUser($this->getUser(), $id);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 404);
        }

        return new JsonResponse($this->serializeBookDetail($book));
    }

    #[Route('/api/books/{id}/download', name: 'books_download', methods: ['GET'])]
    public function download(int $id): JsonResponse
    {
        try {
            $book = $this->bookService->findForUser($this->getUser(), $id);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 404);
        }

        if ($book->getPdfS3Key() === null) {
            return new JsonResponse(['error' => $this->translator->trans('error.pdf_not_ready')], Response::HTTP_NOT_FOUND);
        }

        $url = $this->storageService->getPresignedUrl($book->getPdfS3Key(), 3600);

        return new JsonResponse(['url' => $url]);
    }

    #[Route('/api/books/{id}', name: 'books_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        try {
            $book = $this->bookService->findForUser($this->getUser(), $id);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 404);
        }

        $this->bookService->delete($book);

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/api/books/{id}/visibility', name: 'books_visibility', methods: ['PATCH'])]
    public function toggleVisibility(int $id): JsonResponse
    {
        try {
            $book = $this->bookService->findForUser($this->getUser(), $id);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 404);
        }

        $book->setIsPublic(!$book->isPublic());
        $this->bookService->save($book);

        return new JsonResponse(['isPublic' => $book->isPublic()]);
    }

    private function serializeBook(Book $book): array
    {
        return [
            'id' => $book->getId(),
            'title' => $book->getTitle(),
            'topic' => $book->getTopic(),
            'language' => $book->getLanguage(),
            'status' => $book->getStatus(),
            'childId' => $book->getChild()?->getId(),
            'childName' => $book->getChild()?->getName(),
            'templateId' => $book->getTemplate()?->getId(),
            'templateTitle' => $book->getTemplate()?->getTitle(),
            'isPublic' => $book->isPublic(),
            'averageRating' => $book->getAverageRating(),
            'ratingCount' => $book->getRatingCount(),
            'createdAt' => $book->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    private function serializeBookDetail(Book $book): array
    {
        $data = $this->serializeBook($book);
        $data['pages'] = array_map(
            fn(\App\Entity\Page $p) => [
                'id' => $p->getId(),
                'pageNumber' => $p->getPageNumber(),
                'text' => $p->getText(),
                'imagePrompt' => $p->getImagePrompt(),
                'imageUrl' => $p->getImageS3Key()
                    ? $this->storageService->getPresignedUrl($p->getImageS3Key(), 3600)
                    : null,
            ],
            $book->getPages()->toArray(),
        );

        return $data;
    }
}
