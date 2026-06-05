<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class ChildRequest
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 100)]
        public readonly string $name = '',

        #[Assert\NotBlank]
        #[Assert\Range(min: 1, max: 18)]
        public readonly int $age = 0,

        #[Assert\Length(max: 20)]
        public readonly ?string $gender = null,

        #[Assert\Length(max: 500)]
        public readonly ?string $appearance = null,

        #[Assert\Length(max: 500)]
        public readonly ?string $interests = null,

        #[Assert\Length(max: 100)]
        public readonly ?string $petName = null,
    ) {
    }
}
