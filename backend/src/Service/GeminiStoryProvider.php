<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class GeminiStoryProvider implements StoryProviderInterface
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $apiKey,
        private readonly string $model = 'gemini-3.5-flash',
    ) {
    }

    public function generateStory(string $prompt): array
    {
        $response = $this->httpClient->request('POST', "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}", [
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'system_instruction' => [
                    'parts' => [
                        ['text' => 'You are a creative children\'s story writer. Every story must be completely original. Never reuse character names, plot points, or specific scenes from previous stories. Session ID: ' . bin2hex(random_bytes(8))],
                    ],
                ],
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'maxOutputTokens' => 8192,
                ],
            ],
        ]);

        $data = $response->toArray();

        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $json = preg_replace('/^```json\s*|\s*```$/', '', trim($text));

        return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    }
}
