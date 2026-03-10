<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class ExecuteController extends Controller
{
    private const TIMEOUT    = 15;
    private const MAX_OUTPUT = 50000;

    public function run(Request $request)
    {
        $request->validate([
            'language'   => 'required|in:python,java,cpp,php,node',
            'code'       => 'required|string|max:10000',
            'input'      => 'nullable|string|max:1000',
            'test_code'  => 'nullable|string|max:10000', // JUnit test class
            'is_lab'     => 'nullable|boolean',
        ]);

        $language = $request->language;
        $code     = $request->code;
        $input    = $request->input ?? '';
        $testCode = $request->test_code;
        $isLab    = $request->boolean('is_lab');

        try {
            if ($isLab && $testCode && $language === 'java') {
                [$cmd, $tmpFiles] = $this->buildJUnitCommand($code, $testCode);
            } else {
                [$cmd, $tmpFiles] = $this->buildCommand($language, $code, $input);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        $process = Process::fromShellCommandline($cmd);
        $process->setTimeout(self::TIMEOUT);

        $output = '';
        $exitCode = 0;
        try {
            $process->mustRun();
            $output = $process->getOutput();
        } catch (ProcessFailedException $e) {
            $output   = $e->getProcess()->getErrorOutput() ?: $e->getProcess()->getOutput();
            $exitCode = $e->getProcess()->getExitCode();
        } catch (\Exception $e) {
            $output   = 'Erreur : ' . $e->getMessage();
            $exitCode = 1;
        } finally {
            foreach ($tmpFiles as $file) {
                if (file_exists($file)) @unlink($file);
            }
        }

        if (strlen($output) > self::MAX_OUTPUT) {
            $output = substr($output, 0, self::MAX_OUTPUT) . "\n[Sortie tronquée]";
        }

        return response()->json([
            'output'    => $output,
            'language'  => $language,
            'exit_code' => $exitCode,
            'success'   => $exitCode === 0,
        ]);
    }

    private function buildCommand(string $language, string $code, string $input): array
    {
        $tmpDir   = '/tmp/executor';
        $tmpFiles = [];
        if (!is_dir($tmpDir)) mkdir($tmpDir, 0777, true);

        $opts = '--rm --network none --memory="128m" --cpus="0.5"';

        $inputFile = $tmpDir . '/' . uniqid('input_') . '.txt';
        file_put_contents($inputFile, $input);
        $tmpFiles[] = $inputFile;

        switch ($language) {
            case 'python':
                $f = $tmpDir . '/' . uniqid('code_') . '.py';
                file_put_contents($f, $code);
                $tmpFiles[] = $f;
                $cmd = "cat " . escapeshellarg($inputFile)
                     . " | docker run $opts"
                     . " -v " . escapeshellarg($f) . ":/tmp/code.py:ro"
                     . " python:3.11-slim python /tmp/code.py 2>&1";
                break;

            case 'java':
                $f = $tmpDir . '/' . uniqid('Main_') . '.java';
                file_put_contents($f, $code);
                $tmpFiles[] = $f;
                $cmd = "cat " . escapeshellarg($inputFile)
                     . " | docker run $opts"
                     . " -v " . escapeshellarg($f) . ":/tmp/Main.java:ro"
                     . " openjdk:27-ea-trixie sh -c"
                     . " 'cd /tmp && javac Main.java && java Main' 2>&1";
                break;

            case 'cpp':
                $f = $tmpDir . '/' . uniqid('prog_') . '.cpp';
                file_put_contents($f,
                    "#include <iostream>\nusing namespace std;\nint main() {\n    "
                    . $code . "\n    return 0;\n}"
                );
                $tmpFiles[] = $f;
                $cmd = "cat " . escapeshellarg($inputFile)
                     . " | docker run $opts"
                     . " -v " . escapeshellarg($f) . ":/tmp/prog.cpp:ro"
                     . " gcc:latest sh -c 'g++ /tmp/prog.cpp -o /tmp/prog && /tmp/prog' 2>&1";
                break;

            case 'php':
                $f = $tmpDir . '/' . uniqid('code_') . '.php';
                file_put_contents($f, '<?php ' . $code);
                $tmpFiles[] = $f;
                $cmd = "cat " . escapeshellarg($inputFile)
                     . " | docker run $opts"
                     . " -v " . escapeshellarg($f) . ":/tmp/code.php:ro"
                     . " php:8.2-cli php /tmp/code.php 2>&1";
                break;

            case 'node':
                $f = $tmpDir . '/' . uniqid('code_') . '.js';
                file_put_contents($f, $code);
                $tmpFiles[] = $f;
                $cmd = "cat " . escapeshellarg($inputFile)
                     . " | docker run $opts"
                     . " -v " . escapeshellarg($f) . ":/tmp/code.js:ro"
                     . " node:20 node /tmp/code.js 2>&1";
                break;

            default:
                throw new \Exception("Langage non supporté : $language");
        }

        return [$cmd, $tmpFiles];
    }

    private function buildJUnitCommand(string $code, string $testCode): array
    {
        $tmpDir   = '/tmp/executor';
        $tmpFiles = [];
        if (!is_dir($tmpDir)) mkdir($tmpDir, 0777, true);

        $mainFile = $tmpDir . '/' . uniqid('Main_') . '.java';
        $testFile = $tmpDir . '/' . uniqid('Test_') . '.java';
        file_put_contents($mainFile, $code);
        file_put_contents($testFile, $testCode);
        $tmpFiles[] = $mainFile;
        $tmpFiles[] = $testFile;

        $opts = '--rm --network none --memory="256m" --cpus="1"';

        // Image avec JUnit 5 + Maven
        $cmd = "docker run $opts"
             . " -v " . escapeshellarg($mainFile) . ":/workspace/src/Main.java:ro"
             . " -v " . escapeshellarg($testFile)  . ":/workspace/src/MainTest.java:ro"
             . " maven:3.9-eclipse-temurin-17 sh -c '"
             . "cd /workspace && "
             . "mkdir -p src/main/java src/test/java && "
             . "cp src/Main.java src/main/java/ && "
             . "cp src/MainTest.java src/test/java/ && "
             . "mvn -q test 2>&1 | tail -20"
             . "' 2>&1";

        return [$cmd, $tmpFiles];
    }
}
