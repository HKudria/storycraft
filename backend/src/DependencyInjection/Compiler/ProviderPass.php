<?php

namespace App\DependencyInjection\Compiler;

use App\Service\AnthropicStoryProvider;
use App\Service\CloudflareImageProvider;
use App\Service\GeminiImageProvider;
use App\Service\GeminiStoryProvider;
use App\Service\ImageProviderInterface;
use App\Service\StoryProviderInterface;
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;

class ProviderPass implements CompilerPassInterface
{
    public function process(ContainerBuilder $container): void
    {
        $this->wireProvider(
            $container,
            'IMAGE_PROVIDER',
            ImageProviderInterface::class,
            [
                'cloudflare' => CloudflareImageProvider::class,
                'gemini' => GeminiImageProvider::class,
            ],
        );

        $this->wireProvider(
            $container,
            'STORY_PROVIDER',
            StoryProviderInterface::class,
            [
                'anthropic' => AnthropicStoryProvider::class,
                'gemini' => GeminiStoryProvider::class,
            ],
        );
    }

    /**
     * @param array<string, string> $map
     */
    private function wireProvider(ContainerBuilder $container, string $envVar, string $interface, array $map): void
    {
        $provider = $_SERVER[$envVar] ?? $_ENV[$envVar] ?? array_key_first($map);

        $providerId = $map[$provider] ?? throw new \LogicException(sprintf(
            'Unknown %s "%s". Valid values: %s',
            $envVar,
            $provider,
            implode(', ', array_keys($map)),
        ));

        $container->setAlias($interface, $providerId);
    }
}
