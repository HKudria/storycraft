<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User implements UserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    private ?string $googleId = null;

    #[ORM\Column(length: 255, unique: true)]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $avatarUrl = null;

    #[ORM\Column(length: 8, unique: true, nullable: true)]
    private ?string $referralCode = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $refreshToken = null;

    #[ORM\Column(type: 'json')]
    private array $roles = ['ROLE_USER'];

    #[ORM\OneToMany(targetEntity: Child::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $children;

    #[ORM\OneToMany(targetEntity: Book::class, mappedBy: 'user')]
    private Collection $books;

    #[ORM\OneToOne(targetEntity: Subscription::class, mappedBy: 'user', cascade: ['persist', 'remove'])]
    private ?Subscription $subscription = null;

    #[ORM\OneToMany(targetEntity: Rating::class, mappedBy: 'user')]
    private Collection $ratings;

    #[ORM\OneToMany(targetEntity: Referral::class, mappedBy: 'referrer')]
    private Collection $referralsMade;

    #[ORM\OneToMany(targetEntity: Referral::class, mappedBy: 'referee')]
    private Collection $referralsReceived;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->children = new ArrayCollection();
        $this->books = new ArrayCollection();
        $this->ratings = new ArrayCollection();
        $this->referralsMade = new ArrayCollection();
        $this->referralsReceived = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getGoogleId(): ?string { return $this->googleId; }
    public function setGoogleId(string $googleId): static { $this->googleId = $googleId; return $this; }
    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }
    public function getName(): ?string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }
    public function getAvatarUrl(): ?string { return $this->avatarUrl; }
    public function setAvatarUrl(?string $avatarUrl): static { $this->avatarUrl = $avatarUrl; return $this; }
    public function getReferralCode(): ?string { return $this->referralCode; }
    public function setReferralCode(?string $referralCode): static { $this->referralCode = $referralCode; return $this; }
    public function getRefreshToken(): ?string { return $this->refreshToken; }
    public function setRefreshToken(?string $refreshToken): static { $this->refreshToken = $refreshToken; return $this; }
    public function getSubscription(): ?Subscription { return $this->subscription; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }

    /** @return Collection<int, Child> */
    public function getChildren(): Collection { return $this->children; }
    public function addChild(Child $child): static
    {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setUser($this);
        }
        return $this;
    }

    /** @return Collection<int, Book> */
    public function getBooks(): Collection { return $this->books; }

    /** @return Collection<int, Rating> */
    public function getRatings(): Collection { return $this->ratings; }

    /** @return Collection<int, Referral> */
    public function getReferralsMade(): Collection { return $this->referralsMade; }

    /** @return Collection<int, Referral> */
    public function getReferralsReceived(): Collection { return $this->referralsReceived; }

    public function getUserIdentifier(): string { return $this->email; }
    public function getRoles(): array { return $this->roles; }
    public function setRoles(array $roles): static { $this->roles = $roles; return $this; }
    public function eraseCredentials(): void {}
}
