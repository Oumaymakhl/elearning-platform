<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class QuizGeneratorController extends Controller
{
    private string $groqUrl  = "https://api.groq.com/openai/v1/chat/completions";
    private string $apiKey;
    private string $model    = "llama-3.3-70b-versatile";

    public function __construct()
    {
        $this->apiKey = env('GROQ_API_KEY');
    }

    public function generate(Request $request)
    {
        $request->validate([
            'content'       => 'required|string|min:50|max:8000',
            'chapter_title' => 'nullable|string|max:255',
            'course_title'  => 'nullable|string|max:255',
            'num_questions' => 'nullable|integer|min:2|max:15',
            'difficulty'    => 'nullable|in:facile,moyen,difficile',
            'language'      => 'nullable|string|max:10',
        ]);

        $numQuestions = $request->input('num_questions', 5);
        $difficulty   = $request->input('difficulty', 'moyen');
        $chapterTitle = $request->input('chapter_title', 'ce chapitre');
        $courseTitle  = $request->input('course_title', '');

        $difficultyDesc = match($difficulty) {
            'facile'    => 'simples, directes, vérifier la compréhension basique',
            'difficile' => 'avancées, avec des pièges subtils, tester la maîtrise approfondie',
            default     => 'de difficulté intermédiaire, tester la bonne compréhension',
        };

        $systemPrompt = <<<PROMPT
Tu es un expert en création de quiz pédagogiques. Tu génères des QCM (questions à choix multiples) de haute qualité basés sur un contenu de cours.

RÈGLES ABSOLUES :
1. Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sans backticks, sans markdown.
2. Chaque question a exactement 4 options de réponse.
3. Exactement 1 option est correcte par question.
4. Les mauvaises réponses (distracteurs) doivent être plausibles et liées au sujet.
5. Rédige toutes les questions et options en français.
6. Ne répète jamais la même information dans plusieurs questions.
7. Base-toi UNIQUEMENT sur le contenu fourni.

FORMAT JSON REQUIS :
{
  "quiz_title": "string",
  "questions": [
    {
      "text": "string (la question)",
      "points": number (1 ou 2),
      "explanation": "string (explication courte de la bonne réponse)",
      "options": [
        { "text": "string", "is_correct": true },
        { "text": "string", "is_correct": false },
        { "text": "string", "is_correct": false },
        { "text": "string", "is_correct": false }
      ]
    }
  ]
}
PROMPT;

        $userMessage = "Génère exactement {$numQuestions} questions {$difficultyDesc} pour le chapitre \"{$chapterTitle}\"{$courseTitle}.\n\nCONTENU DU CHAPITRE :\n{$request->content}\n\nGénère {$numQuestions} questions maintenant.";

        $payload = json_encode([
            "model"           => $this->model,
            "messages"        => [
                ["role" => "system", "content" => $systemPrompt],
                ["role" => "user",   "content" => $userMessage],
            ],
            "max_tokens"      => 3000,
            "temperature"     => 0.6,
            "response_format" => ["type" => "json_object"],
        ]);

        $ch = curl_init($this->groqUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "Authorization: Bearer " . $this->apiKey,
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        $response  = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if (!$response || $httpCode !== 200) {
            return response()->json([
                'error'   => 'Groq API unavailable',
                'code'    => $httpCode,
                'details' => $curlError ?: substr($response, 0, 300),
            ], 503);
        }

        $groqData = json_decode($response, true);
        $rawJson  = $groqData['choices'][0]['message']['content'] ?? null;

        if (!$rawJson) {
            return response()->json(['error' => 'Empty response from AI'], 500);
        }

        $rawJson = preg_replace('/^```json\s*/i', '', trim($rawJson));
        $rawJson = preg_replace('/\s*```$/', '', $rawJson);

        $quiz = json_decode($rawJson, true);
        if (json_last_error() !== JSON_ERROR_NONE || !isset($quiz['questions'])) {
            return response()->json(['error' => 'Invalid JSON from AI', 'raw' => substr($rawJson, 0, 500)], 500);
        }

        $questions = array_map(function ($q) {
            $options    = $q['options'] ?? [];
            $hasCorrect = collect($options)->contains('is_correct', true);
            if (!$hasCorrect && count($options) > 0) $options[0]['is_correct'] = true;
            return [
                'text'        => $q['text'] ?? 'Question',
                'points'      => (int) ($q['points'] ?? 1),
                'explanation' => $q['explanation'] ?? '',
                'options'     => array_map(fn($o) => [
                    'text'       => $o['text'] ?? '',
                    'is_correct' => (bool) ($o['is_correct'] ?? false),
                ], $options),
            ];
        }, $quiz['questions']);

        return response()->json([
            'quiz_title' => $quiz['quiz_title'] ?? "Quiz — {$chapterTitle}",
            'questions'  => $questions,
            'meta'       => [
                'num_questions' => count($questions),
                'difficulty'    => $difficulty,
                'tokens_used'   => $groqData['usage']['total_tokens'] ?? null,
                'model'         => $this->model,
            ],
        ]);
    }
}
