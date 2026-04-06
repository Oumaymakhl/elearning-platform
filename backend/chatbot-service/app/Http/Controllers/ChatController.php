<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ChatController extends Controller
{
    private string $groqUrl = "https://api.groq.com/openai/v1/chat/completions";
    private string $apiKey;
    private string $model = "llama-3.1-8b-instant";

    public function __construct()
    {
        $this->apiKey = env('GROQ_API_KEY');
    }

    public function chat(Request $request)
    {
        $request->validate([
            "message"      => "required|string|max:1000",
            "history"      => "nullable|array",
            "course_title" => "nullable|string|max:255",
            "lesson_title" => "nullable|string|max:255",
            "lesson_content" => "nullable|string|max:3000",
        ]);

        $systemPrompt = "Tu es un assistant pédagogique spécialisé en langages de programmation. Réponds TOUJOURS en français. Aide avec Python, Java, C++, PHP, JavaScript. Sois clair et concis.";

        // Enrichir avec le contexte du cours si fourni
        if ($request->course_title) {
            $systemPrompt .= "\n\nCONTEXTE ACTUEL : L'étudiant consulte le cours \"" . $request->course_title . "\".";
            if ($request->lesson_title) {
                $systemPrompt .= " Il est sur la leçon \"" . $request->lesson_title . "\".";
            }
            if ($request->lesson_content) {
                $excerpt = strip_tags($request->lesson_content);
                $excerpt = substr($excerpt, 0, 1500);
                $systemPrompt .= "\n\nContenu de la leçon :\n" . $excerpt;
            }
            $systemPrompt .= "\n\nAdapte tes réponses à ce contexte. Si la question est liée à la leçon, appuie-toi sur son contenu.";
        }

        $messages = [["role" => "system", "content" => $systemPrompt]];

        if ($request->history) {
            foreach ($request->history as $h) {
                $messages[] = ["role" => $h["role"], "content" => $h["content"]];
            }
        }
        $messages[] = ["role" => "user", "content" => $request->message];

        $payload = json_encode([
            "model"       => $this->model,
            "messages"    => $messages,
            "max_tokens"  => 1024,
            "temperature" => 0.7
        ]);

        $ch = curl_init($this->groqUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "Authorization: Bearer " . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if (!$response || $httpCode !== 200) {
            return response()->json([
                "error" => "unavailable",
                "code"  => $httpCode,
                "curl"  => $curlError,
                "resp"  => substr($response, 0, 200)
            ], 503);
        }

        $data  = json_decode($response, true);
        $reply = $data["choices"][0]["message"]["content"] ?? "Erreur.";

        return response()->json([
            "reply"  => $reply,
            "model"  => $this->model,
            "tokens" => $data["usage"]["total_tokens"] ?? null
        ]);
    }

    public function ping()
    {
        return response()->json(["status" => "ok", "provider" => "Groq", "model" => $this->model]);
    }
}
