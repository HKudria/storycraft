<?php

namespace App\Entity;

use App\Repository\SubscriptionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SubscriptionRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_user_id', columns: ['user_id'])]
class Subscription
{
    public const PLAN_FREE = 'free';
    public const PLAN_BASIC = 'basic';
    public const PLAN_PRO = 'pro';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_PAST_DUE = 'past_due';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'subscription')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(length: 10)]
    private ?string $plan = self::PLAN_FREE;

    #[ORM\Column(length: 20)]
    private ?string $status = self::STATUS_ACTIVE;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $stripeSubscriptionId = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $stripeCustomerId = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $currentPeriodStart = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $currentPeriodEnd = null;

    #[ORM\Column]
    private ?int $booksUsedThisMonth = 0;

    #[ORM\Column]
    private ?int $booksLimit = 1;

    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getPlan(): ?string { return $this->plan; }
    public function setPlan(string $plan): static { $this->plan = $plan; return $this; }
    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getStripeSubscriptionId(): ?string { return $this->stripeSubscriptionId; }
    public function setStripeSubscriptionId(?string $stripeSubscriptionId): static { $this->stripeSubscriptionId = $stripeSubscriptionId; return $this; }
    public function getStripeCustomerId(): ?string { return $this->stripeCustomerId; }
    public function setStripeCustomerId(?string $stripeCustomerId): static { $this->stripeCustomerId = $stripeCustomerId; return $this; }
    public function getCurrentPeriodStart(): ?\DateTimeImmutable { return $this->currentPeriodStart; }
    public function setCurrentPeriodStart(?\DateTimeImmutable $currentPeriodStart): static { $this->currentPeriodStart = $currentPeriodStart; return $this; }
    public function getCurrentPeriodEnd(): ?\DateTimeImmutable { return $this->currentPeriodEnd; }
    public function setCurrentPeriodEnd(?\DateTimeImmutable $currentPeriodEnd): static { $this->currentPeriodEnd = $currentPeriodEnd; return $this; }
    public function getBooksUsedThisMonth(): ?int { return $this->booksUsedThisMonth; }
    public function setBooksUsedThisMonth(int $booksUsedThisMonth): static { $this->booksUsedThisMonth = $booksUsedThisMonth; return $this; }
    public function getBooksLimit(): ?int { return $this->booksLimit; }
    public function setBooksLimit(int $booksLimit): static { $this->booksLimit = $booksLimit; return $this; }
}
