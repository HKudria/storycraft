<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class CloudflareImageProvider implements ImageProviderInterface
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $accountId,
        private readonly string $apiToken,
    ) {
    }

    public function generateImage(string $prompt): string
    {
        $response = $this->httpClient->request('POST', "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell", [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiToken,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'prompt' => $prompt,
            ],
        ]);

        $data = $response->toArray();

        $image = $data['result']['image'] ?? $data['image'] ?? null;

        if ($image === null) {
            throw new \RuntimeException('No image data in response: ' . json_encode(array_keys($data)));
        }

        return $image;
    }
}
