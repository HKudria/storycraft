<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class BookRequest
{
    public function __construct(
        #[Assert\NotBlank]
        public readonly int $childId,

        #[Assert\NotBlank]
        public readonly int $templateId,

        #[Assert\NotBlank]
        #[Assert\Length(max: 500)]
        public readonly string $topic,

        #[Assert\Choice(choices: ['en', 'pl', 'de', 'fr'])]
        public readonly string $language = 'en',
    ) {
    }
}
