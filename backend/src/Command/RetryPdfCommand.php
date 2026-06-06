<?php

namespace App\Command;

use App\Message\GeneratePdfMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsCommand('app:retry-pdf', 'Re-dispatch PDF generation for a book')]
class RetryPdfCommand extends Command
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

        $this->bus->dispatch(new GeneratePdfMessage($bookId));
        $output->writeln("Dispatched PDF generation for book {$bookId}.");

        return Command::SUCCESS;
    }
}
