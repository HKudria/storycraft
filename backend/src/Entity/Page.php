<?php

namespace App\Entity;

use App\Repository\PageRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PageRepository::class)]
class Page
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'pages')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Book $book = null;

    #[ORM\Column]
    private ?int $pageNumber = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $text = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $imagePrompt = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $imageS3Key = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getBook(): ?Book { return $this->book; }
    public function setBook(?Book $book): static { $this->book = $book; return $this; }
    public function getPageNumber(): ?int { return $this->pageNumber; }
    public function setPageNumber(int $pageNumber): static { $this->pageNumber = $pageNumber; return $this; }
    public function getText(): ?string { return $this->text; }
    public function setText(?string $text): static { $this->text = $text; return $this; }
    public function getImagePrompt(): ?string { return $this->imagePrompt; }
    public function setImagePrompt(?string $imagePrompt): static { $this->imagePrompt = $imagePrompt; return $this; }
    public function getImageS3Key(): ?string { return $this->imageS3Key; }
    public function setImageS3Key(?string $imageS3Key): static { $this->imageS3Key = $imageS3Key; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
}
