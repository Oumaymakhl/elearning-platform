<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ChatController extends Controller
{
    private string $ollamaUrl = 'http://host.docker.internal:11434';
    private string $model = 'phi3:mini';

    public function chat(Request $request)
    {
        $request->validate([
            'message'  => 'required|string|max:1000',
            'history'  => 'nullable|array',
        ]);

        $systemPrompt = "Tu es un assistant spécialisé en langages de programmation pour une plateforme e-learning. 
Tu réponds TOUJOURS en français.
Tu aides les étudiants avec: Python, Java, C++, PHP, JavaScript et autres langages.
Tu expliques les erreurs de code, corriges le code, suggères des bonnes pratiques.
Tu es pédagogique, clair et concis.
Si une question n'est pas liée à la programmation, redirige poliment vers les sujets informatiques.";

        $messages = [];
        if ($request->history) {
            foreach ($request->history as $h) {
                $messages[] = ['role' => $h['role'], 'content' => $h['content']];
            }
        }
        $messages[] = ['role' => 'user', 'content' => $request->message];

        $payload = [
            'model'    => $this->model,
            'messages' => array_merge(
                [['role' => 'system', 'content' => $systemPrompt]],
                $messages
            ),
            'stream'   => false,
            'options'  => ['temperature' => 0.7, 'num_predict' => 500],
        ];

        $ch = curl_init($this->ollamaUrl . '/api/chat');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$response || $httpCode !== 200) {
            return response()->json([
                'error' => 'Ollama service unavailable',
                'http_code' => $httpCode,
                'curl_error' => curl_error($ch),
                'response_preview' => substr($response, 0, 200),
            ], 503);
        }

        $data = json_decode($response, true);
        $reply = $data['message']['content'] ?? 'Désolé, je n\'ai pas pu générer une réponse.';

        return response()->json([
            'reply'   => $reply,
            'model'   => $this->model,
            'tokens'  => $data['eval_count'] ?? null,
        ]);
    }

    public function ping()
    {
        $ch = curl_init('http://host.docker.internal:11434/api/tags');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $response = curl_exec($ch);
        curl_close($ch);

        $models = [];
        if ($response) {
            $data = json_decode($response, true);
            $models = array_column($data['models'] ?? [], 'name');
        }

        return response()->json([
            'status' => $response ? 'ok' : 'unavailable',
            'models' => $models,
        ]);
    }
}
