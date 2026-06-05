<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class AnthropicService
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $baseUrl,
        private readonly string $apiKey,
        private readonly string $model,
    ) {
    }

    public function generateStory(string $prompt): array
    {
        $response = $this->httpClient->request('POST', rtrim($this->baseUrl, '/') . '/v1/messages', [
            'headers' => [
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ],
            'json' => [
                'model' => $this->model,
                'max_tokens' => 8192,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ],
        ]);

        $data = $response->toArray();

        $text = $data['content'][0]['text'] ?? '';
        $json = preg_replace('/^```json\s*|\s*```$/', '', trim($text));

        return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    }
}
