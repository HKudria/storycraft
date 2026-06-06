<?php

namespace App\Service;

interface StoryProviderInterface
{
    /**
     * Generate a story from a prompt.
     *
     * @return array Decoded story structure with pages, title, etc.
     */
    public function generateStory(string $prompt): array;
}
