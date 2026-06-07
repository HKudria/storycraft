<?php

namespace App\Tests\Unit\Service;

use App\Dto\BookRequest;
use App\Entity\Book;
use App\Entity\Child;
use App\Entity\Template;
use App\Entity\User;
use App\Repository\BookRepository;
use App\Service\BookService;
use App\Service\SubscriptionService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Messenger\Envelope;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

class BookServiceTest extends TestCase
{
    private EntityManagerInterface $em;
    private BookRepository $bookRepo;
    private SubscriptionService $subscriptionService;
    private MessageBusInterface $bus;
    private TranslatorInterface $translator;
    private BookService $service;
    private EntityRepository $childRepo;
    private EntityRepository $templateRepo;

    protected function setUp(): void
    {
        $this->bookRepo = $this->createMock(BookRepository::class);
        $this->childRepo = $this->createMock(EntityRepository::class);
        $this->templateRepo = $this->createMock(EntityRepository::class);
        $this->subscriptionService = $this->createMock(SubscriptionService::class);
        $this->bus = $this->createMock(MessageBusInterface::class);
        $this->translator = $this->createMock(TranslatorInterface::class);
        $this->translator->method('trans')->willReturnCallback(fn(string $key) => $key);

        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->em->method('getRepository')->willReturnCallback(
            fn(string $class) => match ($class) {
                Child::class => $this->childRepo,
                Template::class => $this->templateRepo,
                default => $this->createMock(EntityRepository::class),
            }
        );

        $this->service = new BookService(
            $this->em,
            $this->bookRepo,
            $this->subscriptionService,
            $this->bus,
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

    public function testCreateHappyPath(): void
    {
        $user = $this->createUser(1);
        $child = new Child();
        $child->setUser($user);
        $template = new Template();

        $dto = new BookRequest(childId: 10, templateId: 20, topic: 'Dragons', language: 'en');

        $this->subscriptionService->method('canCreateBook')->willReturn(true);
        $this->childRepo->method('find')->with(10)->willReturn($child);
        $this->templateRepo->method('find')->with(20)->willReturn($template);

        // Capture dispatch to verify message
        $this->bus->expects($this->once())->method('dispatch')->with($this->callback(function ($msg) {
            return $msg instanceof \App\Message\GenerateStoryMessage;
        }))->willReturnCallback(fn($msg) => new Envelope($msg));

        // Book needs an ID for the message dispatch — set after persist
        $this->em->expects($this->exactly(2))->method('persist')->willReturnCallback(function ($entity) {
            if ($entity instanceof Book) {
                $reflection = new \ReflectionClass($entity);
                $prop = $reflection->getProperty('id');
                $prop->setValue($entity, 1);
            }
        });

        $book = $this->service->create($user, $dto);

        $this->assertSame($user, $book->getUser());
        $this->assertSame($child, $book->getChild());
        $this->assertSame($template, $book->getTemplate());
        $this->assertSame('Dragons', $book->getTopic());
        $this->assertSame('en', $book->getLanguage());
    }

    public function testCreateLimitReached(): void
    {
        $user = $this->createUser(1);
        $dto = new BookRequest(childId: 10, templateId: 20, topic: 'Dragons');

        $this->subscriptionService->method('canCreateBook')->willReturn(false);

        $this->expectException(\RuntimeException::class);
        $this->service->create($user, $dto);
    }

    public function testCreateChildNotFound(): void
    {
        $user = $this->createUser(1);
        $dto = new BookRequest(childId: 10, templateId: 20, topic: 'Dragons');

        $this->subscriptionService->method('canCreateBook')->willReturn(true);
        $this->childRepo->method('find')->willReturn(null);

        $this->expectException(\RuntimeException::class);
        $this->service->create($user, $dto);
    }

    public function testCreateChildBelongsToOtherUser(): void
    {
        $user = $this->createUser(1);
        $otherUser = $this->createUser(2);
        $child = new Child();
        $child->setUser($otherUser);

        $dto = new BookRequest(childId: 10, templateId: 20, topic: 'Dragons');

        $this->subscriptionService->method('canCreateBook')->willReturn(true);
        $this->childRepo->method('find')->willReturn($child);

        $this->expectException(\RuntimeException::class);
        $this->service->create($user, $dto);
    }

    public function testCreateTemplateNotFound(): void
    {
        $user = $this->createUser(1);
        $child = new Child();
        $child->setUser($user);

        $dto = new BookRequest(childId: 10, templateId: 20, topic: 'Dragons');

        $this->subscriptionService->method('canCreateBook')->willReturn(true);
        $this->childRepo->method('find')->willReturn($child);
        $this->templateRepo->method('find')->willReturn(null);

        $this->expectException(\RuntimeException::class);
        $this->service->create($user, $dto);
    }

    public function testFindForUserHappyPath(): void
    {
        $user = $this->createUser(1);
        $book = new Book();
        $book->setUser($user);

        $this->bookRepo->method('findWithPages')->with(42)->willReturn($book);

        $result = $this->service->findForUser($user, 42);
        $this->assertSame($book, $result);
    }

    public function testFindForUserNotFound(): void
    {
        $user = $this->createUser(1);

        $this->bookRepo->method('findWithPages')->willReturn(null);

        $this->expectException(\RuntimeException::class);
        $this->service->findForUser($user, 42);
    }

    public function testFindForUserWrongOwner(): void
    {
        $user = $this->createUser(1);
        $otherUser = $this->createUser(2);
        $book = new Book();
        $book->setUser($otherUser);

        $this->bookRepo->method('findWithPages')->willReturn($book);

        $this->expectException(\RuntimeException::class);
        $this->service->findForUser($user, 42);
    }

    public function testDelete(): void
    {
        $book = new Book();
        $this->em->expects($this->once())->method('remove')->with($book);
        $this->em->expects($this->once())->method('flush');

        $this->service->delete($book);
    }

    public function testSaveUpdatesTimestamp(): void
    {
        $book = new Book();
        $this->em->expects($this->once())->method('flush');

        $this->service->save($book);

        $this->assertNotNull($book->getUpdatedAt());
    }
}
