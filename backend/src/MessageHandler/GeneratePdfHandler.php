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
    /** @var string[] Temp files to clean up */
    private array $tempFiles = [];

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
                $imagePath = null;
                if ($page->getImageS3Key()) {
                    $imagePath = $this->downloadToTempFile($page->getImageS3Key());
                }
                $pages[] = [
                    'pageNumber' => $page->getPageNumber(),
                    'text' => $page->getText(),
                    'imagePath' => $imagePath,
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
        } finally {
            $this->cleanupTempFiles();
        }
    }

    private function downloadToTempFile(string $s3Key): ?string
    {
        try {
            $data = $this->storageService->get($s3Key);
            $path = sys_get_temp_dir() . '/' . basename($s3Key);
            $this->applyEdgeFade($data);
            file_put_contents($path, $data);
            $this->tempFiles[] = $path;
            return $path;
        } catch (\Throwable) {
            return null;
        }
    }

    private function applyEdgeFade(string &$imageData): void
    {
        $src = imagecreatefromstring($imageData);
        if ($src === false) {
            return;
        }

        $w = imagesx($src);
        $h = imagesy($src);
        $cx = $w / 2;
        $cy = $h / 2;

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $dx = ($x - $cx) / $cx;
                $dy = ($y - $cy) / $cy;
                $dist = sqrt($dx * $dx + $dy * $dy);

                if ($dist <= 0.78) {
                    continue;
                }

                $strength = min(($dist - 0.78) / 0.22, 1.0);
                $strength = $strength * $strength * (3 - 2 * $strength);

                $rgb = imagecolorat($src, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;

                $color = imagecolorallocate($src,
                    (int) ($r + (255 - $r) * $strength),
                    (int) ($g + (255 - $g) * $strength),
                    (int) ($b + (255 - $b) * $strength),
                );
                imagesetpixel($src, $x, $y, $color);
            }
        }

        ob_start();
        imagepng($src);
        $imageData = ob_get_clean();
        imagedestroy($src);
    }

    private function cleanupTempFiles(): void
    {
        foreach ($this->tempFiles as $path) {
            @unlink($path);
        }
        $this->tempFiles = [];
    }
}
