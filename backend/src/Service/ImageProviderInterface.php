<?php

namespace App\Service;

interface ImageProviderInterface
{
    /**
     * Generate an image from a text prompt.
     *
     * @return string Base64-encoded image data
     */
    public function generateImage(string $prompt): string;
}
