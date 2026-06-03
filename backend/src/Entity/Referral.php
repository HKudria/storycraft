<?php

namespace App\Entity;

use App\Repository\ReferralRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReferralRepository::class)]
class Referral
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_REWARDED = 'rewarded';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'referralsMade')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $referrer = null;

    #[ORM\ManyToOne(inversedBy: 'referralsReceived')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $referee = null;

    #[ORM\Column(length: 20)]
    private ?string $status = self::STATUS_PENDING;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $rewardedAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getReferrer(): ?User { return $this->referrer; }
    public function setReferrer(?User $referrer): static { $this->referrer = $referrer; return $this; }
    public function getReferee(): ?User { return $this->referee; }
    public function setReferee(?User $referee): static { $this->referee = $referee; return $this; }
    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getRewardedAt(): ?\DateTimeImmutable { return $this->rewardedAt; }
    public function setRewardedAt(?\DateTimeImmutable $rewardedAt): static { $this->rewardedAt = $rewardedAt; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
}
