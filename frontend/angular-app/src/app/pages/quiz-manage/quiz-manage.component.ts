import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-quiz-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">
        <div class="back-row">
          <a [routerLink]="['/courses', courseId, 'manage']">← Retour à la gestion du cours</a>
        </div>
        <div class="loading" *ngIf="loading">⏳ Chargement...</div>
        <ng-container *ngIf="!loading">
          <div class="page-header">
            <div>
              <h1>🧠 Gestion des Quiz</h1>
              <p class="sub">Cours : <strong>{{ courseName }}</strong> — Chapitre : <strong>{{ chapterName }}</strong></p>
            </div>
            <button class="btn-primary" (click)="showQuizForm = !showQuizForm">
              {{ showQuizForm ? 'Annuler' : '+ Nouveau quiz' }}
            </button>
          </div>
          <div class="card" *ngIf="showQuizForm">
            <h3>📝 Nouveau quiz</h3>
            <div class="field">
              <label>Titre *</label>
              <input type="text" [(ngModel)]="quizForm.title" placeholder="Ex: Quiz — Les variables">
            </div>
            <div class="field">
              <label>Description</label>
              <textarea [(ngModel)]="quizForm.description" rows="2" placeholder="Description du quiz"></textarea>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Score minimum pour valider (%)</label>
                <input type="number" [(ngModel)]="quizForm.passing_score" min="0" max="100" placeholder="70">
              </div>
              <div class="field">
                <label>Limite de temps (minutes, optionnel)</label>
                <input type="number" [(ngModel)]="quizForm.time_limit" min="1" placeholder="Ex: 15">
              </div>
            </div>
            <div class="form-actions">
              <button class="btn-save" (click)="createQuiz()" [disabled]="!quizForm.title || saving">
                {{ saving ? 'Création...' : '✅ Créer le quiz' }}
              </button>
              <button class="btn-cancel" (click)="showQuizForm = false">Annuler</button>
            </div>
          </div>
          <div class="empty-state" *ngIf="quizzes.length === 0 && !showQuizForm">
            <div class="empty-icon">🧠</div>
            <p>Aucun quiz pour ce chapitre.</p>
            <button class="btn-primary" (click)="showQuizForm = true">+ Créer le premier quiz</button>
          </div>
          <div class="quiz-card" *ngFor="let quiz of quizzes">
            <div class="quiz-header">
              <div class="quiz-info">
                <span class="quiz-title">🧠 {{ quiz.title }}</span>
                <span class="quiz-meta">
                  {{ quiz.questions?.length || 0 }} question(s)
                  &nbsp;•&nbsp; Score min : {{ quiz.passing_score || 70 }}%
                  <span *ngIf="quiz.time_limit">&nbsp;•&nbsp; ⏱ {{ quiz.time_limit }} min</span>
                </span>
              </div>
              <div class="quiz-actions">
                <button class="btn-toggle" (click)="toggleQuiz(quiz.id)">
                  {{ expandedQuiz === quiz.id ? '▲ Replier' : '▼ Gérer les questions' }}
                </button>
                <button class="btn-del" (click)="deleteQuiz(quiz.id)">🗑️</button>
              </div>
            </div>
            <div class="quiz-body" *ngIf="expandedQuiz === quiz.id">
              <div class="add-question-btn-row">
                <button class="btn-add-q" (click)="toggleQuestionForm(quiz.id)">
                  {{ showQuestionForm[quiz.id] ? '✕ Annuler' : '+ Ajouter une question' }}
                </button>
              </div>
              <div class="question-form" *ngIf="showQuestionForm[quiz.id]">
                <div class="field">
                  <label>Question *</label>
                  <textarea [(ngModel)]="questionForms[quiz.id].text" rows="2" placeholder="Ex: Quelle est la syntaxe pour..."></textarea>
                </div>
                <div class="field">
                  <label>Points</label>
                  <input type="number" [(ngModel)]="questionForms[quiz.id].points" min="1" placeholder="1">
                </div>
                <h4>Options de réponse</h4>
                <div class="options-list">
                  <div class="option-row" *ngFor="let opt of questionForms[quiz.id].options; let i = index">
                    <input type="radio" name="correct-{{quiz.id}}" [checked]="opt.is_correct" (change)="setCorrect(quiz.id, i)" title="Marquer comme correct">
                    <input type="text" [(ngModel)]="opt.text" placeholder="Option {{ i + 1 }}">
                    <button class="btn-remove-opt" (click)="removeOption(quiz.id, i)" *ngIf="questionForms[quiz.id].options.length > 2">✕</button>
                  </div>
                </div>
                <div class="option-actions">
                  <button class="btn-add-opt" (click)="addOption(quiz.id)">+ Option</button>
                  <span class="hint">Sélectionne le bouton radio de la bonne réponse</span>
                </div>
                <div class="form-actions" style="margin-top:.75rem">
                  <button class="btn-save" (click)="addQuestion(quiz)" [disabled]="!questionForms[quiz.id].text || saving">
                    {{ saving ? 'Ajout...' : '✅ Ajouter la question' }}
                  </button>
                </div>
              </div>
              <div class="no-questions" *ngIf="!quiz.questions?.length">Aucune question — ajoutez-en une !</div>
              <div class="question-item" *ngFor="let q of quiz.questions; let qi = index">
                <div class="question-header">
                  <span class="q-num">Q{{ qi + 1 }}</span>
                  <span class="q-text">{{ q.text }}</span>
                  <span class="q-pts">{{ q.points || 1 }} pt(s)</span>
                  <button class="btn-del-sm" (click)="deleteQuestion(quiz, q.id)">🗑️</button>
                </div>
                <div class="options-display">
                  <div class="opt-item" *ngFor="let opt of q.options" [class.correct]="opt.is_correct">
                    <span class="opt-icon">{{ opt.is_correct ? '✅' : '○' }}</span>
                    <span>{{ opt.text }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#f4f6fb}
    .main{margin-left:260px;flex:1;padding:2rem}
    .back-row a{color:#4361ee;font-size:.85rem;text-decoration:none}
    .back-row a:hover{text-decoration:underline}
    .back-row{margin-bottom:1.25rem}
    .loading{text-align:center;padding:3rem;color:#8a9bbf}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem}
    .page-header h1{font-size:1.4rem;font-weight:800;color:#1a2340;margin:0 0 .25rem}
    .page-header .sub{font-size:.85rem;color:#8a9bbf;margin:0}
    .btn-primary{background:#4361ee;color:#fff;border:none;border-radius:8px;padding:.55rem 1.2rem;cursor:pointer;font-size:.85rem;font-weight:600}
    .btn-primary:hover{background:#3451d1}
    .btn-save{background:#22c55e;color:#fff;border:none;border-radius:8px;padding:.45rem 1rem;cursor:pointer;font-size:.83rem;font-weight:600}
    .btn-save:disabled{opacity:.5;cursor:not-allowed}
    .btn-cancel{background:#f0f4ff;color:#4361ee;border:1px solid #d5dcf9;border-radius:8px;padding:.45rem 1rem;cursor:pointer;font-size:.83rem}
    .btn-del{background:#fee2e2;color:#dc2626;border:none;border-radius:6px;padding:.35rem .65rem;cursor:pointer;font-size:.82rem}
    .btn-del:hover{background:#dc2626;color:#fff}
    .btn-del-sm{background:#fee2e2;color:#dc2626;border:none;border-radius:5px;padding:.2rem .45rem;cursor:pointer;font-size:.75rem}
    .btn-del-sm:hover{background:#dc2626;color:#fff}
    .btn-toggle{background:#f0f4ff;color:#4361ee;border:1px solid #d5dcf9;border-radius:6px;padding:.35rem .75rem;cursor:pointer;font-size:.8rem;font-weight:600}
    .btn-toggle:hover{background:#4361ee;color:#fff}
    .btn-add-q{background:#1a2340;color:#fff;border:none;border-radius:7px;padding:.38rem .9rem;cursor:pointer;font-size:.8rem;font-weight:600}
    .btn-add-q:hover{background:#0f2544}
    .btn-add-opt{background:#f0f4ff;color:#4361ee;border:1px solid #d5dcf9;border-radius:6px;padding:.28rem .7rem;cursor:pointer;font-size:.78rem}
    .card{background:#fff;border-radius:12px;padding:1.4rem;margin-bottom:1.25rem;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e8ecf3}
    .card h3{font-size:1rem;font-weight:700;color:#1a2340;margin:0 0 1rem}
    .field{margin-bottom:.85rem}
    .field label{display:block;font-size:.8rem;font-weight:600;color:#5a6a85;margin-bottom:.3rem}
    .field input,.field textarea{width:100%;padding:.45rem .75rem;border:1px solid #d5dcf9;border-radius:8px;font-size:.85rem;font-family:inherit;outline:none}
    .field input:focus,.field textarea:focus{border-color:#4361ee}
    .field-row{display:flex;gap:1rem}
    .field-row .field{flex:1}
    .form-actions{display:flex;gap:.6rem}
    .empty-state{text-align:center;padding:3rem;background:#fff;border-radius:12px;border:2px dashed #e8ecf3}
    .empty-icon{font-size:2.5rem;margin-bottom:.75rem}
    .empty-state p{color:#8a9bbf;margin-bottom:1rem}
    .quiz-card{background:#fff;border-radius:12px;margin-bottom:1rem;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e8ecf3;overflow:hidden}
    .quiz-header{display:flex;justify-content:space-between;align-items:center;padding:.9rem 1.2rem;background:#f8fafc;flex-wrap:wrap;gap:.5rem}
    .quiz-info{display:flex;flex-direction:column;gap:.2rem}
    .quiz-title{font-weight:700;color:#1a2340;font-size:.92rem}
    .quiz-meta{font-size:.75rem;color:#8a9bbf}
    .quiz-actions{display:flex;gap:.5rem;align-items:center}
    .quiz-body{padding:1.2rem;border-top:1px solid #e8ecf3}
    .add-question-btn-row{margin-bottom:.85rem}
    .question-form{background:#f8fafc;border:1px solid #e8ecf3;border-radius:10px;padding:1rem;margin-bottom:1rem}
    .question-form h4{font-size:.82rem;font-weight:700;color:#1a2340;margin:.75rem 0 .5rem}
    .options-list{display:flex;flex-direction:column;gap:.45rem;margin-bottom:.5rem}
    .option-row{display:flex;align-items:center;gap:.5rem}
    .option-row input[type=radio]{flex-shrink:0;accent-color:#4361ee;width:16px;height:16px;cursor:pointer}
    .option-row input[type=text]{flex:1;padding:.38rem .65rem;border:1px solid #d5dcf9;border-radius:6px;font-size:.83rem;font-family:inherit}
    .option-row input[type=text]:focus{outline:none;border-color:#4361ee}
    .btn-remove-opt{background:none;border:none;color:#dc2626;cursor:pointer;font-size:.85rem;padding:0 .25rem}
    .option-actions{display:flex;align-items:center;gap:1rem;margin-top:.35rem}
    .hint{font-size:.73rem;color:#8a9bbf;font-style:italic}
    .no-questions{color:#8a9bbf;font-size:.83rem;font-style:italic;padding:.5rem 0 1rem}
    .question-item{border:1px solid #e8ecf3;border-radius:9px;margin-bottom:.75rem;overflow:hidden}
    .question-header{display:flex;align-items:center;gap:.65rem;padding:.65rem .9rem;background:#f8fafc;flex-wrap:wrap}
    .q-num{background:#4361ee;color:#fff;border-radius:5px;padding:.1rem .4rem;font-size:.72rem;font-weight:700;flex-shrink:0}
    .q-text{flex:1;font-size:.85rem;font-weight:600;color:#1a2340}
    .q-pts{font-size:.75rem;color:#8a9bbf;flex-shrink:0}
    .options-display{padding:.55rem .9rem .7rem;display:flex;flex-direction:column;gap:.3rem}
    .opt-item{display:flex;align-items:center;gap:.5rem;font-size:.82rem;color:#5a6a85;padding:.28rem .5rem;border-radius:5px}
    .opt-item.correct{background:#dcfce7;color:#16a34a;font-weight:600}
    .opt-icon{font-size:.8rem;flex-shrink:0}
  `]
})
export class QuizManageComponent implements OnInit {
  courseId = 0;
  chapterId = 0;
  courseName = '';
  chapterName = '';
  quizzes: any[] = [];
  loading = true;
  saving = false;
  showQuizForm = false;
  expandedQuiz: number | null = null;
  showQuestionForm: Record<number, boolean> = {};
  questionForms: Record<number, any> = {};
  quizForm = { title: '', description: '', passing_score: 70, time_limit: null as number | null };
  private readonly QUIZ_API = '/api/quizzes';
  private readonly COURSE_API = '/api';

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    this.courseId  = +this.route.snapshot.paramMap.get('courseId')!;
    this.chapterId = +this.route.snapshot.paramMap.get('chapterId')!;
    this.loadCourseInfo();
    this.loadQuizzes();
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadCourseInfo(): void {
    this.http.get<any>(`${this.COURSE_API}/courses/${this.courseId}`).subscribe({
      next: (course) => {
        this.courseName = course.title;
        const ch = (course.chapters || []).find((c: any) => c.id === this.chapterId);
        this.chapterName = ch?.title ?? 'Chapitre ' + this.chapterId;
      }, error: () => {}
    });
  }

  loadQuizzes(): void {
    this.loading = true;
    this.http.get<any[]>(`${this.QUIZ_API}/chapters/${this.chapterId}/quizzes`).subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes;
        quizzes.forEach(q => this.loadQuestions(q));
        this.loading = false;
      }, error: () => { this.loading = false; }
    });
  }

  loadQuestions(quiz: any): void {
    this.http.get<any[]>(`${this.QUIZ_API}/quizzes/${quiz.id}/questions`).subscribe({
      next: (questions) => { quiz.questions = questions; questions.forEach(q => this.loadOptions(quiz.id, q)); },
      error: () => { quiz.questions = []; }
    });
  }

  loadOptions(quizId: number, question: any): void {
    this.http.get<any[]>(`${this.QUIZ_API}/quizzes/${quizId}/questions/${question.id}/options`).subscribe({
      next: (options) => { question.options = options; }, error: () => { question.options = []; }
    });
  }

  createQuiz(): void {
    if (!this.quizForm.title || this.saving) return;
    this.saving = true;
    this.http.post<any>(`${this.QUIZ_API}/quizzes`, { ...this.quizForm, chapter_id: this.chapterId }, { headers: this.headers() }).subscribe({
      next: (quiz) => {
        quiz.questions = [];
        this.quizzes.push(quiz);
        this.quizForm = { title: '', description: '', passing_score: 70, time_limit: null };
        this.showQuizForm = false;
        this.saving = false;
        this.expandedQuiz = quiz.id;
        this.initQuestionForm(quiz.id);
      }, error: () => { this.saving = false; }
    });
  }

  deleteQuiz(quizId: number): void {
    if (!confirm('Supprimer ce quiz et toutes ses questions ?')) return;
    this.http.delete(`${this.QUIZ_API}/quizzes/${quizId}`, { headers: this.headers() }).subscribe({
      next: () => { this.quizzes = this.quizzes.filter(q => q.id !== quizId); },
      error: (e) => { alert(e.error?.message || 'Erreur suppression'); }
    });
  }

  toggleQuiz(quizId: number): void {
    this.expandedQuiz = this.expandedQuiz === quizId ? null : quizId;
    if (this.expandedQuiz && !this.questionForms[quizId]) this.initQuestionForm(quizId);
  }

  initQuestionForm(quizId: number): void {
    this.questionForms[quizId] = {
      text: '', points: 1,
      options: [
        { text: '', is_correct: true }, { text: '', is_correct: false },
        { text: '', is_correct: false }, { text: '', is_correct: false },
      ]
    };
    this.showQuestionForm[quizId] = false;
  }

  toggleQuestionForm(quizId: number): void {
    if (!this.questionForms[quizId]) this.initQuestionForm(quizId);
    this.showQuestionForm[quizId] = !this.showQuestionForm[quizId];
  }

  setCorrect(quizId: number, index: number): void {
    this.questionForms[quizId].options.forEach((o: any, i: number) => { o.is_correct = i === index; });
  }

  addOption(quizId: number): void { this.questionForms[quizId].options.push({ text: '', is_correct: false }); }

  removeOption(quizId: number, index: number): void {
    const opts = this.questionForms[quizId].options;
    const wasCorrect = opts[index].is_correct;
    opts.splice(index, 1);
    if (wasCorrect && opts.length > 0) opts[0].is_correct = true;
  }

  addQuestion(quiz: any): void {
    const form = this.questionForms[quiz.id];
    if (!form?.text || this.saving) return;
    this.saving = true;
    this.http.post<any>(`${this.QUIZ_API}/quizzes/${quiz.id}/questions`, { text: form.text, points: form.points || 1 }, { headers: this.headers() }).subscribe({
      next: (question) => {
        question.options = [];
        if (!quiz.questions) quiz.questions = [];
        quiz.questions.push(question);
        const validOptions = form.options.filter((o: any) => o.text.trim());
        let done = 0;
        validOptions.forEach((opt: any) => {
          this.http.post<any>(`${this.QUIZ_API}/quizzes/${quiz.id}/questions/${question.id}/options`, { text: opt.text, is_correct: opt.is_correct }, { headers: this.headers() }).subscribe({
            next: (o) => { question.options.push(o); done++; if (done === validOptions.length) { this.saving = false; this.initQuestionForm(quiz.id); this.showQuestionForm[quiz.id] = false; } },
            error: () => { done++; if (done === validOptions.length) this.saving = false; }
          });
        });
        if (validOptions.length === 0) { this.saving = false; this.initQuestionForm(quiz.id); this.showQuestionForm[quiz.id] = false; }
      }, error: () => { this.saving = false; }
    });
  }

  deleteQuestion(quiz: any, questionId: number): void {
    if (!confirm('Supprimer cette question ?')) return;
    this.http.delete(`${this.QUIZ_API}/quizzes/${quiz.id}/questions/${questionId}`, { headers: this.headers() }).subscribe({
      next: () => { quiz.questions = quiz.questions.filter((q: any) => q.id !== questionId); },
      error: (e) => { alert(e.error?.message || 'Erreur'); }
    });
  }
}
