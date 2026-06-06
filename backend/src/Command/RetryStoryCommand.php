<?php

namespace App\Command;

use App\Entity\Book;
use App\Entity\Page;
use App\Message\GenerateStoryMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsCommand('app:retry-story', 'Re-dispatch story generation for a failed book')]
class RetryStoryCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MessageBusInterface $bus,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('bookId', InputArgument::REQUIRED, 'Book ID');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $bookId = (int) $input->getArgument('bookId');
        $book = $this->em->getRepository(Book::class)->find($bookId);

        if (!$book) {
            $output->writeln("<error>Book {$bookId} not found.</error>");
            return Command::FAILURE;
        }

        $output->writeln("Book {$bookId}: status={$book->getStatus()}");

        foreach ($book->getPages() as $page) {
            $this->em->remove($page);
        }
        $book->setStatus(Book::STATUS_PENDING);
        $this->em->flush();

        $this->bus->dispatch(new GenerateStoryMessage($bookId));
        $output->writeln('Dispatched GenerateStoryMessage.');

        return Command::SUCCESS;
    }
}
