<?php

namespace App\MessageHandler;

use App\Entity\Book;
use App\Entity\Job;
use App\Entity\Page;
use App\Message\GenerateIllustrationMessage;
use App\Message\GeneratePdfMessage;
use App\Service\ImageProviderInterface;
use App\Service\StorageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsMessageHandler]
class GenerateIllustrationHandler
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ImageProviderInterface $imageProvider,
        private readonly StorageService $storageService,
        private readonly MessageBusInterface $bus,
    ) {
    }

    public function __invoke(GenerateIllustrationMessage $message): void
    {
        $page = $this->em->getRepository(Page::class)->find($message->pageId);
        if ($page === null) {
            return;
        }

        $book = $page->getBook();
        if ($book === null) {
            return;
        }

        $child = $book->getChild();

        $job = new Job();
        $job->setBook($book)
            ->setType(Job::TYPE_GENERATE_ILLUSTRATION)
            ->setStatus(Job::STATUS_RUNNING)
            ->setStartedAt(new \DateTimeImmutable());
        $this->em->persist($job);
        $this->em->flush();

        try {
            $appearance = $child?->getAppearance() ?? 'a cheerful child';
            $prompt = "Children's book illustration, watercolour style, vibrant colours, child-safe, friendly characters. "
                . ($page->getImagePrompt() ?? $book->getTopic())
                . " The main character is a child who is {$appearance}.";

            $imageBase64 = $this->imageProvider->generateImage($prompt);
            $imageData = base64_decode($imageBase64);

            $s3Key = "books/{$book->getId()}/pages/{$page->getPageNumber()}.png";
            $this->storageService->upload($s3Key, $imageData, 'image/png');

            $page->setImageS3Key($s3Key);

            $job->setStatus(Job::STATUS_DONE)
                ->setFinishedAt(new \DateTimeImmutable());
            $this->em->flush();

            $allPagesReady = true;
            foreach ($book->getPages() as $p) {
                if ($p->getImageS3Key() === null) {
                    $allPagesReady = false;
                    break;
                }
            }

            if ($allPagesReady) {
                $this->bus->dispatch(new GeneratePdfMessage($book->getId()));
            } else {
                $nextPage = null;
                foreach ($book->getPages() as $p) {
                    if ($p->getImageS3Key() === null && $p->getId() !== $page->getId()) {
                        $nextPage = $p;
                        break;
                    }
                }
                if ($nextPage) {
                    $this->bus->dispatch(new GenerateIllustrationMessage($book->getId(), $nextPage->getId()));
                }
            }
        } catch (\Throwable $e) {
            $job->setStatus(Job::STATUS_FAILED)
                ->setErrorMessage($e->getMessage())
                ->setFinishedAt(new \DateTimeImmutable());
            $this->em->flush();
            throw $e;
        }
    }
}
