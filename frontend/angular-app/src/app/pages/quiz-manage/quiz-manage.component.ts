import { ConfirmService } from '../../services/confirm.service';
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
            <div class="header-actions">
              <button class="btn-ai" (click)="openAiModal()">✨ Générer par IA</button>
              <button class="btn-primary" (click)="showQuizForm = !showQuizForm">
                {{ showQuizForm ? 'Annuler' : '+ Nouveau quiz' }}
              </button>
            </div>
          </div>
          <div class="card" *ngIf="showQuizForm">
            <h3>📝 Nouveau quiz</h3>
            <div class="field"><label>Titre *</label><input type="text" [(ngModel)]="quizForm.title" placeholder="Ex: Quiz — Les variables"></div>
            <div class="field"><label>Description</label><textarea [(ngModel)]="quizForm.description" rows="2"></textarea></div>
            <div class="field-row">
              <div class="field"><label>Score minimum (%)</label><input type="number" [(ngModel)]="quizForm.passing_score" min="0" max="100" placeholder="70"></div>
              <div class="field"><label>Limite de temps (min)</label><input type="number" [(ngModel)]="quizForm.time_limit" min="1" placeholder="Ex: 15"></div>
            </div>
            <div class="form-actions">
              <button class="btn-save" (click)="createQuiz()" [disabled]="!quizForm.title || saving">{{ saving ? 'Création...' : '✅ Créer le quiz' }}</button>
              <button class="btn-cancel" (click)="showQuizForm = false">Annuler</button>
            </div>
          </div>
          <div class="empty-state" *ngIf="quizzes.length === 0 && !showQuizForm">
            <div class="empty-icon">🧠</div><p>Aucun quiz pour ce chapitre.</p>
            <div class="empty-btns">
              <button class="btn-ai" (click)="openAiModal()">✨ Générer par IA</button>
              <button class="btn-primary" (click)="showQuizForm = true">+ Créer manuellement</button>
            </div>
          </div>
          <div class="quiz-card" *ngFor="let quiz of quizzes">
            <div class="quiz-header">
              <div class="quiz-info">
                <span class="quiz-title">🧠 {{ quiz.title }}</span>
                <span class="quiz-meta">{{ quiz.questions?.length || 0 }} question(s) &nbsp;•&nbsp; Score min : {{ quiz.passing_score || 70 }}%<span *ngIf="quiz.time_limit"> &nbsp;•&nbsp; ⏱ {{ quiz.time_limit }} min</span></span>
              </div>
              <div class="quiz-actions">
                <button class="btn-toggle" (click)="toggleQuiz(quiz.id)">{{ expandedQuiz === quiz.id ? '▲ Replier' : '▼ Gérer les questions' }}</button>
                <button class="btn-del" (click)="deleteQuiz(quiz.id)">🗑️</button>
              </div>
            </div>
            <div class="quiz-body" *ngIf="expandedQuiz === quiz.id">
              <div class="add-question-btn-row">
                <button class="btn-add-q" (click)="toggleQuestionForm(quiz.id)">{{ showQuestionForm[quiz.id] ? '✕ Annuler' : '+ Ajouter une question' }}</button>
              </div>
              <div class="question-form" *ngIf="showQuestionForm[quiz.id]">
                <div class="field"><label>Question *</label><textarea [(ngModel)]="questionForms[quiz.id].text" rows="2"></textarea></div>
                <div class="field"><label>Points</label><input type="number" [(ngModel)]="questionForms[quiz.id].points" min="1" placeholder="1"></div>
                <h4>Options de réponse</h4>
                <div class="options-list">
                  <div class="option-row" *ngFor="let opt of questionForms[quiz.id].options; let i = index">
                    <input type="radio" name="correct-{{quiz.id}}" [checked]="opt.is_correct" (change)="setCorrect(quiz.id, i)">
                    <input type="text" [(ngModel)]="opt.text" placeholder="Option {{ i + 1 }}">
                    <button class="btn-remove-opt" (click)="removeOption(quiz.id, i)" *ngIf="questionForms[quiz.id].options.length > 2">✕</button>
                  </div>
                </div>
                <div class="option-actions">
                  <button class="btn-add-opt" (click)="addOption(quiz.id)">+ Option</button>
                  <span class="hint">Sélectionne le bouton radio de la bonne réponse</span>
                </div>
                <div class="form-actions" style="margin-top:.75rem">
                  <button class="btn-save" (click)="addQuestion(quiz)" [disabled]="!questionForms[quiz.id].text || saving">{{ saving ? 'Ajout...' : '✅ Ajouter la question' }}</button>
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
                    <span class="opt-icon">{{ opt.is_correct ? '✅' : '○' }}</span><span>{{ opt.text }}</span>
                  </div>
                </div>
                <div class="explanation" *ngIf="q.explanation"><span class="expl-label">💡 Explication :</span> {{ q.explanation }}</div>
              </div>
            </div>
          </div>
        </ng-container>
      </main>
    </div>

    <!-- ===== MODAL IA ===== -->
    <div class="modal-overlay" *ngIf="showAiModal" (click)="closeAiModal()">
      <div class="modal" (click)="$event.stopPropagation()">

        <!-- ── ÉTAPE 0 : choix du mode source ── -->
        <ng-container *ngIf="aiStep === 'source'">
          <div class="modal-header">
            <div class="modal-title">
              <span class="ai-icon">✨</span>
              <div><h2>Générer un quiz par IA</h2><p>Comment l'IA obtient le contenu ?</p></div>
            </div>
            <button class="modal-close" (click)="closeAiModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="source-cards">
              <div class="source-card" [class.selected]="aiSourceMode === 'auto'" (click)="selectSource('auto')">
                <div class="source-icon">⚡</div>
                <div class="source-title">Automatique</div>
                <div class="source-desc">L'IA lit directement le contenu des leçons de ce chapitre. Sélectionnez les leçons à utiliser.</div>
                <div class="source-badge" *ngIf="aiSourceMode === 'auto'">✓ Sélectionné</div>
              </div>
              <div class="source-card" [class.selected]="aiSourceMode === 'manual'" (click)="selectSource('manual')">
                <div class="source-icon">✏️</div>
                <div class="source-title">Manuel</div>
                <div class="source-desc">Vous collez ou rédigez vous-même le contenu que l'IA doit utiliser.</div>
                <div class="source-badge" *ngIf="aiSourceMode === 'manual'">✓ Sélectionné</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeAiModal()">Annuler</button>
            <button class="btn-generate" (click)="goToConfig()" [disabled]="!aiSourceMode">
              Continuer →
            </button>
          </div>
        </ng-container>

        <!-- ── ÉTAPE CONFIG auto : sélection leçons ── -->
        <ng-container *ngIf="aiStep === 'config' && aiSourceMode === 'auto'">
          <div class="modal-header">
            <div class="modal-title">
              <span class="ai-icon">⚡</span>
              <div><h2>Sélectionner les leçons</h2><p>L'IA lira le contenu des leçons choisies</p></div>
            </div>
            <button class="modal-close" (click)="closeAiModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="subs-loading" *ngIf="loadingSubs">⏳ Chargement des leçons...</div>
            <ng-container *ngIf="!loadingSubs">
              <div class="subs-list">
                <label class="sub-check-item" *ngFor="let sub of subChapters">
                  <input type="checkbox" [(ngModel)]="sub._selected" [disabled]="!sub.content">
                  <div class="sub-check-body">
                    <span class="sub-check-title">{{ sub.title }}</span>
                    <span class="sub-check-meta" *ngIf="sub.content">{{ stripHtml(sub.content).length }} caractères</span>
                    <span class="sub-check-empty" *ngIf="!sub.content">Leçon vide</span>
                  </div>
                </label>
                <div class="no-subs" *ngIf="subChapters.length === 0">Aucune leçon dans ce chapitre.</div>
              </div>
              <div class="selected-preview" *ngIf="selectedSubsContent">
                <span class="preview-label">📄 Contenu sélectionné :</span>
                <span class="preview-len">{{ selectedSubsContent.length }} caractères</span>
              </div>
            </ng-container>
            <div class="field-row" style="margin-top:1rem">
              <div class="field"><label>Nombre de questions</label>
                <select [(ngModel)]="aiConfig.num_questions">
                  <option [value]="3">3</option><option [value]="5">5</option>
                  <option [value]="8">8</option><option [value]="10">10</option>
                  <option [value]="12">12</option><option [value]="15">15</option>
                </select>
              </div>
              <div class="field"><label>Difficulté</label>
                <select [(ngModel)]="aiConfig.difficulty">
                  <option value="facile">🟢 Facile</option>
                  <option value="moyen">🟡 Moyen</option>
                  <option value="difficile">🔴 Difficile</option>
                </select>
              </div>
            </div>
            <div class="field-row">
              <div class="field"><label>Titre du quiz (optionnel)</label><input type="text" [(ngModel)]="aiConfig.quiz_title" [placeholder]="'Quiz — ' + chapterName"></div>
              <div class="field"><label>Score minimum (%)</label><input type="number" [(ngModel)]="aiConfig.passing_score" min="0" max="100" placeholder="70"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="aiStep = 'source'">← Retour</button>
            <button class="btn-generate" (click)="generateFromAuto()" [disabled]="aiGenerating || !hasSelectedSubs()">
              <span *ngIf="!aiGenerating">✨ Générer le quiz</span>
              <span *ngIf="aiGenerating" class="generating"><span class="spinner"></span> Génération en cours...</span>
            </button>
          </div>
        </ng-container>

        <!-- ── ÉTAPE CONFIG manuel : textarea ── -->
        <ng-container *ngIf="aiStep === 'config' && aiSourceMode === 'manual'">
          <div class="modal-header">
            <div class="modal-title">
              <span class="ai-icon">✏️</span>
              <div><h2>Génération de quiz par IA</h2><p>L'IA analyse le contenu et crée des questions pertinentes</p></div>
            </div>
            <button class="modal-close" (click)="closeAiModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Contenu du chapitre *</label>
              <p class="field-hint">Colle le texte de la leçon (min. 50 caractères). L'IA s'appuie uniquement sur ce contenu.</p>
              <textarea [(ngModel)]="aiConfig.content" rows="9" placeholder="Colle ici le contenu de la leçon..."></textarea>
              <div class="char-count" [class.warn]="aiConfig.content.length > 7000">{{ aiConfig.content.length }} / 8000 caractères</div>
            </div>
            <div class="field-row">
              <div class="field"><label>Nombre de questions</label>
                <select [(ngModel)]="aiConfig.num_questions">
                  <option [value]="3">3 questions</option><option [value]="5">5 questions</option>
                  <option [value]="8">8 questions</option><option [value]="10">10 questions</option>
                  <option [value]="12">12 questions</option><option [value]="15">15 questions</option>
                </select>
              </div>
              <div class="field"><label>Difficulté</label>
                <select [(ngModel)]="aiConfig.difficulty">
                  <option value="facile">🟢 Facile</option><option value="moyen">🟡 Moyen</option><option value="difficile">🔴 Difficile</option>
                </select>
              </div>
            </div>
            <div class="field-row">
              <div class="field"><label>Titre du quiz (optionnel)</label><input type="text" [(ngModel)]="aiConfig.quiz_title" [placeholder]="'Quiz — ' + chapterName"></div>
              <div class="field"><label>Score minimum (%)</label><input type="number" [(ngModel)]="aiConfig.passing_score" min="0" max="100" placeholder="70"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="aiStep = 'source'">← Retour</button>
            <button class="btn-generate" (click)="generateQuiz()" [disabled]="aiConfig.content.length < 50 || aiGenerating">
              <span *ngIf="!aiGenerating">✨ Générer le quiz</span>
              <span *ngIf="aiGenerating" class="generating"><span class="spinner"></span> Génération en cours...</span>
            </button>
          </div>
        </ng-container>

        <!-- ── ÉTAPE PREVIEW ── -->
        <ng-container *ngIf="aiStep === 'preview'">
          <div class="modal-header">
            <div class="modal-title"><span class="ai-icon">🎯</span><div><h2>{{ aiResult?.quiz_title }}</h2><p>{{ aiResult?.questions?.length }} questions · Difficulté : {{ aiConfig.difficulty }}</p></div></div>
            <button class="modal-close" (click)="closeAiModal()">✕</button>
          </div>
          <div class="modal-body preview-body">
            <div class="preview-meta">
              <span class="meta-badge">{{ aiResult?.meta?.tokens_used }} tokens</span>
              <span class="meta-badge model-badge">{{ aiResult?.meta?.model }}</span>
              <button class="btn-regenerate" (click)="aiStep = 'config'">↩ Modifier & régénérer</button>
            </div>
            <div class="preview-question" *ngFor="let q of aiResult?.questions; let i = index">
              <div class="pq-header">
                <span class="pq-num">Q{{ i + 1 }}</span><span class="pq-text">{{ q.text }}</span>
                <span class="pq-pts">{{ q.points }} pt(s)</span>
                <button class="btn-remove-q" (click)="removeAiQuestion(i)">✕</button>
              </div>
              <div class="pq-options">
                <div class="pq-option" *ngFor="let opt of q.options" [class.correct]="opt.is_correct">
                  <span class="opt-icon">{{ opt.is_correct ? '✅' : '○' }}</span><span>{{ opt.text }}</span>
                </div>
              </div>
              <div class="pq-explanation" *ngIf="q.explanation"><span class="expl-label">💡</span> {{ q.explanation }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeAiModal()">Annuler</button>
            <button class="btn-save" (click)="importAiQuiz()" [disabled]="importing || !aiResult?.questions?.length">
              <span *ngIf="!importing">⬇️ Importer ({{ aiResult?.questions?.length }} questions)</span>
              <span *ngIf="importing" class="generating"><span class="spinner spinner-dark"></span> Import...</span>
            </button>
          </div>
        </ng-container>

        <!-- ── SUCCÈS ── -->
        <ng-container *ngIf="aiStep === 'success'">
          <div class="success-step">
            <div class="success-icon">🎉</div>
            <h2>Quiz importé avec succès !</h2>
            <p>{{ importedCount }} question(s) ajoutées au quiz <strong>{{ importedQuizTitle }}</strong></p>
            <button class="btn-primary" (click)="closeAiModal()">Fermer</button>
          </div>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#f4f6fb}
    .main{margin-left:260px;flex:1;padding:2rem}
    .back-row a{color:#4361ee;font-size:.85rem;text-decoration:none}.back-row a:hover{text-decoration:underline}.back-row{margin-bottom:1.25rem}
    .loading{text-align:center;padding:3rem;color:#8a9bbf}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem}
    .page-header h1{font-size:1.4rem;font-weight:800;color:#1a2340;margin:0 0 .25rem}.page-header .sub{font-size:.85rem;color:#8a9bbf;margin:0}
    .header-actions{display:flex;gap:.6rem;align-items:center}
    .btn-primary{background:#4361ee;color:#fff;border:none;border-radius:8px;padding:.55rem 1.2rem;cursor:pointer;font-size:.85rem;font-weight:600}.btn-primary:hover{background:#3451d1}
    .btn-ai{background:linear-gradient(135deg,#7c3aed,#4361ee);color:#fff;border:none;border-radius:8px;padding:.55rem 1.2rem;cursor:pointer;font-size:.85rem;font-weight:600}.btn-ai:hover{opacity:.88}
    .btn-save{background:#22c55e;color:#fff;border:none;border-radius:8px;padding:.45rem 1rem;cursor:pointer;font-size:.83rem;font-weight:600}.btn-save:disabled{opacity:.5;cursor:not-allowed}
    .btn-cancel{background:#f0f4ff;color:#4361ee;border:1px solid #d5dcf9;border-radius:8px;padding:.45rem 1rem;cursor:pointer;font-size:.83rem}
    .btn-del{background:#fee2e2;color:#dc2626;border:none;border-radius:6px;padding:.35rem .65rem;cursor:pointer;font-size:.82rem}.btn-del:hover{background:#dc2626;color:#fff}
    .btn-del-sm{background:#fee2e2;color:#dc2626;border:none;border-radius:5px;padding:.2rem .45rem;cursor:pointer;font-size:.75rem}.btn-del-sm:hover{background:#dc2626;color:#fff}
    .btn-toggle{background:#f0f4ff;color:#4361ee;border:1px solid #d5dcf9;border-radius:6px;padding:.35rem .75rem;cursor:pointer;font-size:.8rem;font-weight:600}.btn-toggle:hover{background:#4361ee;color:#fff}
    .btn-add-q{background:#1a2340;color:#fff;border:none;border-radius:7px;padding:.38rem .9rem;cursor:pointer;font-size:.8rem;font-weight:600}.btn-add-q:hover{background:#0f2544}
    .btn-add-opt{background:#f0f4ff;color:#4361ee;border:1px solid #d5dcf9;border-radius:6px;padding:.28rem .7rem;cursor:pointer;font-size:.78rem}
    .card{background:#fff;border-radius:12px;padding:1.4rem;margin-bottom:1.25rem;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e8ecf3}.card h3{font-size:1rem;font-weight:700;color:#1a2340;margin:0 0 1rem}
    .field{margin-bottom:.85rem}.field label{display:block;font-size:.8rem;font-weight:600;color:#5a6a85;margin-bottom:.3rem}
    .field-hint{font-size:.75rem;color:#8a9bbf;margin:0 0 .4rem;font-style:italic}
    .field input,.field textarea,.field select{width:100%;padding:.45rem .75rem;border:1px solid #d5dcf9;border-radius:8px;font-size:.85rem;font-family:inherit;outline:none;box-sizing:border-box}
    .field input:focus,.field textarea:focus,.field select:focus{border-color:#4361ee}
    .field-row{display:flex;gap:1rem}.field-row .field{flex:1}
    .form-actions{display:flex;gap:.6rem}
    .char-count{font-size:.72rem;color:#8a9bbf;text-align:right;margin-top:.25rem}.char-count.warn{color:#dc2626}
    .empty-state{text-align:center;padding:3rem;background:#fff;border-radius:12px;border:2px dashed #e8ecf3}
    .empty-icon{font-size:2.5rem;margin-bottom:.75rem}.empty-state p{color:#8a9bbf;margin-bottom:1rem}
    .empty-btns{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap}
    .quiz-card{background:#fff;border-radius:12px;margin-bottom:1rem;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e8ecf3;overflow:hidden}
    .quiz-header{display:flex;justify-content:space-between;align-items:center;padding:.9rem 1.2rem;background:#f8fafc;flex-wrap:wrap;gap:.5rem}
    .quiz-info{display:flex;flex-direction:column;gap:.2rem}.quiz-title{font-weight:700;color:#1a2340;font-size:.92rem}.quiz-meta{font-size:.75rem;color:#8a9bbf}
    .quiz-actions{display:flex;gap:.5rem;align-items:center}.quiz-body{padding:1.2rem;border-top:1px solid #e8ecf3}.add-question-btn-row{margin-bottom:.85rem}
    .question-form{background:#f8fafc;border:1px solid #e8ecf3;border-radius:10px;padding:1rem;margin-bottom:1rem}
    .question-form h4{font-size:.82rem;font-weight:700;color:#1a2340;margin:.75rem 0 .5rem}
    .options-list{display:flex;flex-direction:column;gap:.45rem;margin-bottom:.5rem}
    .option-row{display:flex;align-items:center;gap:.5rem}.option-row input[type=radio]{flex-shrink:0;accent-color:#4361ee;width:16px;height:16px;cursor:pointer}
    .option-row input[type=text]{flex:1;padding:.38rem .65rem;border:1px solid #d5dcf9;border-radius:6px;font-size:.83rem;font-family:inherit}.option-row input[type=text]:focus{outline:none;border-color:#4361ee}
    .btn-remove-opt{background:none;border:none;color:#dc2626;cursor:pointer;font-size:.85rem;padding:0 .25rem}
    .option-actions{display:flex;align-items:center;gap:1rem;margin-top:.35rem}.hint{font-size:.73rem;color:#8a9bbf;font-style:italic}
    .no-questions{color:#8a9bbf;font-size:.83rem;font-style:italic;padding:.5rem 0 1rem}
    .question-item{border:1px solid #e8ecf3;border-radius:9px;margin-bottom:.75rem;overflow:hidden}
    .question-header{display:flex;align-items:center;gap:.65rem;padding:.65rem .9rem;background:#f8fafc;flex-wrap:wrap}
    .q-num{background:#4361ee;color:#fff;border-radius:5px;padding:.1rem .4rem;font-size:.72rem;font-weight:700;flex-shrink:0}
    .q-text{flex:1;font-size:.85rem;font-weight:600;color:#1a2340}.q-pts{font-size:.75rem;color:#8a9bbf;flex-shrink:0}
    .options-display{padding:.55rem .9rem .5rem;display:flex;flex-direction:column;gap:.3rem}
    .opt-item{display:flex;align-items:center;gap:.5rem;font-size:.82rem;color:#5a6a85;padding:.28rem .5rem;border-radius:5px}.opt-item.correct{background:#dcfce7;color:#16a34a;font-weight:600}
    .opt-icon{font-size:.8rem;flex-shrink:0}.explanation{padding:.4rem .9rem .7rem;font-size:.78rem;color:#7c3aed;font-style:italic;background:#faf5ff;border-top:1px solid #ede9fe}.expl-label{font-weight:700}

    /* ── MODAL ── */
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem}
    .modal{background:#fff;border-radius:16px;width:100%;max-width:680px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25)}
    .modal-header{display:flex;align-items:flex-start;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #e8ecf3;flex-shrink:0}
    .modal-title{display:flex;align-items:flex-start;gap:.85rem}.ai-icon{font-size:1.6rem;flex-shrink:0}
    .modal-title h2{font-size:1.05rem;font-weight:800;color:#1a2340;margin:0 0 .2rem}.modal-title p{font-size:.78rem;color:#8a9bbf;margin:0}
    .modal-close{background:none;border:none;font-size:1.2rem;cursor:pointer;color:#8a9bbf;padding:.25rem;line-height:1}.modal-close:hover{color:#1a2340}
    .modal-body{flex:1;overflow-y:auto;padding:1.25rem 1.5rem}
    .modal-footer{display:flex;justify-content:flex-end;gap:.75rem;padding:1rem 1.5rem;border-top:1px solid #e8ecf3;flex-shrink:0}
    .btn-generate{background:linear-gradient(135deg,#7c3aed,#4361ee);color:#fff;border:none;border-radius:8px;padding:.55rem 1.4rem;cursor:pointer;font-size:.88rem;font-weight:700;min-width:190px;display:flex;align-items:center;justify-content:center;gap:.5rem}
    .btn-generate:disabled{opacity:.55;cursor:not-allowed}.btn-generate:not(:disabled):hover{opacity:.88}
    .generating{display:flex;align-items:center;gap:.5rem}
    .spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
    .spinner-dark{border:2px solid rgba(0,0,0,.15);border-top-color:#1a2340}
    @keyframes spin{to{transform:rotate(360deg)}}

    /* ── SOURCE CARDS ── */
    .source-cards{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:.5rem}
    .source-card{border:2px solid #e8ecf3;border-radius:12px;padding:1.5rem 1.25rem;cursor:pointer;transition:all .2s;text-align:center;position:relative}
    .source-card:hover{border-color:#a5b4fc;box-shadow:0 4px 16px rgba(67,97,238,.1)}
    .source-card.selected{border-color:#4361ee;background:#f0f4ff;box-shadow:0 4px 16px rgba(67,97,238,.15)}
    .source-icon{font-size:2rem;margin-bottom:.6rem}
    .source-title{font-size:.95rem;font-weight:800;color:#1a2340;margin-bottom:.4rem}
    .source-desc{font-size:.78rem;color:#5a6a85;line-height:1.5}
    .source-badge{margin-top:.75rem;display:inline-block;background:#4361ee;color:#fff;border-radius:20px;padding:.15rem .65rem;font-size:.72rem;font-weight:700}

    /* ── SUBS LIST ── */
    .subs-loading{color:#8a9bbf;font-size:.85rem;padding:1rem 0}
    .subs-list{display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem}
    .sub-check-item{display:flex;align-items:flex-start;gap:.65rem;padding:.65rem .85rem;border:1px solid #e8ecf3;border-radius:8px;cursor:pointer;transition:border-color .15s}
    .sub-check-item:hover{border-color:#a5b4fc}
    .sub-check-item input[type=checkbox]{accent-color:#4361ee;width:16px;height:16px;flex-shrink:0;margin-top:.1rem;cursor:pointer}
    .sub-check-body{display:flex;flex-direction:column;gap:.15rem}
    .sub-check-title{font-size:.85rem;font-weight:600;color:#1a2340}
    .sub-check-meta{font-size:.73rem;color:#22c55e;font-weight:600}
    .sub-check-empty{font-size:.73rem;color:#dc2626;font-style:italic}
    .no-subs{color:#8a9bbf;font-size:.83rem;font-style:italic;padding:.5rem 0}
    .selected-preview{display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:.78rem}
    .preview-label{color:#16a34a;font-weight:600}
    .preview-len{color:#15803d;font-weight:700}

    /* ── PREVIEW ── */
    .preview-meta{display:flex;align-items:center;gap:.5rem;margin-bottom:1.25rem;flex-wrap:wrap}
    .meta-badge{background:#f0f4ff;color:#4361ee;border:1px solid #d5dcf9;border-radius:20px;padding:.2rem .65rem;font-size:.73rem;font-weight:600}
    .model-badge{background:#faf5ff;color:#7c3aed;border-color:#ede9fe}
    .btn-regenerate{background:none;border:none;color:#7c3aed;cursor:pointer;font-size:.8rem;font-weight:600;margin-left:auto}.btn-regenerate:hover{text-decoration:underline}
    .preview-question{border:1px solid #e8ecf3;border-radius:10px;margin-bottom:.85rem;overflow:hidden}
    .pq-header{display:flex;align-items:center;gap:.65rem;padding:.65rem .9rem;background:#f8fafc;flex-wrap:wrap}
    .pq-num{background:linear-gradient(135deg,#7c3aed,#4361ee);color:#fff;border-radius:5px;padding:.1rem .4rem;font-size:.72rem;font-weight:700;flex-shrink:0}
    .pq-text{flex:1;font-size:.85rem;font-weight:600;color:#1a2340}.pq-pts{font-size:.75rem;color:#8a9bbf}
    .btn-remove-q{background:#fee2e2;color:#dc2626;border:none;border-radius:5px;padding:.2rem .45rem;cursor:pointer;font-size:.75rem}
    .pq-options{padding:.55rem .9rem .5rem;display:flex;flex-direction:column;gap:.3rem}
    .pq-option{display:flex;align-items:center;gap:.5rem;font-size:.82rem;color:#5a6a85;padding:.28rem .5rem;border-radius:5px}.pq-option.correct{background:#dcfce7;color:#16a34a;font-weight:600}
    .pq-explanation{padding:.4rem .9rem .7rem;font-size:.78rem;color:#7c3aed;font-style:italic;background:#faf5ff;border-top:1px solid #ede9fe}
    .preview-body{max-height:52vh}
    .success-step{text-align:center;padding:3rem 2rem}.success-icon{font-size:3.5rem;margin-bottom:1rem}
    .success-step h2{font-size:1.3rem;font-weight:800;color:#1a2340;margin:0 0 .5rem}.success-step p{color:#5a6a85;margin:0 0 1.5rem}
  `]
})
export class QuizManageComponent implements OnInit {
  courseId = 0; chapterId = 0; courseName = ''; chapterName = '';
  quizzes: any[] = []; loading = true; saving = false; showQuizForm = false;
  expandedQuiz: number | null = null;
  showQuestionForm: Record<number, boolean> = {};
  questionForms: Record<number, any> = {};
  quizForm = { title: '', description: '', passing_score: 70, time_limit: null as number | null };

  showAiModal = false;
  aiStep: 'source' | 'config' | 'preview' | 'success' = 'source';
  aiSourceMode: 'auto' | 'manual' | '' = '';
  aiGenerating = false; importing = false;
  importedCount = 0; importedQuizTitle = '';
  aiResult: any = null;
  aiConfig = { content: '', num_questions: 5, difficulty: 'moyen', quiz_title: '', passing_score: 70 };

  subChapters: any[] = [];
  loadingSubs = false;

  private readonly QUIZ_API = '/api';
  private readonly COURSE_API = '/api';
  private readonly AI_API = '/api/generate-quiz';

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient, private auth: AuthService, private confirmSvc: ConfirmService) {}

  ngOnInit(): void {
    this.courseId  = +this.route.snapshot.paramMap.get('courseId')!;
    this.chapterId = +this.route.snapshot.paramMap.get('chapterId')!;
    this.loadCourseInfo(); this.loadQuizzes();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
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
    this.http.get<any[]>(`/api/chapters/${this.chapterId}/quizzes`).subscribe({
      next: (quizzes) => { this.quizzes = quizzes; quizzes.forEach(q => this.loadQuestions(q)); this.loading = false; },
      error: () => { this.loading = false; }
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
        quiz.questions = []; this.quizzes.push(quiz);
        this.quizForm = { title: '', description: '', passing_score: 70, time_limit: null };
        this.showQuizForm = false; this.saving = false; this.expandedQuiz = quiz.id; this.initQuestionForm(quiz.id);
        // Créer automatiquement un sous-chapitre lié à ce quiz
        this.http.post<any>(`${this.COURSE_API}/courses/${this.courseId}/chapters/${this.chapterId}/subchapters`,
          { title: quiz.title, content: '', is_lab: false, passing_score: quiz.passing_score || 70, quiz_id: quiz.id },
          { headers: this.headers() }).subscribe({ error: () => {} });
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
      options: [{ text: '', is_correct: true },{ text: '', is_correct: false },{ text: '', is_correct: false },{ text: '', is_correct: false }]
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
        if (validOptions.length === 0) { this.saving = false; this.initQuestionForm(quiz.id); this.showQuestionForm[quiz.id] = false; return; }
        let done = 0;
        validOptions.forEach((opt: any) => {
          this.http.post<any>(`${this.QUIZ_API}/quizzes/${quiz.id}/questions/${question.id}/options`, { text: opt.text, is_correct: opt.is_correct }, { headers: this.headers() }).subscribe({
            next: (o) => { question.options.push(o); done++; if (done === validOptions.length) { this.saving = false; this.initQuestionForm(quiz.id); this.showQuestionForm[quiz.id] = false; } },
            error: () => { done++; if (done === validOptions.length) this.saving = false; }
          });
        });
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

  /* ══════════════════════════════════════
     IA — Modal & source
  ══════════════════════════════════════ */
  openAiModal(): void {
    this.showAiModal = true;
    this.aiStep = 'source';
    this.aiSourceMode = '';
    this.aiResult = null;
    this.aiConfig = { content: '', num_questions: 5, difficulty: 'moyen', quiz_title: '', passing_score: 70 };
    this.subChapters = [];
  }

  closeAiModal(): void {
    const wasSuccess = this.aiStep === 'success';
    this.showAiModal = false;
    if (wasSuccess) this.loadQuizzes();
  }

  selectSource(mode: 'auto' | 'manual'): void { this.aiSourceMode = mode; }

  goToConfig(): void {
    this.aiStep = 'config';
    if (this.aiSourceMode === 'auto') this.loadSubChapters();
  }

  loadSubChapters(): void {
    this.loadingSubs = true;
    this.http.get<any>(`${this.COURSE_API}/courses/${this.courseId}`).subscribe({
      next: (course) => {
        const chapter = (course.chapters || []).find((c: any) => c.id === this.chapterId);
        this.subChapters = (chapter?.sub_chapters || chapter?.subChapters || []).map((s: any) => ({
          ...s, _selected: !!s.content
        }));
        this.loadingSubs = false;
      },
      error: () => { this.loadingSubs = false; }
    });
  }

  hasSelectedSubs(): boolean { return this.subChapters.some(s => s._selected); }

  get selectedSubsContent(): string {
    return this.subChapters
      .filter(s => s._selected && s.content)
      .map(s => `### ${s.title}\n${this.stripHtml(s.content)}`)
      .join('\n\n');
  }

  stripHtml(html: string): string {
    return html ? html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  }

  /* ══════════════════════════════════════
     IA — Génération
  ══════════════════════════════════════ */
  generateFromAuto(): void {
    const content = this.selectedSubsContent;
    if (!content || this.aiGenerating) return;
    this.aiConfig.content = content;
    this.callGenerateApi();
  }

  generateQuiz(): void {
    if (this.aiConfig.content.length < 50 || this.aiGenerating) return;
    this.callGenerateApi();
  }

  private callGenerateApi(): void {
    this.aiGenerating = true;
    this.http.post<any>(this.AI_API, {
      content: this.aiConfig.content,
      chapter_title: this.chapterName,
      course_title: this.courseName,
      num_questions: this.aiConfig.num_questions,
      difficulty: this.aiConfig.difficulty,
    }, { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' }) }).subscribe({
      next: (result) => {
        this.aiResult = result;
        if (this.aiConfig.quiz_title) this.aiResult.quiz_title = this.aiConfig.quiz_title;
        this.aiGenerating = false;
        this.aiStep = 'preview';
      },
      error: (err) => {
        this.aiGenerating = false;
        alert('❌ ' + (err.error?.error || 'Erreur — vérifiez GROQ_API_KEY dans chatbot-service/.env'));
      }
    });
  }

  removeAiQuestion(index: number): void { this.aiResult.questions.splice(index, 1); }

  importAiQuiz(): void {
    if (!this.aiResult?.questions?.length || this.importing) return;
    this.importing = true;
    this.http.post<any>(`${this.QUIZ_API}/quizzes`, {
      title: this.aiResult.quiz_title,
      description: `Généré par IA — Difficulté : ${this.aiConfig.difficulty}`,
      chapter_id: this.chapterId, passing_score: this.aiConfig.passing_score || 70,
    }, { headers: this.headers() }).subscribe({
      next: (quiz) => {
        this.importQuestionsSequentially(quiz.id, this.aiResult.questions, 0, () => {
          this.importing = false;
          this.importedCount = this.aiResult.questions.length;
          this.importedQuizTitle = quiz.title;
          this.aiStep = 'success';
        });
      },
      error: () => { this.importing = false; alert('Erreur création quiz.'); }
    });
  }

  private importQuestionsSequentially(quizId: number, questions: any[], index: number, done: () => void): void {
    if (index >= questions.length) { done(); return; }
    const q = questions[index];
    this.http.post<any>(`${this.QUIZ_API}/quizzes/${quizId}/questions`,
      { text: q.text, points: q.points || 1 }, { headers: this.headers() }).subscribe({
      next: (createdQ) => {
        this.importOptionsSequentially(quizId, createdQ.id, q.options || [], 0, () => {
          this.importQuestionsSequentially(quizId, questions, index + 1, done);
        });
      },
      error: () => this.importQuestionsSequentially(quizId, questions, index + 1, done)
    });
  }

  private importOptionsSequentially(quizId: number, questionId: number, options: any[], index: number, done: () => void): void {
    if (index >= options.length) { done(); return; }
    const opt = options[index];
    this.http.post<any>(`${this.QUIZ_API}/quizzes/${quizId}/questions/${questionId}/options`,
      { text: opt.text, is_correct: opt.is_correct }, { headers: this.headers() }).subscribe({
      next: () => this.importOptionsSequentially(quizId, questionId, options, index + 1, done),
      error: () => this.importOptionsSequentially(quizId, questionId, options, index + 1, done),
    });
  }
}
