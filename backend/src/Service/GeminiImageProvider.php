<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class GeminiImageProvider implements ImageProviderInterface
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $apiKey,
    ) {
    }

    public function generateImage(string $prompt): string
    {
        $response = $this->httpClient->request('POST', 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-image:generateContent', [
            'headers' => [
                'x-goog-api-key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
            ],
        ]);

        $data = $response->toArray();

        foreach ($data['candidates'][0]['content']['parts'] ?? [] as $part) {
            if (isset($part['inlineData']['data'])) {
                return $part['inlineData']['data'];
            }
        }

        throw new \RuntimeException('No image data in Gemini response: ' . json_encode(array_keys($data)));
    }
}
