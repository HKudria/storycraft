<?php

namespace App\Service;

use App\Dto\BookRequest;
use App\Entity\Book;
use App\Entity\Job;
use App\Message\GenerateStoryMessage;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

class BookService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly BookRepository $bookRepo,
        private readonly SubscriptionService $subscriptionService,
        private readonly MessageBusInterface $bus,
        private readonly TranslatorInterface $translator,
    ) {
    }

    public function create(\App\Entity\User $user, BookRequest $dto): Book
    {
        if (!$this->subscriptionService->canCreateBook($user)) {
            throw new \RuntimeException($this->translator->trans('error.book_limit_reached'), 403);
        }

        $child = $this->em->getRepository(\App\Entity\Child::class)->find($dto->childId);
        if ($child === null || $child->getUser()->getId() !== $user->getId()) {
            throw new \RuntimeException($this->translator->trans('error.child_not_found'), 404);
        }

        $template = $this->em->getRepository(\App\Entity\Template::class)->find($dto->templateId);
        if ($template === null) {
            throw new \RuntimeException($this->translator->trans('error.template_not_found'), 404);
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
            throw new \RuntimeException($this->translator->trans('error.book_not_found'), 404);
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

    public function save(Book $book): void
    {
        $book->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();
    }
}
