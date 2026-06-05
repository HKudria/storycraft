<?php

namespace App\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

class AuthService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
        private readonly JWTTokenManagerInterface $jwtManager,
    ) {
    }

    const int TOKEN_TTL_DAYS = 7;

    public function findOrCreateUser(string $googleId, string $email, string $name, ?string $avatarUrl): User
    {
        $user = $this->userRepository->findByGoogleId($googleId);

        if (!$user) {
            $user = $this->userRepository->findByEmail($email);
        }

        if (!$user) {
            $user = new User();
            $user->setGoogleId($googleId);
            $user->setEmail($email);
        }

        $user->setName($name);
        $user->setAvatarUrl($avatarUrl);
        $user->setUpdatedAt(new \DateTimeImmutable());

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    /**
     * @return array{accessToken: string, refreshToken: string}
     */
    public function issueTokens(User $user): array
    {
        $accessToken = $this->jwtManager->create($user);
        $refreshToken = bin2hex(random_bytes(32));

        $user->setRefreshToken($refreshToken);
        $user->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        return [
            'accessToken' => $accessToken,
            'refreshToken' => $refreshToken,
        ];
    }

    public function refreshAccessToken(string $refreshToken): ?string
    {
        $user = $this->userRepository->findByRefreshToken($refreshToken);

        if (!$user) {
            return null;
        }

        $updatedAt = $user->getUpdatedAt();
        if ($updatedAt && $updatedAt->diff(new \DateTimeImmutable())->days >= self::TOKEN_TTL_DAYS) {
            $user->setRefreshToken(null);
            $this->em->flush();
            return null;
        }

        return $this->jwtManager->create($user);
    }

    public function invalidateRefreshToken(User $user): void
    {
        $user->setRefreshToken(null);
        $this->em->flush();
    }
}
