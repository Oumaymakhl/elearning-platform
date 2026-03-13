import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

interface Exercise {
  id: number; title: string; description: string;
  language: string; starter_code: string; expected_output?: string;
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
    .body { flex:1; display:flex; overflow:hidden; gap:0; }

    /* Panel gauche - Énoncé */
    .enonce-panel { width:380px; flex-shrink:0; background:#fff; border-right:1px solid #e8ecf3; display:flex; flex-direction:column; overflow:hidden; }
    .panel-header { padding:.8rem 1.2rem; border-bottom:1px solid #e8ecf3; font-weight:600; color:#1a2340; font-size:.9rem; display:flex; align-items:center; gap:.5rem; }
    .panel-body { flex:1; overflow-y:auto; padding:1.2rem; }
    .description { color:#4a5568; font-size:.88rem; line-height:1.7; white-space:pre-wrap; }
    .expected-section { margin-top:1.2rem; padding:1rem; background:#f8fffe; border:1px solid #c6f0e8; border-radius:10px; }
    .expected-title { font-weight:600; color:#2d8a6e; font-size:.82rem; margin-bottom:.5rem; }
    .expected-code { font-family:monospace; font-size:.82rem; color:#2d8a6e; white-space:pre-wrap; }

    /* Panel droite - Éditeur */
    .editor-panel { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
    .editor-header { padding:.6rem 1rem; background:#1e2a3a; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
    .editor-tabs { display:flex; gap:.3rem; }
    .tab { padding:.3rem .8rem; border-radius:6px; font-size:.82rem; color:#8a9bbf; cursor:pointer; }
    .tab.active { background:#2d3f55; color:#fff; }
    .editor-actions { display:flex; gap:.5rem; align-items:center; }
    .lang-select { background:#2d3f55; color:#8a9bbf; border:none; border-radius:6px; padding:.3rem .6rem; font-size:.82rem; cursor:pointer; }
    .run-btn { background:#22c55e; color:#fff; border:none; border-radius:8px; padding:.4rem 1rem; cursor:pointer; font-size:.85rem; font-weight:600; display:flex; align-items:center; gap:.4rem; }
    .run-btn:hover { background:#16a34a; }
    .run-btn:disabled { opacity:.5; cursor:not-allowed; }
    .reset-btn { background:#2d3f55; color:#8a9bbf; border:none; border-radius:8px; padding:.4rem .7rem; cursor:pointer; font-size:.85rem; }
    .reset-btn:hover { color:#fff; }

    /* Zone code */
    .code-wrap { flex:1; overflow:hidden; position:relative; }
    .line-numbers { position:absolute; left:0; top:0; bottom:0; width:45px; background:#151f2e; color:#4a5568; font-family:monospace; font-size:.85rem; line-height:1.6; padding:.8rem 0; text-align:right; padding-right:10px; user-select:none; overflow:hidden; }
    textarea.code-editor { position:absolute; left:45px; right:0; top:0; bottom:0; background:#1a2332; color:#e2e8f0; font-family:"Fira Code",monospace; font-size:.88rem; line-height:1.6; padding:.8rem .8rem .8rem .5rem; border:none; outline:none; resize:none; tab-size:4; }
    textarea.code-editor::selection { background:#4361ee44; }

    /* Output */
    .output-panel { height:180px; flex-shrink:0; background:#0f1923; border-top:2px solid #2d3f55; display:flex; flex-direction:column; }
    .output-header { padding:.4rem 1rem; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #1e2a3a; }
    .output-title { color:#8a9bbf; font-size:.8rem; font-weight:600; display:flex; align-items:center; gap:.4rem; }
    .status-dot { width:8px; height:8px; border-radius:50%; background:#666; }
    .status-dot.success { background:#22c55e; }
    .status-dot.error { background:#ef4444; }
    .status-dot.running { background:#f59e0b; animation:pulse 1s infinite; }
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .clear-btn { background:none; border:none; color:#4a5568; font-size:.75rem; cursor:pointer; }
    .clear-btn:hover { color:#8a9bbf; }
    .output-body { flex:1; overflow-y:auto; padding:.6rem 1rem; font-family:monospace; font-size:.83rem; line-height:1.5; white-space:pre-wrap; }
    .output-body.success { color:#86efac; }
    .output-body.error { color:#fca5a5; }
    .output-body.empty { color:#4a5568; font-style:italic; }
    .exec-time { color:#4a5568; font-size:.75rem; margin-top:.3rem; }
  `],
  template: `
    <app-sidebar></app-sidebar>
    <div class="page">

      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button class="back-btn" routerLink="/courses">← Retour</button>
          <span class="ex-title">{{ exercise?.title || "Exercice de programmation" }}</span>
        </div>
        <span class="lang-badge">{{ selectedLang }}</span>
      </div>

      <!-- Body -->
      <div class="body">

        <!-- Énoncé -->
        <div class="enonce-panel">
          <div class="panel-header">📋 Énoncé</div>
          <div class="panel-body">
            <div class="description" *ngIf="exercise">{{ exercise.description }}</div>
            <div class="description" *ngIf="!exercise && !loading">
              Écrivez un programme qui affiche "Hello, World!" à l'écran.
            </div>
            <div class="expected-section" *ngIf="exercise && exercise.expected_output">
              <div class="expected-title">✅ Sortie attendue</div>
              <div class="expected-code">{{ exercise?.expected_output }}</div>
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
              </select>
              <button class="reset-btn" (click)="resetCode()" title="Réinitialiser">↺</button>
              <button class="run-btn" (click)="runCode()" [disabled]="running">
                <span>{{ running ? "⏳" : "▶" }}</span>
                {{ running ? "Exécution..." : "Exécuter" }}
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

          <div class="output-panel">
            <div class="output-header">
              <div class="output-title">
                <span class="status-dot" [class.success]="lastSuccess === true" [class.error]="lastSuccess === false" [class.running]="running"></span>
                Console de sortie
              </div>
              <button class="clear-btn" (click)="output = ''; lastSuccess = null">Effacer</button>
            </div>
            <div class="output-body" [class.success]="lastSuccess === true" [class.error]="lastSuccess === false" [class.empty]="!output && !running">
              <span *ngIf="!output && !running">Cliquez sur "Exécuter" pour voir la sortie...</span>
              <span *ngIf="running">Exécution en cours...</span>
              <span *ngIf="output">{{ output }}</span>
              <div class="exec-time" *ngIf="execTime">⏱ {{ execTime }}ms</div>
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

  starterCodes: Record<string, string> = {
    python: "# Écrivez votre code Python ici\nprint(\"Hello, World!\")",
    php: "// Écrivez votre code PHP ici\necho \"Hello, World!\";",
    node: "// Écrivez votre code JavaScript ici\nconsole.log(\"Hello, World!\")"
  };

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    this.code = this.starterCodes[this.selectedLang];
    this.updateLineNumbers();
    const id = this.route.snapshot.paramMap.get("id");
    if (id && id !== "new") this.loadExercise(parseInt(id));
  }

  getHeaders() {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadExercise(id: number) {
    this.loading = true;
    this.http.get<Exercise>(`http://localhost:8003/api/exercises/${id}`, { headers: this.getHeaders() })
      .subscribe({
        next: (ex) => {
          this.exercise = ex;
          if (ex.language) this.selectedLang = ex.language;
          if (ex.starter_code) this.code = ex.starter_code;
          else this.code = this.starterCodes[this.selectedLang];
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
    this.updateLineNumbers();
  }

  resetCode() {
    this.code = this.exercise?.starter_code || this.starterCodes[this.selectedLang];
    this.output = "";
    this.lastSuccess = null;
    this.updateLineNumbers();
  }

  runCode() {
    if (this.running) return;
    this.running = true;
    this.output = "";
    this.lastSuccess = null;
    this.execTime = null;
    const start = Date.now();
    this.http.post<any>("http://localhost:8004/api/execute",
      { language: this.selectedLang, code: this.code },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.output = res.output || "(aucune sortie)";
        this.lastSuccess = res.success;
        this.execTime = Date.now() - start;
        this.running = false;
      },
      error: () => {
        this.output = "Erreur de connexion au serveur d\'exécution.";
        this.lastSuccess = false;
        this.running = false;
      }
    });
  }

  getFileName() {
    const ext: Record<string, string> = { python: "main.py", php: "main.php", node: "main.js" };
    return ext[this.selectedLang] || "main.txt";
  }

  updateLineNumbers() {
    const lines = (this.code || "").split("\n").length;
    this.lineNumbers = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1);
  }

  onTab(e: KeyboardEvent) {
    e.preventDefault();
    const ta = e.target as HTMLTextAreaElement;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    this.code = this.code.substring(0, start) + "    " + this.code.substring(end);
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4; });
  }
}
