<?php

namespace App\Entity;

use App\Repository\BookRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BookRepository::class)]
class Book
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_DONE = 'done';
    public const STATUS_FAILED = 'failed';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'books')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'books')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Child $child = null;

    #[ORM\ManyToOne(inversedBy: 'books')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Template $template = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $title = null;

    #[ORM\Column(length: 5)]
    private ?string $language = 'en';

    #[ORM\Column(length: 500)]
    private ?string $topic = null;

    #[ORM\Column(length: 20)]
    private ?string $status = self::STATUS_PENDING;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $pdfS3Key = null;

    #[ORM\Column]
    private ?bool $isPublic = false;

    #[ORM\OneToMany(targetEntity: Page::class, mappedBy: 'book', orphanRemoval: true)]
    private Collection $pages;

    #[ORM\OneToMany(targetEntity: Job::class, mappedBy: 'book', orphanRemoval: true)]
    private Collection $jobs;

    #[ORM\OneToMany(targetEntity: Rating::class, mappedBy: 'book', orphanRemoval: true)]
    private Collection $ratings;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->pages = new ArrayCollection();
        $this->jobs = new ArrayCollection();
        $this->ratings = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getChild(): ?Child { return $this->child; }
    public function setChild(?Child $child): static { $this->child = $child; return $this; }
    public function getTemplate(): ?Template { return $this->template; }
    public function setTemplate(?Template $template): static { $this->template = $template; return $this; }
    public function getTitle(): ?string { return $this->title; }
    public function setTitle(?string $title): static { $this->title = $title; return $this; }
    public function getLanguage(): ?string { return $this->language; }
    public function setLanguage(string $language): static { $this->language = $language; return $this; }
    public function getTopic(): ?string { return $this->topic; }
    public function setTopic(string $topic): static { $this->topic = $topic; return $this; }
    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getPdfS3Key(): ?string { return $this->pdfS3Key; }
    public function setPdfS3Key(?string $pdfS3Key): static { $this->pdfS3Key = $pdfS3Key; return $this; }
    public function isPublic(): ?bool { return $this->isPublic; }
    public function setIsPublic(bool $isPublic): static { $this->isPublic = $isPublic; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }

    /** @return Collection<int, Page> */
    public function getPages(): Collection { return $this->pages; }

    /** @return Collection<int, Job> */
    public function getJobs(): Collection { return $this->jobs; }

    /** @return Collection<int, Rating> */
    public function getRatings(): Collection { return $this->ratings; }
}
