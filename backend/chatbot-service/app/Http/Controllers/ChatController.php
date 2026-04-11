<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    private string $groqUrl   = 'https://api.groq.com/openai/v1/chat/completions';
    private string $apiKey;
    private string $model     = 'llama-3.3-70b-versatile';
    private int    $maxHistory = 12;

    public function __construct()
    {
        $this->apiKey = env('GROQ_API_KEY', '');
    }

    public function chat(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'message'           => 'required|string|max:2000',
            'history'           => 'nullable|array|max:50',
            'history.*.role'    => 'required|in:user,assistant',
            'history.*.content' => 'required|string|max:4000',
            'course_title'      => 'nullable|string|max:255',
            'lesson_title'      => 'nullable|string|max:255',
            'lesson_content'    => 'nullable|string|max:4000',
            'conversation_id'   => 'nullable|string|max:64',
        ]);

        $userId = $request->auth_user_id ?? null;
        $systemPrompt = $this->buildSystemPrompt($validated);

        $messages       = [['role' => 'system', 'content' => $systemPrompt]];
        $trimmedHistory = array_slice($request->history ?? [], -$this->maxHistory);
        foreach ($trimmedHistory as $h) {
            $messages[] = ['role' => $h['role'], 'content' => $h['content']];
        }
        $messages[] = ['role' => 'user', 'content' => $validated['message']];

        $payload = json_encode([
            'model'       => $this->model,
            'messages'    => $messages,
            'max_tokens'  => 1500,
            'temperature' => 0.65,
        ]);

        [$response, $httpCode, $curlError] = $this->callGroq($payload);

        if (!$response || $httpCode !== 200) {
            Log::error('Groq API error', ['code' => $httpCode, 'curl' => $curlError]);
            return response()->json(['error' => 'Service IA temporairement indisponible.', 'code' => $httpCode], 503);
        }

        $data  = json_decode($response, true);
        $reply = $data['choices'][0]['message']['content'] ?? 'Erreur de génération.';
        $usage = $data['usage'] ?? [];
        $convId = $this->persistMessage($userId, $validated, $reply);

        return response()->json([
            'reply'           => $reply,
            'model'           => $this->model,
            'tokens'          => $usage['total_tokens'] ?? null,
            'conversation_id' => $convId,
        ]);
    }

    public function history(Request $request, string $conversationId): \Illuminate\Http\JsonResponse
    {
        $messages = DB::table('chat_messages')
            ->where('conversation_id', $conversationId)
            ->where('user_id', $request->auth_user_id)
            ->orderBy('created_at')
            ->get(['role', 'content', 'created_at']);
        return response()->json(['messages' => $messages]);
    }

    public function conversations(Request $request): \Illuminate\Http\JsonResponse
    {
        $convs = DB::table('chat_messages')
            ->where('user_id', $request->auth_user_id)
            ->select('conversation_id', 'course_title', DB::raw('MIN(created_at) as started_at'))
            ->groupBy('conversation_id', 'course_title')
            ->orderByDesc('started_at')
            ->limit(20)
            ->get();
        return response()->json(['conversations' => $convs]);
    }

    public function ping(): \Illuminate\Http\JsonResponse
    {
        return response()->json(['status' => 'ok', 'provider' => 'Groq', 'model' => $this->model]);
    }

    private function buildSystemPrompt(array $data): string
    {
        $prompt  = "Tu es un assistant pédagogique expert en informatique et langages de programmation.\n";
        $prompt .= "Règles :\n- Réponds TOUJOURS en français.\n";
        $prompt .= "- Sois pédagogique, clair et structuré.\n";
        $prompt .= "- Pour le code, utilise des blocs markdown (``` langage).\n";
        $prompt .= "- Donne des exemples concrets quand c'est pertinent.\n\n";

        if (!empty($data['course_title'])) {
            $prompt .= "=== CONTEXTE DU COURS ===\n";
            $prompt .= "Cours actif : « {$data['course_title']} »\n";
            if (!empty($data['lesson_title']))   $prompt .= "Leçon en cours : « {$data['lesson_title']} »\n";
            if (!empty($data['lesson_content'])) {
                $excerpt = preg_replace('/\s+/', ' ', trim(strip_tags($data['lesson_content'])));
                $excerpt = substr($excerpt, 0, 2500);
                $prompt .= "\nContenu de la leçon :\n---\n{$excerpt}\n---\n";
            }
            $prompt .= "\nAdapte tes réponses à ce contexte. Appuie-toi sur le contenu si la question y est liée.\n";
        }

        return $prompt;
    }

    private function callGroq(string $payload): array
    {
        $ch = curl_init($this->groqUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Authorization: Bearer ' . $this->apiKey],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);
        $response  = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        return [$response, $httpCode, $curlError];
    }

    private function persistMessage(?int $userId, array $data, string $reply): ?string
    {
        if (!$userId) return null;
        try {
            $convId = $data['conversation_id'] ?? \Illuminate\Support\Str::uuid()->toString();
            $now    = now();
            DB::table('chat_messages')->insert([
                ['id' => \Illuminate\Support\Str::uuid(), 'conversation_id' => $convId, 'user_id' => $userId,
                 'role' => 'user',      'content' => $data['message'], 'course_title' => $data['course_title'] ?? null,
                 'lesson_title' => $data['lesson_title'] ?? null, 'created_at' => $now, 'updated_at' => $now],
                ['id' => \Illuminate\Support\Str::uuid(), 'conversation_id' => $convId, 'user_id' => $userId,
                 'role' => 'assistant', 'content' => $reply,           'course_title' => $data['course_title'] ?? null,
                 'lesson_title' => $data['lesson_title'] ?? null, 'created_at' => $now, 'updated_at' => $now],
            ]);
            return $convId;
        } catch (\Throwable $e) {
            Log::warning('chat_messages persist failed: ' . $e->getMessage());
            return null;
        }
    }
}
