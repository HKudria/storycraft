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
                'promptBlueprint' => "IMPORTANT: The main character's name is {childName}. You MUST use the name \"{childName}\" throughout the story, NOT the topic as a name.\n\nWrite a children's adventure story about {childName}, age {age}. {childName} is a child who {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate a story with exactly 8 pages. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nEach page text should be 4-6 sentences, descriptive and immersive, age-appropriate. Always refer to the main character as {childName}. Each imagePrompt should describe a vivid scene for illustration.",
            ],
            [
                'title' => 'Bedtime',
                'description' => 'A calming story to help drift off to sleep',
                'category' => 'bedtime',
                'ageMin' => 1,
                'ageMax' => 7,
                'promptBlueprint' => "IMPORTANT: The main character's name is {childName}. You MUST use the name \"{childName}\" throughout the story, NOT the topic as a name.\n\nWrite a gentle bedtime story about {childName}, age {age}. {childName} is a child who {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate a calming bedtime story with exactly 8 pages. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nThe story should be soothing, with soft imagery and a sleepy tone. Always refer to the main character as {childName}. Each page text should be 4-6 sentences, rich in calming description.",
            ],
            [
                'title' => 'Educational',
                'description' => 'Learn something new through a fun story',
                'category' => 'educational',
                'ageMin' => 4,
                'ageMax' => 12,
                'promptBlueprint' => "IMPORTANT: The main character's name is {childName}. You MUST use the name \"{childName}\" throughout the story, NOT the topic as a name.\n\nWrite an educational story about {childName}, age {age}. {childName} is a child who {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate an educational story with exactly 8 pages that teaches something about the topic. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nWeave facts naturally into the narrative. Always refer to the main character as {childName}. Each page text should be 4-6 sentences with rich detail.",
            ],
            [
                'title' => 'Fairy Tale',
                'description' => 'A magical story with enchantment and wonder',
                'category' => 'fantasy',
                'ageMin' => 3,
                'ageMax' => 9,
                'promptBlueprint' => "IMPORTANT: The main character's name is {childName}. You MUST use the name \"{childName}\" throughout the story, NOT the topic as a name.\n\nWrite a fairy tale story about {childName}, age {age}. {childName} is a child who {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate a magical fairy tale with exactly 8 pages. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nInclude magical elements, a gentle conflict, and a happy ending. Always refer to the main character as {childName}. Each page text should be 4-6 sentences, enchanting and descriptive.",
            ],
            [
                'title' => 'Space',
                'description' => 'Blast off on an interstellar adventure',
                'category' => 'sci-fi',
                'ageMin' => 5,
                'ageMax' => 12,
                'promptBlueprint' => "IMPORTANT: The main character's name is {childName}. You MUST use the name \"{childName}\" throughout the story, NOT the topic as a name.\n\nWrite a space adventure story about {childName}, age {age}. {childName} is a child who {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate a space-themed story with exactly 8 pages. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nInclude planets, stars, and cosmic wonder. Always refer to the main character as {childName}. Each page text should be 4-6 sentences, vivid and immersive.",
            ],
            [
                'title' => 'Ocean',
                'description' => 'Dive into an underwater world of discovery',
                'category' => 'nature',
                'ageMin' => 3,
                'ageMax' => 10,
                'promptBlueprint' => "IMPORTANT: The main character's name is {childName}. You MUST use the name \"{childName}\" throughout the story, NOT the topic as a name.\n\nWrite an ocean adventure story about {childName}, age {age}. {childName} is a child who {appearance} with interests in {interests}. {petLine}\n\nTopic: {topic}\n\nLanguage: {language}\n\nCreate an underwater story with exactly 8 pages. For each page, provide JSON:\n{\"pages\": [{\"text\": \"...\", \"imagePrompt\": \"...\"}]}\n\nInclude sea creatures, coral reefs, and ocean wonders. Always refer to the main character as {childName}. Each page text should be 4-6 sentences, rich and descriptive.",
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
