<?php

namespace App\Message;

class GenerateIllustrationMessage
{
    public function __construct(
        public readonly int $bookId,
        public readonly int $pageId,
    ) {
    }
}
