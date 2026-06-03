<?php

namespace App\Entity;

use App\Repository\TemplateRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TemplateRepository::class)]
class Template
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private ?string $title = null;

    #[ORM\Column(length: 500)]
    private ?string $description = null;

    #[ORM\Column(length: 50)]
    private ?string $category = null;

    #[ORM\Column]
    private ?int $ageMin = null;

    #[ORM\Column]
    private ?int $ageMax = null;

    #[ORM\Column(type: 'text')]
    private ?string $promptBlueprint = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $coverImageUrl = null;

    #[ORM\Column]
    private ?bool $isActive = true;

    #[ORM\OneToMany(targetEntity: Book::class, mappedBy: 'template')]
    private Collection $books;

    public function __construct()
    {
        $this->books = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getTitle(): ?string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }
    public function getCategory(): ?string { return $this->category; }
    public function setCategory(string $category): static { $this->category = $category; return $this; }
    public function getAgeMin(): ?int { return $this->ageMin; }
    public function setAgeMin(int $ageMin): static { $this->ageMin = $ageMin; return $this; }
    public function getAgeMax(): ?int { return $this->ageMax; }
    public function setAgeMax(int $ageMax): static { $this->ageMax = $ageMax; return $this; }
    public function getPromptBlueprint(): ?string { return $this->promptBlueprint; }
    public function setPromptBlueprint(string $promptBlueprint): static { $this->promptBlueprint = $promptBlueprint; return $this; }
    public function getCoverImageUrl(): ?string { return $this->coverImageUrl; }
    public function setCoverImageUrl(?string $coverImageUrl): static { $this->coverImageUrl = $coverImageUrl; return $this; }
    public function isActive(): ?bool { return $this->isActive; }
    public function setIsActive(bool $isActive): static { $this->isActive = $isActive; return $this; }

    /** @return Collection<int, Book> */
    public function getBooks(): Collection { return $this->books; }
}
