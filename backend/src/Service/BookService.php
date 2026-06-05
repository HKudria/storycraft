<?php

namespace App\Service;

use App\Dto\BookRequest;
use App\Entity\Book;
use App\Entity\Job;
use App\Message\GenerateStoryMessage;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

class BookService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly BookRepository $bookRepo,
        private readonly SubscriptionService $subscriptionService,
        private readonly MessageBusInterface $bus,
    ) {
    }

    public function create(\App\Entity\User $user, BookRequest $dto): Book
    {
        if (!$this->subscriptionService->canCreateBook($user)) {
            throw new \RuntimeException('Book limit reached for this month.', 403);
        }

        $child = $this->em->getRepository(\App\Entity\Child::class)->find($dto->childId);
        if ($child === null || $child->getUser()->getId() !== $user->getId()) {
            throw new \RuntimeException('Child not found.', 404);
        }

        $template = $this->em->getRepository(\App\Entity\Template::class)->find($dto->templateId);
        if ($template === null) {
            throw new \RuntimeException('Template not found.', 404);
        }

        $book = new Book();
        $book->setUser($user)
            ->setChild($child)
            ->setTemplate($template)
            ->setTopic($dto->topic)
            ->setLanguage($dto->language);

        $job = new Job();
        $job->setBook($book)
            ->setType(Job::TYPE_GENERATE_STORY);

        $this->em->persist($book);
        $this->em->persist($job);
        $this->em->flush();

        $this->bus->dispatch(new GenerateStoryMessage($book->getId()));

        return $book;
    }

    public function findForUser(\App\Entity\User $user, int $id): Book
    {
        $book = $this->bookRepo->findWithPages($id);

        if ($book === null || $book->getUser()->getId() !== $user->getId()) {
            throw new \RuntimeException('Book not found.', 404);
        }

        return $book;
    }

    /**
     * @return Book[]
     */
    public function listForUser(\App\Entity\User $user): array
    {
        return $this->bookRepo->findByUser($user);
    }

    public function delete(Book $book): void
    {
        $this->em->remove($book);
        $this->em->flush();
    }
}
