<?php

namespace App\Message;

class GeneratePdfMessage
{
    public function __construct(
        public readonly int $bookId,
    ) {
    }
}
