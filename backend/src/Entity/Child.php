<?php

namespace App\Entity;

use App\Repository\ChildRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ChildRepository::class)]
class Child
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'children')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(length: 100)]
    private ?string $name = null;

    #[ORM\Column]
    private ?int $age = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $gender = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $appearance = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $interests = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $petName = null;

    #[ORM\OneToMany(targetEntity: Book::class, mappedBy: 'child')]
    private Collection $books;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->books = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getName(): ?string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }
    public function getAge(): ?int { return $this->age; }
    public function setAge(int $age): static { $this->age = $age; return $this; }
    public function getGender(): ?string { return $this->gender; }
    public function setGender(?string $gender): static { $this->gender = $gender; return $this; }
    public function getAppearance(): ?string { return $this->appearance; }
    public function setAppearance(?string $appearance): static { $this->appearance = $appearance; return $this; }
    public function getInterests(): ?string { return $this->interests; }
    public function setInterests(?string $interests): static { $this->interests = $interests; return $this; }
    public function getPetName(): ?string { return $this->petName; }
    public function setPetName(?string $petName): static { $this->petName = $petName; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }

    /** @return Collection<int, Book> */
    public function getBooks(): Collection { return $this->books; }
}
