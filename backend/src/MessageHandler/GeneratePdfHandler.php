<?php

namespace App\MessageHandler;

use App\Entity\Book;
use App\Entity\Job;
use App\Message\GeneratePdfMessage;
use App\Service\StorageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Twig\Environment;

#[AsMessageHandler]
class GeneratePdfHandler
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly StorageService $storageService,
        private readonly Environment $twig,
    ) {
    }

    public function __invoke(GeneratePdfMessage $message): void
    {
        $book = $this->em->getRepository(Book::class)->find($message->bookId);
        if ($book === null) {
            return;
        }

        $job = new Job();
        $job->setBook($book)
            ->setType(Job::TYPE_GENERATE_PDF)
            ->setStatus(Job::STATUS_RUNNING)
            ->setStartedAt(new \DateTimeImmutable());
        $this->em->persist($job);
        $this->em->flush();

        try {
            $pages = [];
            foreach ($book->getPages() as $page) {
                $imageUrl = null;
                if ($page->getImageS3Key()) {
                    $imageUrl = $this->storageService->getPresignedUrl($page->getImageS3Key(), 3600);
                }
                $pages[] = [
                    'pageNumber' => $page->getPageNumber(),
                    'text' => $page->getText(),
                    'imageUrl' => $imageUrl,
                ];
            }

            $html = $this->twig->render('pdf/book.html.twig', [
                'title' => $book->getTitle() ?? $book->getTopic(),
                'childName' => $book->getChild()?->getName(),
                'templateTitle' => $book->getTemplate()?->getTitle(),
                'createdAt' => $book->getCreatedAt()->format('F j, Y'),
                'pages' => $pages,
            ]);

            $mpdf = new \Mpdf\Mpdf([
                'mode' => 'utf-8',
                'format' => 'A4-L',
                'tempDir' => sys_get_temp_dir(),
            ]);

            $mpdf->WriteHTML($html);
            $pdfContent = $mpdf->Output('', 'S');

            $s3Key = "books/{$book->getId()}/book.pdf";
            $this->storageService->upload($s3Key, $pdfContent, 'application/pdf');

            $book->setPdfS3Key($s3Key);

            $job->setStatus(Job::STATUS_DONE)
                ->setFinishedAt(new \DateTimeImmutable());
            $this->em->flush();
        } catch (\Throwable $e) {
            $job->setStatus(Job::STATUS_FAILED)
                ->setErrorMessage($e->getMessage())
                ->setFinishedAt(new \DateTimeImmutable());
            $this->em->flush();
        }
    }
}
