<?php

namespace App\DataFixtures;

use App\Entity\Template;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $templates = [
            [
                'title' => 'Adventure',
                'description' => 'An exciting journey full of surprises and bravery',
                'category' => 'adventure',
                'ageMin' => 3,
                'ageMax' => 10,
                'promptBlueprint' => "Write a children's adventure story for {childName}, age {age}. The child {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate a story with exactly 8 pages. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nEach page text should be 2-3 sentences, age-appropriate. Each imagePrompt should describe a vivid scene for illustration.",
            ],
            [
                'title' => 'Bedtime',
                'description' => 'A calming story to help drift off to sleep',
                'category' => 'bedtime',
                'ageMin' => 1,
                'ageMax' => 7,
                'promptBlueprint' => "Write a gentle bedtime story for {childName}, age {age}. The child {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate a calming bedtime story with exactly 8 pages. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nThe story should be soothing, with soft imagery and a sleepy tone. Each page text should be 2-3 short sentences.",
            ],
            [
                'title' => 'Educational',
                'description' => 'Learn something new through a fun story',
                'category' => 'educational',
                'ageMin' => 4,
                'ageMax' => 12,
                'promptBlueprint' => "Write an educational story for {childName}, age {age}. The child {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate an educational story with exactly 8 pages that teaches something about the topic. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nWeave facts naturally into the narrative. Each page text should be 2-3 sentences.",
            ],
            [
                'title' => 'Fairy Tale',
                'description' => 'A magical story with enchantment and wonder',
                'category' => 'fantasy',
                'ageMin' => 3,
                'ageMax' => 9,
                'promptBlueprint' => "Write a fairy tale story for {childName}, age {age}. The child {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate a magical fairy tale with exactly 8 pages. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nInclude magical elements, a gentle conflict, and a happy ending. Each page text should be 2-3 sentences.",
            ],
            [
                'title' => 'Space',
                'description' => 'Blast off on an interstellar adventure',
                'category' => 'sci-fi',
                'ageMin' => 5,
                'ageMax' => 12,
                'promptBlueprint' => "Write a space adventure story for {childName}, age {age}. The child {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate a space-themed story with exactly 8 pages. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nInclude planets, stars, and cosmic wonder. Each page text should be 2-3 sentences.",
            ],
            [
                'title' => 'Ocean',
                'description' => 'Dive into an underwater world of discovery',
                'category' => 'nature',
                'ageMin' => 3,
                'ageMax' => 10,
                'promptBlueprint' => "Write an ocean adventure story for {childName}, age {age}. The child {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate an underwater story with exactly 8 pages. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nInclude sea creatures, coral reefs, and ocean wonders. Each page text should be 2-3 sentences.",
            ],
        ];

        foreach ($templates as $data) {
            $template = new Template();
            $template->setTitle($data['title']);
            $template->setDescription($data['description']);
            $template->setCategory($data['category']);
            $template->setAgeMin($data['ageMin']);
            $template->setAgeMax($data['ageMax']);
            $template->setPromptBlueprint($data['promptBlueprint']);
            $template->setIsActive(true);
            $manager->persist($template);
        }

        $manager->flush();
    }
}
