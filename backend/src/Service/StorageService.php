<?php

namespace App\Service;

use Aws\S3\S3Client;

class StorageService
{
    private readonly S3Client $client;
    private readonly S3Client $publicClient;
    private readonly string $bucket;

    public function __construct(
        string $endpoint,
        string $key,
        string $secret,
        string $bucket,
        string $region,
        string $publicUrl = '',
    ) {
        $this->bucket = $bucket;
        $this->client = $this->createClient($endpoint, $key, $secret, $region);

        $publicEndpoint = $publicUrl ?: $endpoint;
        $this->publicClient = $this->createClient($publicEndpoint, $key, $secret, $region);
    }

    private function createClient(string $endpoint, string $key, string $secret, string $region): S3Client
    {
        return new S3Client([
            'version' => 'latest',
            'region' => $region,
            'endpoint' => $endpoint,
            'use_path_style_endpoint' => true,
            'credentials' => [
                'key' => $key,
                'secret' => $secret,
            ],
        ]);
    }

    public function upload(string $key, string $content, string $contentType = 'application/octet-stream'): void
    {
        $this->client->putObject([
            'Bucket' => $this->bucket,
            'Key' => $key,
            'Body' => $content,
            'ContentType' => $contentType,
        ]);
    }

    public function getPresignedUrl(string $key, int $ttlSeconds = 3600): string
    {
        $cmd = $this->publicClient->getCommand('GetObject', [
            'Bucket' => $this->bucket,
            'Key' => $key,
        ]);

        return (string) $this->publicClient->createPresignedRequest($cmd, "+{$ttlSeconds} seconds")->getUri();
    }

    public function delete(string $key): void
    {
        $this->client->deleteObject([
            'Bucket' => $this->bucket,
            'Key' => $key,
        ]);
    }
}
