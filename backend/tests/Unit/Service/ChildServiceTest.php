<?php

namespace App\Tests\Unit\Service;

use App\Dto\ChildRequest;
use App\Entity\Child;
use App\Entity\User;
use App\Repository\ChildRepository;
use App\Service\ChildService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Contracts\Translation\TranslatorInterface;

class ChildServiceTest extends TestCase
{
    private ChildRepository $childRepo;
    private EntityManagerInterface $em;
    private TranslatorInterface $translator;
    private ChildService $service;

    protected function setUp(): void
    {
        $this->childRepo = $this->createMock(ChildRepository::class);
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->translator = $this->createMock(TranslatorInterface::class);
        $this->translator->method('trans')->willReturnCallback(fn(string $key) => $key);

        $this->service = new ChildService(
            $this->childRepo,
            $this->em,
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

    public function testFindForUserHappyPath(): void
    {
        $user = $this->createUser(1);
        $child = new Child();
        $child->setUser($user);

        $this->childRepo->method('find')->with(10)->willReturn($child);

        $result = $this->service->findForUser($user, 10);
        $this->assertSame($child, $result);
    }

    public function testFindForUserNotFound(): void
    {
        $this->childRepo->method('find')->willReturn(null);

        $this->expectException(NotFoundHttpException::class);
        $this->service->findForUser($this->createUser(1), 99);
    }

    public function testFindForUserWrongOwner(): void
    {
        $child = new Child();
        $child->setUser($this->createUser(2));

        $this->childRepo->method('find')->willReturn($child);

        $this->expectException(NotFoundHttpException::class);
        $this->service->findForUser($this->createUser(1), 10);
    }

    public function testFindForUserSoftDeleted(): void
    {
        $user = $this->createUser(1);
        $child = new Child();
        $child->setUser($user);
        $child->setDeletedAt(new \DateTimeImmutable());

        $this->childRepo->method('find')->willReturn($child);

        $this->expectException(NotFoundHttpException::class);
        $this->service->findForUser($user, 10);
    }

    public function testCreate(): void
    {
        $user = $this->createUser(1);
        $dto = new ChildRequest(name: 'Alice', age: 5, gender: 'girl', appearance: 'blond', interests: 'horses', petName: 'Rex');

        $this->em->expects($this->once())->method('persist');
        $this->em->expects($this->once())->method('flush');

        $child = $this->service->create($user, $dto);

        $this->assertSame($user, $child->getUser());
        $this->assertSame('Alice', $child->getName());
        $this->assertSame(5, $child->getAge());
        $this->assertSame('girl', $child->getGender());
        $this->assertSame('blond', $child->getAppearance());
        $this->assertSame('horses', $child->getInterests());
        $this->assertSame('Rex', $child->getPetName());
    }

    public function testUpdate(): void
    {
        $child = new Child();
        $dto = new ChildRequest(name: 'Bob', age: 7, petName: 'Max');

        $this->em->expects($this->once())->method('flush');

        $result = $this->service->update($child, $dto);

        $this->assertSame($child, $result);
        $this->assertSame('Bob', $child->getName());
        $this->assertSame(7, $child->getAge());
        $this->assertSame('Max', $child->getPetName());
        $this->assertNotNull($child->getUpdatedAt());
    }

    public function testSoftDelete(): void
    {
        $child = new Child();
        $this->em->expects($this->once())->method('flush');

        $this->service->softDelete($child);

        $this->assertNotNull($child->getDeletedAt());
    }
}
