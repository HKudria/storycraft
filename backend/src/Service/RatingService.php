<?php

namespace App\Service;

use App\Entity\Book;
use App\Entity\Rating;
use App\Entity\Template;
use App\Entity\User;
use App\Repository\BookRepository;
use App\Repository\RatingRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

class RatingService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly RatingRepository $ratingRepo,
        private readonly BookRepository $bookRepo,
        private readonly TranslatorInterface $translator,
    ) {
    }

    public function submitRating(User $user, int $bookId, int $score, ?string $comment): Rating
    {
        if ($score < 1 || $score > 5) {
            throw new \RuntimeException($this->translator->trans('error.invalid_rating_score'), 400);
        }

        $book = $this->bookRepo->findWithPages($bookId);
        if (!$book || $book->getUser()->getId() !== $user->getId()) {
            throw new \RuntimeException($this->translator->trans('error.book_not_found'), 404);
        }

        if ($book->getStatus() !== Book::STATUS_DONE) {
            throw new \RuntimeException($this->translator->trans('error.book_not_done'), 400);
        }

        $existing = $this->ratingRepo->findOneByBookAndUser($bookId, $user->getId());
        if ($existing) {
            throw new \RuntimeException($this->translator->trans('error.already_rated'), 409);
        }

        $rating = new Rating();
        $rating->setBook($book)
            ->setUser($user)
            ->setScore($score)
            ->setComment($comment);

        $this->em->persist($rating);
        $this->em->flush();

        $this->recomputeBookRating($book);

        return $rating;
    }

    /**
     * @return Rating[]
     */
    public function getRatingsForBook(int $bookId): array
    {
        return $this->ratingRepo->findByBook($bookId);
    }

    public function getAverageRatingForTemplate(Template $template): ?float
    {
        return $this->ratingRepo->getAverageForTemplate($template->getId());
    }

    public function recomputeBookRating(Book $book): void
    {
        $stats = $this->ratingRepo->getAverageForBook($book->getId());
        $book->setAverageRating($stats['count'] > 0 ? $stats['average'] : null);
        $book->setRatingCount($stats['count']);
        $this->em->flush();
    }
}
