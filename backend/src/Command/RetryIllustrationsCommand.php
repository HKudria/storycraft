<?php

namespace App\Command;

use App\Entity\Page;
use App\Message\GenerateIllustrationMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsCommand('app:retry-illustrations', 'Dispatch illustration messages for pages missing images')]
class RetryIllustrationsCommand extends Command
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
        $pages = $this->em->getRepository(Page::class)->findBy(['book' => $bookId], ['pageNumber' => 'ASC']);

        $firstPending = null;
        foreach ($pages as $page) {
            if ($page->getImageS3Key() === null) {
                $output->writeln("Page {$page->getPageNumber()} (ID {$page->getId()}) — missing image");
                if ($firstPending === null) {
                    $firstPending = $page;
                }
            }
        }

        if ($firstPending) {
            $this->bus->dispatch(new GenerateIllustrationMessage($bookId, $firstPending->getId()));
            $output->writeln("Dispatched illustration for page {$firstPending->getPageNumber()}. The rest will chain automatically.");
        } else {
            $output->writeln('All pages have images.');
        }

        return Command::SUCCESS;
    }
}
