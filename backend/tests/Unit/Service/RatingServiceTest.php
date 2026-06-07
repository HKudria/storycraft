<?php

namespace App\Tests\Unit\Service;

use App\Entity\Book;
use App\Entity\Rating;
use App\Entity\User;
use App\Repository\BookRepository;
use App\Repository\RatingRepository;
use App\Service\RatingService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\Translation\TranslatorInterface;

class RatingServiceTest extends TestCase
{
    private EntityManagerInterface $em;
    private RatingRepository $ratingRepo;
    private BookRepository $bookRepo;
    private TranslatorInterface $translator;
    private RatingService $service;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->ratingRepo = $this->createMock(RatingRepository::class);
        $this->bookRepo = $this->createMock(BookRepository::class);
        $this->translator = $this->createMock(TranslatorInterface::class);
        $this->translator->method('trans')->willReturnCallback(fn(string $key) => $key);

        $this->service = new RatingService(
            $this->em,
            $this->ratingRepo,
            $this->bookRepo,
            $this->translator,
        );
    }

    private function createUser(int $id): User
    {
        $user = new User();
        $reflection = new \ReflectionClass($user);
        $prop = $reflection->getProperty('id');
        $prop->setValue($user, $id);
        return $user;
    }

    private function createBook(User $user, string $status = Book::STATUS_DONE): Book
    {
        $book = new Book();
        $book->setUser($user);
        $book->setStatus($status);
        $reflection = new \ReflectionClass($book);
        $prop = $reflection->getProperty('id');
        $prop->setValue($book, 42);
        return $book;
    }

    public function testSubmitRatingHappyPath(): void
    {
        $user = $this->createUser(1);
        $book = $this->createBook($user);

        $this->bookRepo->method('findWithPages')->with(42)->willReturn($book);
        $this->ratingRepo->method('findOneByBookAndUser')->willReturn(null);
        $this->ratingRepo->method('getAverageForBook')->willReturn(['average' => 4.5, 'count' => 1]);

        $rating = $this->service->submitRating($user, 42, 4, 'Great book!');

        $this->assertSame(4, $rating->getScore());
        $this->assertSame('Great book!', $rating->getComment());
        $this->assertSame($book, $rating->getBook());
        $this->assertSame($user, $rating->getUser());
    }

    public function testSubmitRatingScoreTooLow(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->service->submitRating($this->createUser(1), 42, 0, null);
    }

    public function testSubmitRatingScoreTooHigh(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->service->submitRating($this->createUser(1), 42, 6, null);
    }

    public function testSubmitRatingBookNotFound(): void
    {
        $this->bookRepo->method('findWithPages')->willReturn(null);

        $this->expectException(\RuntimeException::class);
        $this->service->submitRating($this->createUser(1), 42, 4, null);
    }

    public function testSubmitRatingBookNotDone(): void
    {
        $user = $this->createUser(1);
        $book = $this->createBook($user, Book::STATUS_PENDING);

        $this->bookRepo->method('findWithPages')->willReturn($book);

        $this->expectException(\RuntimeException::class);
        $this->service->submitRating($user, 42, 4, null);
    }

    public function testSubmitRatingDuplicate(): void
    {
        $user = $this->createUser(1);
        $book = $this->createBook($user);

        $this->bookRepo->method('findWithPages')->willReturn($book);
        $this->ratingRepo->method('findOneByBookAndUser')->willReturn(new Rating());

        $this->expectException(\RuntimeException::class);
        $this->service->submitRating($user, 42, 4, null);
    }

    public function testRecomputeBookRatingWithRatings(): void
    {
        $book = $this->createBook($this->createUser(1));

        $this->ratingRepo->method('getAverageForBook')->willReturn(['average' => 3.75, 'count' => 4]);
        $this->em->expects($this->once())->method('flush');

        $this->service->recomputeBookRating($book);

        $this->assertSame(3.75, $book->getAverageRating());
        $this->assertSame(4, $book->getRatingCount());
    }

    public function testRecomputeBookRatingNoRatings(): void
    {
        $book = $this->createBook($this->createUser(1));

        $this->ratingRepo->method('getAverageForBook')->willReturn(['average' => 0.0, 'count' => 0]);

        $this->service->recomputeBookRating($book);

        $this->assertNull($book->getAverageRating());
        $this->assertSame(0, $book->getRatingCount());
    }
}
