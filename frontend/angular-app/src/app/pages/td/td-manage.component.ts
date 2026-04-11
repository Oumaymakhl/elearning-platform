import { ConfirmService } from '../../services/confirm.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-td-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">
        <div class="page-header">
          <a [routerLink]="['/courses', courseId, 'manage']" class="back">← Retour à la gestion</a>
          <h1>🔬 Gérer le TD — {{ subChapterTitle }}</h1>
        </div>

        <div class="loading" *ngIf="loading">Chargement...</div>

        <div *ngIf="!loading">

          <!-- Exercise Info -->
          <div class="card" *ngIf="!exercise">
            <h2>Créer l'exercice</h2>
            <form [formGroup]="exerciseForm" (ngSubmit)="createExercise()">
              <div class="field">
                <label>Titre de l'exercice *</label>
                <input type="text" formControlName="title" placeholder="Ex: Somme de deux nombres">
              </div>
              <div class="field">
                <label>Description</label>
                <textarea formControlName="description" rows="3" placeholder="Description de l'exercice..."></textarea>
              </div>
              <div class="field">
                <label>Langage</label>
                <select formControlName="language">
                  <option value="python">Python 3</option>
                  <option value="php">PHP 8</option>
                  <option value="node">JavaScript</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="java">Java</option>
                  <option value="go">Go</option>
                  <option value="ruby">Ruby</option>
                </select>
              </div>
              <button type="submit" [disabled]="exerciseForm.invalid || saving">
                {{ saving ? 'Création...' : '✅ Créer exercice' }}
              </button>
            </form>
          </div>

          <!-- Exercise exists -->
          <div *ngIf="exercise">
            <div class="card exercise-info">
              <div class="exercise-header">
                <div>
                  <h2>{{ exercise.title }}</h2>
                  <p>{{ exercise.description }}</p>
                  <span class="badge">{{ exercise.language }}</span>
                </div>
              </div>
            </div>

            <!-- Questions -->
            <div class="card">
              <div class="section-header">
                <h2>📝 Questions ({{ exercise.questions?.length || 0 }})</h2>
                <button class="btn-add" (click)="showQuestionForm = !showQuestionForm">
                  {{ showQuestionForm ? '✕ Annuler' : '+ Ajouter une question' }}
                </button>
              </div>

              <!-- Add Question Form -->
              <div class="question-form" *ngIf="showQuestionForm">
                <form [formGroup]="questionForm" (ngSubmit)="createQuestion()">
                  <div class="field">
                    <label>Titre *</label>
                    <input type="text" formControlName="title" placeholder="Ex: Calculer la somme">
                  </div>
                  <div class="field">
                    <label>Énoncé *</label>
                    <textarea formControlName="statement" rows="3" placeholder="Décrivez ce que l'étudiant doit faire..."></textarea>
                  </div>
                  <div class="field">
                    <label>Code template (optionnel)</label>
                    <textarea formControlName="template_code" rows="4" placeholder="def add(a, b):&#10;    __MARQUE__&#10;print(add(2, 3))"></textarea>
                    <small>Utilisez __MARQUE__ pour indiquer où l'étudiant écrit son code</small>
                  </div>
                  <div class="field">
                    <label>Points</label>
                    <input type="number" formControlName="points" min="1" max="100">
                  </div>
                  <button type="submit" [disabled]="questionForm.invalid || saving">
                    {{ saving ? 'Ajout...' : '✅ Ajouter la question' }}
                  </button>
                </form>
              </div>

              <!-- Questions List -->
              <div class="question-item" *ngFor="let q of exercise.questions; let qi = index">
                <div class="question-header">
                  <span class="q-num">Q{{ qi + 1 }}</span>
                  <span class="q-title">{{ q.title }}</span>
                  <span class="q-points">{{ q.points }} pts</span>
                  <button class="btn-delete" (click)="deleteQuestion(q.id)">🗑️</button>
                </div>
                <p class="q-stmt">{{ q.statement }}</p>
                <div *ngIf="q.template_code" class="code-preview">{{ q.template_code }}</div>

                <!-- Test Cases -->
                <div class="test-cases">
                  <div class="tc-header">
                    <span>🧪 Tests ({{ q.testCases?.length || 0 }})</span>
                    <button class="btn-add-sm" (click)="toggleTcForm(q.id)">+ Test</button>
                  </div>

                  <div class="tc-form" *ngIf="showTcForm[q.id]">
                    <div class="tc-inputs">
                      <input type="text" [(ngModel)]="newTc[q.id].input" placeholder="Entrée (optionnel)">
                      <input type="text" [(ngModel)]="newTc[q.id].expected_output" placeholder="Sortie attendue *">
                      <button (click)="createTestCase(q.id)">✅ Ajouter</button>
                    </div>
                  </div>

                  <div class="tc-list">
                    <div class="tc-item" *ngFor="let tc of q.testCases">
                      <span class="tc-io">
                        <span *ngIf="tc.input">Entrée: <code>{{ tc.input }}</code> → </span>
                        Attendu: <code>{{ tc.expected_output }}</code>
                      </span>
                      <button class="btn-delete-sm" (click)="deleteTestCase(q.id, tc.id)">✕</button>
                    </div>
                    <p class="no-tc" *ngIf="!q.testCases?.length">Aucun test case</p>
                  </div>
                </div>
              </div>

              <p class="no-questions" *ngIf="!exercise.questions?.length">
                Aucune question. Ajoutez-en une !
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    .main { margin-left:260px; flex:1; padding:2rem; background:#f8f9fa; }
    .page-header { margin-bottom:1.5rem; }
    .back { color:#1E3A5F; text-decoration:none; font-size:.85rem; display:block; margin-bottom:.5rem; }
    h1 { color:#1E3A5F; margin:0; font-size:1.3rem; }
    h2 { color:#1E3A5F; margin:0 0 1rem; font-size:1rem; }
    .loading { text-align:center; padding:3rem; color:#64748b; }
    .card { background:white; border-radius:12px; padding:1.5rem; margin-bottom:1.5rem; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .field { margin-bottom:1rem; }
    label { display:block; margin-bottom:.4rem; color:#555; font-size:.85rem; font-weight:500; }
    small { color:#94a3b8; font-size:.75rem; }
    input, textarea, select { width:100%; padding:.75rem; border:1px solid #ddd; border-radius:8px; font-size:.9rem; box-sizing:border-box; font-family:inherit; }
    textarea { resize:vertical; }
    button[type="submit"] { background:#1E3A5F; color:white; border:none; border-radius:8px; padding:.75rem 1.5rem; font-size:.9rem; cursor:pointer; }
    button[type="submit"]:disabled { opacity:.5; cursor:not-allowed; }
    .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
    .btn-add { background:#1E3A5F; color:white; border:none; border-radius:8px; padding:.5rem 1rem; font-size:.85rem; cursor:pointer; }
    .btn-add-sm { background:#e8f0fe; color:#1E3A5F; border:none; border-radius:6px; padding:.25rem .7rem; font-size:.75rem; cursor:pointer; font-weight:600; }
    .badge { background:#e8f0fe; color:#1E3A5F; padding:.25rem .7rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .exercise-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .exercise-header p { color:#64748b; font-size:.85rem; margin:.25rem 0 .5rem; }
    .question-form { background:#f8f9fa; border-radius:8px; padding:1rem; margin-bottom:1rem; }
    .question-item { border:1px solid #e2e8f0; border-radius:10px; padding:1rem; margin-bottom:1rem; }
    .question-header { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
    .q-num { background:#1E3A5F; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; flex-shrink:0; }
    .q-title { font-weight:600; color:#1a2340; flex:1; }
    .q-points { color:#64748b; font-size:.78rem; }
    .btn-delete { background:none; border:none; cursor:pointer; font-size:.9rem; }
    .btn-delete-sm { background:none; border:none; cursor:pointer; color:#94a3b8; font-size:.75rem; }
    .q-stmt { color:#64748b; font-size:.85rem; margin:.25rem 0 .75rem; }
    .code-preview { background:#1a2332; color:#e2e8f0; font-family:monospace; font-size:.78rem; padding:.75rem; border-radius:6px; white-space:pre-wrap; margin-bottom:.75rem; }
    .test-cases { background:#f8f9fa; border-radius:8px; padding:.75rem; }
    .tc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem; font-size:.82rem; font-weight:600; color:#374151; }
    .tc-form { margin-bottom:.5rem; }
    .tc-inputs { display:flex; gap:.5rem; }
    .tc-inputs input { padding:.4rem .7rem; font-size:.82rem; }
    .tc-inputs button { background:#22c55e; color:white; border:none; border-radius:6px; padding:.4rem .9rem; cursor:pointer; font-size:.82rem; white-space:nowrap; }
    .tc-item { display:flex; justify-content:space-between; align-items:center; padding:.3rem .5rem; background:white; border-radius:6px; margin-bottom:.3rem; font-size:.78rem; }
    .tc-io { color:#374151; }
    code { background:#e8f0fe; color:#1E3A5F; padding:.1rem .3rem; border-radius:3px; font-size:.78rem; }
    .no-tc { color:#94a3b8; font-size:.78rem; font-style:italic; margin:0; }
    .no-questions { color:#94a3b8; font-style:italic; text-align:center; padding:1rem; }
  `]
})
export class TdManageComponent implements OnInit {
  courseId!: number;
  subChapterId!: number;
  subChapterTitle = '';
  chapterId = 0;
  exercise: any = null;
  loading = true;
  saving = false;
  showQuestionForm = false;
  showTcForm: Record<number, boolean> = {};
  newTc: Record<number, any> = {};

  exerciseForm: FormGroup;
  questionForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private fb: FormBuilder,
    private http: HttpClient
  , private confirmSvc: ConfirmService) {
    this.exerciseForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      language: ['python'],
    });
    this.questionForm = this.fb.group({
      title: ['', Validators.required],
      statement: ['', Validators.required],
      template_code: [''],
      points: [100],
    });
  }

  ngOnInit() {
    this.courseId = +this.route.snapshot.paramMap.get('courseId')!;
    this.subChapterId = +this.route.snapshot.paramMap.get('subId')!;
    this.loadData();
  }

  getHeaders() {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadData() {
    this.loading = true;
    // Charger le sous-chapitre
    this.http.get<any>(`/api/courses/${this.courseId}/chapters`, { headers: this.getHeaders() })
      .subscribe({
        next: (chapters) => {
          for (const ch of chapters) {
            const subs = ch.sub_chapters || ch.subChapters || [];
            const sub = subs.find((s: any) => s.id === this.subChapterId);
            if (sub) {
              this.subChapterTitle = sub.title;
              this.chapterId = ch.id;
              if (sub.exercise_id) {
                this.loadExercise(sub.exercise_id);
              } else {
                this.loading = false;
              }
              break;
            }
          }
          if (!this.subChapterTitle) this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  loadExercise(id: number) {
    this.courseService.getExercise(id).subscribe({
      next: (ex) => { this.exercise = ex; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  createExercise() {
    if (this.exerciseForm.invalid) return;
    this.saving = true;
    const data = { ...this.exerciseForm.value, sub_chapter_id: this.subChapterId };
    this.courseService.createExercise(data).subscribe({
      next: (ex) => {
        // Lier l'exercice au sous-chapitre via SQL direct
        this.http.put(`/api/courses/${this.courseId}/chapters/${this.chapterId}/subchapters/${this.subChapterId}`,
          { exercise_id: ex.id, is_lab: true },
          { headers: this.getHeaders() }
        ).subscribe({ error: () => {} });
        this.exercise = ex;
        this.exercise.questions = [];
        this.saving = false;
      },
      error: () => { this.saving = false; }
    });
  }

  createQuestion() {
    if (this.questionForm.invalid || !this.exercise) return;
    this.saving = true;
    this.courseService.createQuestion(this.exercise.id, this.questionForm.value).subscribe({
      next: (q) => {
        q.testCases = [];
        this.exercise.questions.push(q);
        this.questionForm.reset({ points: 100 });
        this.showQuestionForm = false;
        this.saving = false;
      },
      error: () => { this.saving = false; }
    });
  }

  async deleteQuestion(questionId: number) {
    const ok = await this.confirmSvc.open({ icon: '🗑️', title: 'Supprimer cette question ?', message: 'Cette question et ses tests seront supprimés définitivement.', okLabel: 'Supprimer', okColor: '#e53e3e' });
    if (!ok) return;
    this.courseService.deleteQuestion(this.exercise.id, questionId).subscribe({
      next: () => {
        this.exercise.questions = this.exercise.questions.filter((q: any) => q.id !== questionId);
      }
    });
  }

  toggleTcForm(questionId: number) {
    this.showTcForm[questionId] = !this.showTcForm[questionId];
    if (!this.newTc[questionId]) this.newTc[questionId] = { input: '', expected_output: '' };
  }

  createTestCase(questionId: number) {
    const tc = this.newTc[questionId];
    if (!tc?.expected_output) return;
    this.courseService.createTestCase(this.exercise.id, questionId, tc).subscribe({
      next: (newTc) => {
        const q = this.exercise.questions.find((q: any) => q.id === questionId);
        if (q) { if (!q.testCases) q.testCases = []; q.testCases.push(newTc); }
        this.newTc[questionId] = { input: '', expected_output: '' };
        this.showTcForm[questionId] = false;
      }
    });
  }

  deleteTestCase(questionId: number, testCaseId: number) {
    this.courseService.deleteTestCase(this.exercise.id, questionId, testCaseId).subscribe({
      next: () => {
        const q = this.exercise.questions.find((q: any) => q.id === questionId);
        if (q) q.testCases = q.testCases.filter((tc: any) => tc.id !== testCaseId);
      }
    });
  }
}
