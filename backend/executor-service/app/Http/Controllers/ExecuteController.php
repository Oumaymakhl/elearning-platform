<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class ExecuteController extends Controller
{
    private const TIMEOUT    = 10;
    private const MAX_OUTPUT = 50000;

    public function run(Request $request)
    {
        $request->validate([
            'language' => 'required|in:php,python,node,java,cpp',
            'code'     => 'required|string|max:10000',
            'input'    => 'nullable|string|max:1000',
        ]);

        $language = $request->language;
        $code     = $request->code;
        $input    = $request->input ?? '';

        try {
            [$cmd, $tmpFiles] = $this->buildDockerCommand($language, $code, $input);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        $process = Process::fromShellCommandline($cmd);
        $process->setTimeout(self::TIMEOUT);

        $output = '';
        try {
            $process->mustRun();
            $output = $process->getOutput();
        } catch (ProcessFailedException $e) {
            $output = $e->getProcess()->getErrorOutput()
                   ?: $e->getProcess()->getOutput();
        } catch (\Exception $e) {
            $output = 'Erreur : ' . $e->getMessage();
        } finally {
            foreach ($tmpFiles as $file) {
                if (file_exists($file)) unlink($file);
            }
        }

        if (strlen($output) > self::MAX_OUTPUT) {
            $output = substr($output, 0, self::MAX_OUTPUT) . "\n[Sortie tronquee]";
        }

        return response()->json([
            'output'   => $output,
            'language' => $language,
        ]);
    }

    private function buildDockerCommand(string $language, string $code, string $input): array
    {
        $tmpDir   = '/tmp/executor';
        $tmpFiles = [];

        if (!is_dir($tmpDir)) mkdir($tmpDir, 0700, true);

        $opts = '--rm --network none --memory="64m" --cpus="0.5"';

        $inputFile = $tmpDir . '/' . uniqid('input_', true) . '.txt';
        file_put_contents($inputFile, $input);
        chmod($inputFile, 0600);
        $tmpFiles[] = $inputFile;

        switch ($language) {
            case 'php':
                $f = $tmpDir . '/' . uniqid('code_', true) . '.php';
                file_put_contents($f, '<?php ' . $code);
                chmod($f, 0600);
                $tmpFiles[] = $f;
                $cmd = "cat " . escapeshellarg($inputFile)
                     . " | sudo docker run $opts"
                     . " -v " . escapeshellarg($f) . ":/tmp/code.php:ro"
                     . " php:8.2-cli php /tmp/code.php 2>&1";
                break;

            case 'python':
                $f = $tmpDir . '/' . uniqid('code_', true) . '.py';
                file_put_contents($f, $code);
                chmod($f, 0600);
                $tmpFiles[] = $f;
                $cmd = "cat " . escapeshellarg($inputFile)
                     . " | sudo docker run $opts"
                     . " -v " . escapeshellarg($f) . ":/tmp/code.py:ro"
                     . " python:3 python /tmp/code.py 2>&1";
                break;

            case 'node':
                $f = $tmpDir . '/' . uniqid('code_', true) . '.js';
                file_put_contents($f, $code);
                chmod($f, 0600);
                $tmpFiles[] = $f;
                $cmd = "cat " . escapeshellarg($inputFile)
                     . " | sudo docker run $opts"
                     . " -v " . escapeshellarg($f) . ":/tmp/code.js:ro"
                     . " node:20 node /tmp/code.js 2>&1";
                break;

            case 'java':
                $f = $tmpDir . '/' . uniqid('Main_', true) . '.java';
                file_put_contents($f,
                    "public class Main {\n"
                    . "    public static void main(String[] args) {\n"
                    . "        " . $code . "\n"
                    . "    }\n}"
                );
                chmod($f, 0600);
                $tmpFiles[] = $f;
                $cmd = "cat " . escapeshellarg($inputFile)
                     . " | sudo docker run $opts"
                     . " -v " . escapeshellarg($f) . ":/tmp/Main.java:ro"
                     . " openjdk:27-ea-trixie sh -c"
                     . " 'cp /tmp/Main.java /home/Main.java && cd /home && javac Main.java && java Main' 2>&1";
                break;

            case 'cpp':
                $f = $tmpDir . '/' . uniqid('prog_', true) . '.cpp';
                file_put_contents($f,
                    "#include <iostream>\nusing namespace std;\nint main() {\n    "
                    . $code . "\n}"
                );
                chmod($f, 0600);
                $tmpFiles[] = $f;
                $cmd = "cat " . escapeshellarg($inputFile)
                     . " | sudo docker run $opts"
                     . " -v " . escapeshellarg($f) . ":/tmp/prog.cpp:ro"
                     . " gcc:latest sh -c 'g++ /tmp/prog.cpp -o /tmp/prog && /tmp/prog' 2>&1";
                break;

            default:
                throw new \Exception("Langage non supporte : $language");
        }

        return [$cmd, $tmpFiles];
    }
}
