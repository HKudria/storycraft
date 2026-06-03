<?php

namespace App\Message;

class GenerateStoryMessage
{
    public function __construct(
        public readonly int $bookId,
    ) {
    }
}
