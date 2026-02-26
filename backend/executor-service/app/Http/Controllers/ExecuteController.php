<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class ExecuteController extends Controller
{
    public function run(Request $request)
    {
        $request->validate([
            'language' => 'required|in:php,python,node,java,cpp',
            'code' => 'required|string',
            'input' => 'nullable|string',
        ]);

        $language = $request->language;
        $code = $request->code;
        $input = $request->input ?? '';

        $dockerCmd = $this->buildDockerCommand($language, $code, $input);

        $process = Process::fromShellCommandline($dockerCmd);
        $process->setTimeout(30);

        try {
            $process->mustRun();
            $output = $process->getOutput();
        } catch (ProcessFailedException $e) {
            $output = $e->getProcess()->getErrorOutput();
        }

        $this->cleanTempFiles();

        return response()->json([
            'output' => $output,
            'language' => $language,
        ]);
    }

    private function buildDockerCommand($language, $code, $input)
    {
        $tmpDir = '/tmp/executor';
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0777, true);
        }
        $tmpFile = $tmpDir . '/' . uniqid('exec_', true) . '.' . $language;

        $escapedInput = addslashes($input);

        switch ($language) {
            case 'php':
                $escapedCode = addslashes($code);
                return "echo \"$escapedInput\" | sudo docker run --rm -i php:8.2-cli php -r \"$escapedCode\" 2>&1";
            case 'python':
                $escapedCode = addslashes($code);
                return "echo \"$escapedInput\" | sudo docker run --rm -i python:3 python -c \"$escapedCode\" 2>&1";
            case 'node':
                $escapedCode = addslashes($code);
                return "echo \"$escapedInput\" | sudo docker run --rm -i node:20 node -e \"$escapedCode\" 2>&1";
            case 'java':
                file_put_contents($tmpFile, "public class Main { public static void main(String[] args) { $code } }");
                chmod($tmpFile, 0644);
                $cmd = "echo \"$escapedInput\" | sudo docker run --rm -i -v $tmpFile:/tmp/Main.java openjdk:27-ea-trixie sh -c 'javac /tmp/Main.java && java -cp /tmp Main' 2>&1";
                register_shutdown_function(function() use ($tmpFile) { if (file_exists($tmpFile)) unlink($tmpFile); });
                return $cmd;
            case 'cpp':
                file_put_contents($tmpFile, "#include <iostream>\nusing namespace std;\nint main() { $code }");
                chmod($tmpFile, 0644);
                $cmd = "echo \"$escapedInput\" | sudo docker run --rm -i -v $tmpFile:/tmp/prog.cpp gcc:latest sh -c 'g++ /tmp/prog.cpp -o /tmp/prog && /tmp/prog' 2>&1";
                register_shutdown_function(function() use ($tmpFile) { if (file_exists($tmpFile)) unlink($tmpFile); });
                return $cmd;
            default:
                throw new \Exception("Langage non supporté");
        }
    }

    private function cleanTempFiles()
    {
        $files = glob('/tmp/executor/exec_*');
        $now = time();
        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file)) > 3600) {
                unlink($file);
            }
        }
    }
}
