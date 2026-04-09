import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

interface Exercise {
  id: number; title: string; description: string;
  language: string; starter_code: string; expected_output?: string;
  questions?: any[];
}

@Component({
  selector: 'app-exercise',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  styles: [`
    :host { display:block; height:100vh; overflow:hidden; }
    .page { margin-left:260px; height:100vh; display:flex; flex-direction:column; background:#f4f6fb; overflow:hidden; }

    /* Header */
    .header { padding:.9rem 1.5rem; background:#fff; border-bottom:1px solid #e8ecf3; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,.04); }
    .header-left { display:flex; align-items:center; gap:.75rem; }
    .back-btn { background:none; border:1px solid #e8ecf3; color:#5a6a85; padding:.4rem .8rem; border-radius:8px; cursor:pointer; font-size:.85rem; }
    .back-btn:hover { background:#f0f4ff; color:#4361ee; }
    .ex-title { font-weight:700; color:#1a2340; font-size:1rem; }
    .lang-badge { background:#eef1fd; color:#4361ee; padding:.25rem .7rem; border-radius:20px; font-size:.78rem; font-weight:600; text-transform:uppercase; }

    /* Body */
    .body { flex:1; display:flex; overflow:hidden; }

    /* Enoncé */
    .enonce-panel { width:360px; flex-shrink:0; background:#fff; border-right:1px solid #e8ecf3; display:flex; flex-direction:column; overflow:hidden; }
    .panel-header { padding:.8rem 1.2rem; border-bottom:1px solid #e8ecf3; font-weight:600; color:#1a2340; font-size:.9rem; }
    .panel-body { flex:1; overflow-y:auto; padding:1.2rem; }
    .ex-description { color:#4a5568; font-size:.88rem; line-height:1.7; white-space:pre-wrap; }
    .ex-hint { margin-top:1rem; padding:.75rem 1rem; background:#f0f4ff; border-left:3px solid #4361ee; border-radius:0 8px 8px 0; font-size:.82rem; color:#3451d1; }
    .question-title { font-weight:700; color:#1a2340; font-size:.95rem; margin-bottom:.5rem; }
    .question-stmt { color:#4a5568; font-size:.85rem; line-height:1.6; }

    /* Editor */
    .editor-panel { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
    .editor-header { padding:.6rem 1rem; background:#1e2a3a; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
    .editor-tabs { display:flex; gap:.3rem; }
    .tab { padding:.3rem .8rem; border-radius:6px; font-size:.82rem; color:#8a9bbf; }
    .tab.active { background:#2d3f55; color:#fff; }
    .editor-actions { display:flex; gap:.5rem; align-items:center; }
    .lang-select { background:#2d3f55; color:#e2e8f0; border:none; border-radius:6px; padding:.3rem .6rem; font-size:.82rem; cursor:pointer; }
    .run-btn { background:#22c55e; color:#fff; border:none; border-radius:8px; padding:.4rem 1.2rem; cursor:pointer; font-size:.85rem; font-weight:600; display:flex; align-items:center; gap:.4rem; transition:.2s; }
    .run-btn:hover { background:#16a34a; }
    .run-btn:disabled { opacity:.5; cursor:not-allowed; }
    .reset-btn { background:#2d3f55; color:#8a9bbf; border:none; border-radius:8px; padding:.4rem .7rem; cursor:pointer; }
    .reset-btn:hover { color:#fff; }

    /* Code */
    .code-wrap { flex:1; overflow:hidden; position:relative; }
    .line-numbers { position:absolute; left:0; top:0; bottom:0; width:45px; background:#151f2e; color:#4a5568; font-family:monospace; font-size:.85rem; line-height:1.6; padding:.8rem 0; text-align:right; padding-right:10px; user-select:none; overflow:hidden; }
    textarea.code-editor { position:absolute; left:45px; right:0; top:0; bottom:0; background:#1a2332; color:#e2e8f0; font-family:"Fira Code",monospace; font-size:.88rem; line-height:1.6; padding:.8rem .8rem .8rem .5rem; border:none; outline:none; resize:none; tab-size:4; }

    /* Output */
    .output-panel { height:160px; flex-shrink:0; background:#0f1923; border-top:2px solid #2d3f55; display:flex; flex-direction:column; }
    .output-header { padding:.4rem 1rem; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #1e2a3a; }
    .output-title { color:#8a9bbf; font-size:.8rem; font-weight:600; display:flex; align-items:center; gap:.4rem; }
    .status-dot { width:8px; height:8px; border-radius:50%; background:#666; }
    .status-dot.success { background:#22c55e; }
    .status-dot.error { background:#ef4444; }
    .status-dot.running { background:#f59e0b; animation:pulse 1s infinite; }
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .clear-btn { background:none; border:none; color:#4a5568; font-size:.75rem; cursor:pointer; }
    .output-body { flex:1; overflow-y:auto; padding:.6rem 1rem; font-family:monospace; font-size:.83rem; line-height:1.5; white-space:pre-wrap; color:#8a9bbf; }
    .output-body.error { color:#fca5a5; }

    /* Tests */
    .tests-row { display:flex; gap:.5rem; padding:.5rem 1rem; flex-wrap:wrap; }
    .test-pill { padding:.2rem .6rem; border-radius:12px; font-size:.72rem; font-weight:600; }
    .test-pill.ok { background:rgba(34,197,94,.15); color:#86efac; }
    .test-pill.fail { background:rgba(239,68,68,.15); color:#fca5a5; }

    /* SUCCESS OVERLAY */
    .success-overlay { position:absolute; inset:0; background:rgba(15,25,35,.92); display:flex; align-items:center; justify-content:center; z-index:50; animation:fadeIn .3s ease; }
    @keyframes fadeIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
    .success-card { background:#fff; border-radius:16px; padding:2.5rem 2rem; text-align:center; max-width:420px; width:90%; }
    .success-emoji { font-size:3.5rem; margin-bottom:1rem; }
    .success-title { color:#1a2340; font-size:1.4rem; font-weight:800; margin:0 0 .5rem; }
    .success-subtitle { color:#64748b; font-size:.9rem; margin:0 0 1.5rem; }
    .success-score { display:inline-flex; align-items:center; gap:.5rem; background:#f0fdf4; color:#166534; padding:.5rem 1.2rem; border-radius:20px; font-weight:700; font-size:.9rem; margin-bottom:1.5rem; }
    .success-actions { display:flex; flex-direction:column; gap:.75rem; }
    .btn-next { background:#1E3A5F; color:white; border:none; border-radius:10px; padding:.85rem 1.5rem; font-size:1rem; font-weight:700; cursor:pointer; transition:.2s; }
    .btn-next:hover { background:#0f2544; }
    .btn-course { background:#f1f5f9; color:#1E3A5F; border:none; border-radius:10px; padding:.75rem 1.5rem; font-size:.9rem; font-weight:600; cursor:pointer; transition:.2s; }
    .btn-course:hover { background:#e2e8f0; }

    /* FAIL BANNER */
    .fail-banner { background:rgba(239,68,68,.1); border-top:2px solid rgba(239,68,68,.3); padding:.6rem 1rem; display:flex; align-items:center; justify-content:space-between; }
    .fail-text { color:#fca5a5; font-size:.82rem; font-weight:600; }
    .fail-hint { color:#6b7280; font-size:.75rem; }
  `],
  template: `
    <app-sidebar></app-sidebar>
    <div class="page">

      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button class="back-btn" (click)="goBackToCourse()">← Retour</button>
          <span class="ex-title">🔬 {{ exercise?.title || "TD" }}</span>
        </div>
        <span class="lang-badge">{{ selectedLang }}</span>
      </div>

      <div class="body" style="position:relative">

        <!-- Énoncé -->
        <div class="enonce-panel">
          <div class="panel-header">📋 Énoncé</div>
          <div class="panel-body">
            <div *ngIf="exercise">
              <p class="ex-description">{{ exercise.description }}</p>
              <div *ngIf="currentQuestion" style="margin-top:1.2rem">
                <div class="question-title">{{ currentQuestion.title }}</div>
                <p class="question-stmt">{{ currentQuestion.statement }}</p>
              </div>
              <div class="ex-hint" *ngIf="exercise.language === 'python'">
                💡 Écrivez uniquement le corps de la fonction. Pas besoin de <code>print()</code>.
              </div>
            </div>
            <div *ngIf="!exercise && !loading" class="ex-description">
              Écrivez votre solution ci-contre.
            </div>
          </div>
        </div>

        <!-- Éditeur -->
        <div class="editor-panel">
          <div class="editor-header">
            <div class="editor-tabs">
              <span class="tab active">{{ getFileName() }}</span>
            </div>
            <div class="editor-actions">
              <select class="lang-select" [(ngModel)]="selectedLang" (change)="onLangChange()">
                <option value="python">Python 3</option>
                <option value="php">PHP 8</option>
                <option value="node">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="bash">Bash</option>
                <option value="c">C</option>
                <option value="perl">Perl</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="ruby">Ruby</option>
              </select>
              <button class="reset-btn" (click)="resetCode()" title="Réinitialiser">↺</button>
              <button class="run-btn" (click)="runCode()" [disabled]="running || alreadyPassed">
                {{ running ? "⏳ Vérification..." : alreadyPassed ? "✅ Réussi" : "▶ Soumettre" }}
              </button>
            </div>
          </div>

          <div class="code-wrap">
            <div class="line-numbers">
              <div *ngFor="let n of lineNumbers">{{ n }}</div>
            </div>
            <textarea class="code-editor" [(ngModel)]="code"
              (input)="updateLineNumbers()"
              (keydown)="onTab($event)"
              spellcheck="false"></textarea>
          </div>

          <!-- Output -->
          <div class="output-panel">
            <div class="output-header">
              <div class="output-title">
                <span class="status-dot"
                  [class.success]="lastSuccess === true"
                  [class.error]="lastSuccess === false"
                  [class.running]="running"></span>
                Console
              </div>
              <button class="clear-btn" (click)="output=''; lastSuccess=null; submitResult=null">Effacer</button>
            </div>
            <div class="output-body" [class.error]="lastSuccess === false">
              <span *ngIf="!output && !running" style="font-style:italic">Cliquez sur "Soumettre" pour vérifier votre code...</span>
              <span *ngIf="running">⏳ Vérification en cours...</span>
              <span *ngIf="output && !submitResult">{{ output }}</span>
              <div *ngIf="submitResult && !submitResult.passed">
                <div *ngFor="let r of submitResult.results">
                  <span style="color:#fca5a5">❌ Test {{ r.test_case_id }}</span> — Sortie: {{ r.output }} | Attendu: {{ r.expected }}
                </div>
              </div>
            </div>
          </div>

          <!-- Fail banner -->
          <div class="fail-banner" *ngIf="submitResult && !submitResult.passed">
            <span class="fail-text">❌ {{ submitResult.tests_passed }}/{{ submitResult.tests_total }} tests passés</span>
            <span class="fail-hint">Réessayez !</span>
          </div>
        </div>

        <!-- SUCCESS OVERLAY -->
        <div class="success-overlay" *ngIf="showSuccess">
          <div class="success-card">
            <div class="success-emoji">🎉</div>
            <h2 class="success-title">Bravo !</h2>
            <p class="success-subtitle">Tu as réussi ce TD avec succès !</p>
            <div class="success-score">
              ⭐ Score : {{ submitResult?.score }}/{{ submitResult?.max_score || 100 }} pts
            </div>
            <div class="success-actions">
              <button class="btn-next" (click)="goToNext()">
                → Sous-chapitre suivant
              </button>
              <button class="btn-course" (click)="goBackToCourse()">
                ← Retour au cours
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ExerciseComponent implements OnInit {
  exercise: Exercise | null = null;
  loading = false;
  code = "";
  selectedLang = "python";
  output = "";
  running = false;
  lastSuccess: boolean | null = null;
  execTime: number | null = null;
  lineNumbers: number[] = [1];
  exerciseId: number | null = null;
  questionId: number | null = null;
  submitResult: any = null;
  showSuccess = false;
  alreadyPassed = false;
  currentQuestion: any = null;
  courseId: number | null = null;
  subIndex: number | null = null;

  starterCodes: Record<string, string> = {
    python: '# Écrivez votre solution ici\n',
    php:    '// Écrivez votre solution ici\n',
    node:   '// Écrivez votre solution ici\n',
    cpp:    '#include <iostream>\nusing namespace std;\nint main() {\n    // Votre code\n    return 0;\n}',
    bash:   '#!/bin/bash\n# Votre code\n',
    c:      '#include <stdio.h>\nint main() {\n    // Votre code\n    return 0;\n}',
    perl:   '# Votre code\n',
    java:   'public class Main {\n    public static void main(String[] args) {\n        // Votre code\n    }\n}',
    go:     'package main\nimport "fmt"\nfunc main() {\n    // Votre code\n}',
    ruby:   '# Votre code\n',
  };

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.code = this.starterCodes[this.selectedLang];
    this.updateLineNumbers();
    const id = this.route.snapshot.paramMap.get("id");
    const qp = this.route.snapshot.queryParamMap;
    this.courseId = qp.get('course_id') ? +qp.get('course_id')! : null;
    this.subIndex = qp.get('sub_index') ? +qp.get('sub_index')! : null;
    if (id && id !== "new") this.loadExercise(parseInt(id));
  }

  getHeaders() {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadExercise(id: number) {
    this.loading = true;
    this.exerciseId = id;
    this.http.get<any>(`/api/exercises/${id}`, { headers: this.getHeaders() })
      .subscribe({
        next: (ex) => {
          this.exercise = ex;
          if (ex.language) this.selectedLang = ex.language;
          if (ex.questions && ex.questions.length > 0) {
            this.questionId = ex.questions[0].id;
            this.currentQuestion = ex.questions[0];
            // Utiliser le template_code comme starter si disponible
            // Ne pas afficher le template - juste un commentaire guide
          if (ex.questions[0].template_code) {
            this.code = '# Écrivez votre solution ici\n';
          } else {
            this.code = this.starterCodes[this.selectedLang] || "";
          }
          } else {
            this.code = this.starterCodes[this.selectedLang] || "";
          }
          this.updateLineNumbers();
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  onLangChange() {
    this.code = this.starterCodes[this.selectedLang] || "";
    this.output = "";
    this.lastSuccess = null;
    this.submitResult = null;
    this.updateLineNumbers();
  }

  resetCode() {
    if (this.currentQuestion?.template_code) {
      this.code = this.currentQuestion.template_code.replace('{{marque}}', '# Votre code ici\n    ');
    } else {
      this.code = this.starterCodes[this.selectedLang] || "";
    }
    this.output = "";
    this.lastSuccess = null;
    this.submitResult = null;
    this.showSuccess = false;
    this.updateLineNumbers();
  }

  runCode() {
    if (this.running) return;
    this.running = true;
    this.output = "";
    this.lastSuccess = null;
    this.submitResult = null;
    this.showSuccess = false;

    if (this.exerciseId && this.questionId) {
      // Si template_code → envoyer directement le code de l'étudiant
      let codeToSubmit = this.code.replace('# Écrivez votre solution ici', '').trim();

      this.http.post<any>(
        `/api/exercises/${this.exerciseId}/questions/${this.questionId}/submit`,
        { code: codeToSubmit },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res) => {
          this.submitResult = res;
          this.lastSuccess = res.passed;
          this.running = false;
          if (res.passed) {
            this.showSuccess = true;
            this.alreadyPassed = true;
          } else {
            this.output = '';
          }
        },
        error: () => {
          this.output = "Erreur lors de la soumission.";
          this.lastSuccess = false;
          this.running = false;
        }
      });
    } else {
      this.http.post<any>("/api/execute",
        { language: this.selectedLang, code: this.code },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res) => {
          this.output = res.output || "(aucune sortie)";
          this.lastSuccess = res.success;
          this.running = false;
        },
        error: () => {
          this.output = "Erreur de connexion au serveur.";
          this.lastSuccess = false;
          this.running = false;
        }
      });
    }
  }

  goToNext() {
    if (this.courseId !== null && this.subIndex !== null) {
      this.router.navigate(['/courses', this.courseId], {
        queryParams: { openSub: this.subIndex + 1 }
      });
    } else if (this.courseId) {
      this.router.navigate(['/courses', this.courseId]);
    } else {
      this.router.navigate(['/courses']);
    }
  }

  goBackToCourse() {
    if (this.courseId) {
      this.router.navigate(['/courses', this.courseId]);
    } else {
      this.router.navigate(['/courses']);
    }
  }

  getFileName() {
    const ext: Record<string, string> = {
      python: "main.py", php: "main.php", node: "main.js",
      cpp: "main.cpp", bash: "main.sh", c: "main.c",
      perl: "main.pl", java: "Main.java", go: "main.go", ruby: "main.rb"
    };
    return ext[this.selectedLang] || "main.txt";
  }

  updateLineNumbers() {
    const lines = (this.code || "").split("\n").length;
    this.lineNumbers = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1);
  }

  onTab(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.target as HTMLTextAreaElement;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    this.code = this.code.substring(0, start) + "    " + this.code.substring(end);
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4; });
  }
}
