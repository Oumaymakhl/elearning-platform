<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class ExecuteController extends Controller
{
    private const TIMEOUT = 15;
    private const MAX_OUTPUT = 10000;

    public function run(Request $request)
    {
        $request->validate([
            'language' => 'required|in:python,java,cpp,php,node',
            'code'     => 'required|string|max:10000',
            'input'    => 'nullable|string|max:1000',
        ]);

        $language = $request->language;
        $code     = $request->code;
        $input    = $request->input ?? '';

        $tmpDir = '/tmp/executor';

        $tmpFiles = [];

        try {
            switch ($language) {
                case 'python':
                    $f = $tmpDir . '/' . uniqid('code_') . '.py';
                    file_put_contents($f, $code);
                    $tmpFiles[] = $f;
                    $cmd = 'python3 ' . escapeshellarg($f);
                    break;

                case 'php':
                    $f = $tmpDir . '/' . uniqid('code_') . '.php';
                    file_put_contents($f, '<?php ' . $code);
                    $tmpFiles[] = $f;
                    $cmd = 'php ' . escapeshellarg($f);
                    break;

                case 'node':
                    $f = $tmpDir . '/' . uniqid('code_') . '.js';
                    file_put_contents($f, $code);
                    $tmpFiles[] = $f;
                    $cmd = 'node ' . escapeshellarg($f);
                    break;

                default:
                    return response()->json(['error' => 'Langage non supporté pour le moment: ' . $language], 422);
            }

            $process = Process::fromShellCommandline($cmd);
            $process->setInput($input);
            $process->setTimeout(self::TIMEOUT);

            $output = '';
            $exitCode = 0;

            try {
                $process->mustRun();
                $output = $process->getOutput();
            } catch (ProcessFailedException $e) {
                $output   = $e->getProcess()->getErrorOutput() ?: $e->getProcess()->getOutput();
                $exitCode = $e->getProcess()->getExitCode();
            }

            if (strlen($output) > self::MAX_OUTPUT) {
                $output = substr($output, 0, self::MAX_OUTPUT) . '\n[Sortie tronquée]';
            }

            return response()->json([
                'output'    => $output,
                'language'  => $language,
                'exit_code' => $exitCode,
                'success'   => $exitCode === 0,
            ]);

        } finally {
            foreach ($tmpFiles as $file) {
                if (file_exists($file)) @unlink($file);
            }
        }
    }
}
