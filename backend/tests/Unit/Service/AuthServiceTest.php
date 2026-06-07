<?php

namespace App\Tests\Unit\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\AuthService;
use Doctrine\ORM\EntityManagerInterface;
use Hidehalo\Nanoid\Client as NanoidClient;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;

class AuthServiceTest extends TestCase
{
    private UserRepository $userRepo;
    private EntityManagerInterface $em;
    private JWTTokenManagerInterface $jwtManager;
    private NanoidClient $nanoid;
    private AuthService $service;

    protected function setUp(): void
    {
        $this->userRepo = $this->createMock(UserRepository::class);
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $this->nanoid = $this->createMock(NanoidClient::class);

        $this->service = new AuthService(
            $this->userRepo,
            $this->em,
            $this->jwtManager,
            $this->nanoid,
        );
    }

    public function testFindOrCreateByGoogleId(): void
    {
        $existing = new User();
        $existing->setGoogleId('g123');
        $existing->setEmail('old@test.com');

        $this->userRepo->method('findByGoogleId')->with('g123')->willReturn($existing);
        $this->em->expects($this->once())->method('flush');

        $user = $this->service->findOrCreateUser('g123', 'new@test.com', 'New Name', 'https://avatar.url');

        $this->assertSame($existing, $user);
        $this->assertSame('New Name', $user->getName());
        $this->assertSame('https://avatar.url', $user->getAvatarUrl());
    }

    public function testFindOrCreateByEmailOnly(): void
    {
        $existing = new User();
        $existing->setEmail('test@test.com');

        $this->userRepo->method('findByGoogleId')->willReturn(null);
        $this->userRepo->method('findByEmail')->with('test@test.com')->willReturn($existing);
        $this->em->expects($this->once())->method('flush');

        $user = $this->service->findOrCreateUser('g_new', 'test@test.com', 'Name', null);

        $this->assertSame($existing, $user);
        // findOrCreateUser only sets googleId on brand new users
        $this->assertSame('Name', $user->getName());
    }

    public function testFindOrCreateBrandNewUser(): void
    {
        $this->userRepo->method('findByGoogleId')->willReturn(null);
        $this->userRepo->method('findByEmail')->willReturn(null);
        $this->userRepo->method('findOneBy')->willReturn(null);

        $this->nanoid->method('formatedId')->willReturn('abc12345');

        $this->em->expects($this->once())->method('persist');
        $this->em->expects($this->once())->method('flush');

        $user = $this->service->findOrCreateUser('g_new', 'new@test.com', 'New User', 'https://pic.url');

        $this->assertSame('g_new', $user->getGoogleId());
        $this->assertSame('new@test.com', $user->getEmail());
        $this->assertSame('New User', $user->getName());
        $this->assertSame('abc12345', $user->getReferralCode());
    }

    public function testIssueTokens(): void
    {
        $user = new User();
        $this->jwtManager->method('create')->willReturn('jwt.token.here');
        $this->em->expects($this->once())->method('flush');

        $tokens = $this->service->issueTokens($user);

        $this->assertSame('jwt.token.here', $tokens['accessToken']);
        $this->assertSame(64, strlen($tokens['refreshToken']));
        $this->assertSame($tokens['refreshToken'], $user->getRefreshToken());
    }

    public function testRefreshAccessTokenValid(): void
    {
        $user = new User();
        $user->setUpdatedAt(new \DateTimeImmutable());

        $this->userRepo->method('findByRefreshToken')->with('valid_token')->willReturn($user);
        $this->jwtManager->method('create')->willReturn('new.jwt.token');

        $result = $this->service->refreshAccessToken('valid_token');

        $this->assertSame('new.jwt.token', $result);
    }

    public function testRefreshAccessTokenNotFound(): void
    {
        $this->userRepo->method('findByRefreshToken')->willReturn(null);

        $this->assertNull($this->service->refreshAccessToken('missing_token'));
    }

    public function testRefreshAccessTokenExpired(): void
    {
        $user = new User();
        $user->setUpdatedAt(new \DateTimeImmutable('-8 days'));
        $user->setRefreshToken('old_token');

        $this->userRepo->method('findByRefreshToken')->willReturn($user);
        $this->em->expects($this->once())->method('flush');

        $result = $this->service->refreshAccessToken('old_token');

        $this->assertNull($result);
        $this->assertNull($user->getRefreshToken());
    }

    public function testRefreshAccessTokenExactlyAtTTL(): void
    {
        $user = new User();
        $user->setUpdatedAt((new \DateTimeImmutable())->sub(new \DateInterval('P7D')));
        $user->setRefreshToken('border_token');

        $this->userRepo->method('findByRefreshToken')->willReturn($user);

        $result = $this->service->refreshAccessToken('border_token');
        $this->assertNull($result);
    }

    public function testInvalidateRefreshToken(): void
    {
        $user = new User();
        $user->setRefreshToken('some_token');

        $this->em->expects($this->once())->method('flush');

        $this->service->invalidateRefreshToken($user);

        $this->assertNull($user->getRefreshToken());
    }

    public function testGenerateUniqueReferralCodeNoCollision(): void
    {
        $this->nanoid->expects($this->once())->method('formatedId')->willReturn('xyz98765');
        $this->userRepo->method('findOneBy')->willReturn(null);

        $code = $this->service->generateUniqueReferralCode();

        $this->assertSame('xyz98765', $code);
    }

    public function testGenerateUniqueReferralCodeWithCollision(): void
    {
        $this->nanoid->method('formatedId')->willReturnOnConsecutiveCalls('dup12345', 'uni67890');
        $this->userRepo->method('findOneBy')
            ->willReturnOnConsecutiveCalls(new User(), null);

        $code = $this->service->generateUniqueReferralCode();

        $this->assertSame('uni67890', $code);
    }
}
