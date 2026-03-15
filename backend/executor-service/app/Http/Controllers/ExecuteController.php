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
            'language' => 'required|in:python,php,node,cpp,bash,c,perl,java,go,ruby',
            'code'     => 'required|string|max:10000',
            'input'    => 'nullable|string|max:1000',
        ]);
        $language = $request->language;
        $code     = $request->code;
        $input    = $request->input ?? '';
        $tmpDir   = '/tmp/executor';
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
                case 'cpp':
                    $src = $tmpDir . '/' . uniqid('code_') . '.cpp';
                    $bin = $tmpDir . '/' . uniqid('bin_');
                    file_put_contents($src, $code);
                    $tmpFiles[] = $src;
                    $tmpFiles[] = $bin;
                    // Compiler d'abord
                    $compile = Process::fromShellCommandline('g++ ' . escapeshellarg($src) . ' -o ' . escapeshellarg($bin));
                    $compile->setTimeout(self::TIMEOUT);
                    try {
                        $compile->mustRun();
                    } catch (ProcessFailedException $e) {
                        return response()->json([
                            'output'    => $e->getProcess()->getErrorOutput(),
                            'language'  => $language,
                            'exit_code' => $e->getProcess()->getExitCode(),
                            'success'   => false,
                        ]);
                    }
                    $cmd = escapeshellarg($bin);
                    break;
                case 'bash':
                    $f = $tmpDir . '/' . uniqid('code_') . '.sh';
                    file_put_contents($f, $code);
                    chmod($f, 0755);
                    $tmpFiles[] = $f;
                    $cmd = 'bash ' . escapeshellarg($f);
                    break;
                case 'c':
                    $src = $tmpDir . '/' . uniqid('code_') . '.c';
                    $bin = $tmpDir . '/' . uniqid('bin_');
                    file_put_contents($src, $code);
                    $tmpFiles[] = $src;
                    $tmpFiles[] = $bin;
                    $compile = Process::fromShellCommandline('gcc ' . escapeshellarg($src) . ' -o ' . escapeshellarg($bin) . ' -lm');
                    $compile->setTimeout(self::TIMEOUT);
                    try {
                        $compile->mustRun();
                    } catch (ProcessFailedException $e) {
                        return response()->json([
                            'output'    => $e->getProcess()->getErrorOutput(),
                            'language'  => $language,
                            'exit_code' => $e->getProcess()->getExitCode(),
                            'success'   => false,
                        ]);
                    }
                    $cmd = escapeshellarg($bin);
                    break;
                case 'perl':
                    $f = $tmpDir . '/' . uniqid('code_') . '.pl';
                    file_put_contents($f, $code);
                    $tmpFiles[] = $f;
                    $cmd = 'perl ' . escapeshellarg($f);
                    break;
                case 'ruby':
                    $f = $tmpDir . '/' . uniqid('code_') . '.rb';
                    file_put_contents($f, $code);
                    $tmpFiles[] = $f;
                    $cmd = 'ruby ' . escapeshellarg($f);
                    break;
                case 'go':
                    $f = $tmpDir . '/' . uniqid('code_') . '.go';
                    file_put_contents($f, $code);
                    $tmpFiles[] = $f;
                    $cmd = 'GOCACHE=/tmp/go-cache GOPATH=/tmp/gopath go run ' . escapeshellarg($f);
                    break;
                case 'java':
                    $f = $tmpDir . '/Main.java';
                    file_put_contents($f, $code);
                    $tmpFiles[] = $f;
                    $classFile = $tmpDir . '/Main.class';
                    $tmpFiles[] = $classFile;
                    $compile = Process::fromShellCommandline('javac ' . escapeshellarg($f) . ' -d ' . escapeshellarg($tmpDir));
                    $compile->setTimeout(self::TIMEOUT);
                    try {
                        $compile->mustRun();
                    } catch (ProcessFailedException $e) {
                        return response()->json([
                            'output'    => $e->getProcess()->getErrorOutput(),
                            'language'  => $language,
                            'exit_code' => $e->getProcess()->getExitCode(),
                            'success'   => false,
                        ]);
                    }
                    $cmd = 'java -cp ' . escapeshellarg($tmpDir) . ' Main';
                    break;
                default:
                    return response()->json(['error' => 'Langage non supporté: ' . $language], 422);
            }
            $process = Process::fromShellCommandline($cmd);
            $process->setInput($input);
            $process->setTimeout(self::TIMEOUT);
            $output   = '';
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
