<?php

namespace App\Controller;

use App\Entity\Template;
use App\Repository\TemplateRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

class TemplateController extends AbstractController
{
    public function __construct(
        private readonly TemplateRepository $templateRepository,
        private readonly TranslatorInterface $translator,
    ) {
    }

    #[Route('/api/templates', name: 'templates_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $templates = $this->templateRepository->findFiltered(
            $request->query->get('category'),
            $request->query->get('ageMin') !== null ? (int) $request->query->get('ageMin') : null,
            $request->query->get('ageMax') !== null ? (int) $request->query->get('ageMax') : null,
        );

        return new JsonResponse(array_map(
            fn(Template $t) => $this->serializeTemplate($t),
            $templates,
        ));
    }

    #[Route('/api/templates/{id}', name: 'templates_get', methods: ['GET'])]
    public function get(int $id): JsonResponse
    {
        $template = $this->templateRepository->find($id);

        if (!$template || !$template->isActive()) {
            throw new NotFoundHttpException($this->translator->trans('error.template_not_found'));
        }

        return new JsonResponse($this->serializeTemplate($template));
    }

    private function serializeTemplate(Template $t): array
    {
        return [
            'id' => $t->getId(),
            'title' => $t->getTitle(),
            'description' => $t->getDescription(),
            'category' => $t->getCategory(),
            'ageMin' => $t->getAgeMin(),
            'ageMax' => $t->getAgeMax(),
            'coverImageUrl' => $t->getCoverImageUrl(),
        ];
    }
}
