<?php

namespace App\MessageHandler;

use App\Entity\Book;
use App\Entity\Job;
use App\Entity\Page;
use App\Message\GenerateIllustrationMessage;
use App\Message\GenerateStoryMessage;
use App\Service\StoryProviderInterface;
use App\Service\SubscriptionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsMessageHandler]
class GenerateStoryHandler
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly StoryProviderInterface $storyProvider,
        private readonly SubscriptionService $subscriptionService,
        private readonly MessageBusInterface $bus,
    ) {
    }

    public function __invoke(GenerateStoryMessage $message): void
    {
        $book = $this->em->getRepository(Book::class)->find($message->bookId);

        if ($book === null) {
            return;
        }

        $job = $this->em->getRepository(Job::class)->findOneBy(
            ['book' => $book, 'type' => Job::TYPE_GENERATE_STORY],
            ['createdAt' => 'DESC'],
        );

        try {
            $book->setStatus(Book::STATUS_PROCESSING);
            if ($job) {
                $job->setStatus(Job::STATUS_RUNNING)
                    ->setStartedAt(new \DateTimeImmutable());
            }
            $this->em->flush();

            $child = $book->getChild();
            $template = $book->getTemplate();

            $petLine = $child->getPetName()
                ? "They have a pet named {$child->getPetName()}."
                : '';

            $prompt = strtr($template->getPromptBlueprint(), [
                '{childName}' => $child->getName(),
                '{age}' => (string) $child->getAge(),
                '{appearance}' => $child->getAppearance() ?? 'not specified',
                '{interests}' => $child->getInterests() ?? 'not specified',
                '{petLine}' => $petLine,
                '{topic}' => $book->getTopic(),
                '{language}' => $book->getLanguage(),
            ]);

            $result = $this->storyProvider->generateStory($prompt);

            $pages = $result['pages'] ?? [];
            foreach ($pages as $i => $pageData) {
                $page = new Page();
                $page->setBook($book)
                    ->setPageNumber($i + 1)
                    ->setText($pageData['text'] ?? null)
                    ->setImagePrompt($pageData['imagePrompt'] ?? null);
                $this->em->persist($page);
            }

            if (isset($result['title'])) {
                $book->setTitle($result['title']);
            }

            $book->setStatus(Book::STATUS_DONE);
            if ($job) {
                $job->setStatus(Job::STATUS_DONE)
                    ->setFinishedAt(new \DateTimeImmutable());
            }

            $this->subscriptionService->incrementUsage($book->getUser());
            $this->em->flush();

            $firstPage = $book->getPages()->first();
            if ($firstPage) {
                $this->bus->dispatch(new GenerateIllustrationMessage($book->getId(), $firstPage->getId()));
            }
        } catch (\Throwable $e) {
            $book->setStatus(Book::STATUS_FAILED);
            if ($job) {
                $job->setStatus(Job::STATUS_FAILED)
                    ->setErrorMessage($e->getMessage())
                    ->setFinishedAt(new \DateTimeImmutable());
            }
            $this->em->flush();
        }
    }
}
