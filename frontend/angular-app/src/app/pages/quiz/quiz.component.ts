import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../services/quiz.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, FormsModule, HttpClientModule],
  providers: [],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit {
  quiz: any;
  questions: any[] = [];
  answers: Record<number, number> = {};
  attemptId: number | null = null;
  result: any = null;
  loading = true;
  submitting = false;
  step: 'intro' | 'quiz' | 'result' = 'intro';
  pastAttempts: any[] = [];

  get isTeacher() { return this.auth.isTeacher(); }
  get isAdmin() { return this.auth.isAdmin(); }

  constructor(private route: ActivatedRoute, private quizService: QuizService, private auth: AuthService, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.quizService.getQuiz(id).subscribe({
      next: (quiz) => {
        this.quiz = quiz;
        this.loading = false;
      }
    });
    this.quizService.myAttempts(id).subscribe({
      next: (attempts) => { this.pastAttempts = attempts; },
      error: () => {}
    });
  }

  startQuiz() {
    this.quizService.startAttempt(this.quiz.id).subscribe({
      next: (attempt) => {
        this.attemptId = attempt.id;
        this.quizService.getQuestions(this.quiz.id).subscribe({
          next: (questions) => { this.questions = questions; this.step = 'quiz'; }
        });
      }
    });
  }

  selectOption(questionId: number, optionId: number) {
    this.answers[questionId] = optionId;
  }

  get answeredCount() { return Object.keys(this.answers).length; }

  submitQuiz() {
    if (this.submitting) return;
    this.submitting = true;
    const answersArray = Object.entries(this.answers).map(([qId, oId]) => ({
      question_id: +qId, option_id: +oId
    }));
    this.quizService.submitAttempt(this.quiz.id, this.attemptId!, answersArray).subscribe({
      next: (result) => {
        this.result = result;
        this.result.score = result.percentage ?? Math.round((result.score / result.max_score) * 100);
        this.step = 'result';
        this.submitting = false;
        // Mettre à jour progression si quiz réussi
        if (result.passed && this.quiz.course_id) {
          this.http.get<any[]>(`http://localhost:8002/api/courses/${this.quiz.course_id}/chapters`).subscribe({
            next: (chapters) => {
              const allSubs = chapters.flatMap((c: any) => c.sub_chapters || []);
              const linkedSub = allSubs.find((s: any) => s.quiz_id === this.quiz.id);
              if (linkedSub) {
                this.http.post(`http://localhost:8002/api/courses/${this.quiz.course_id}/progress`,
                  { sub_chapter_id: linkedSub.id }).subscribe({ error: () => {} });
              }
            },
            error: () => {}
          });
        }
      },
      error: () => { this.submitting = false; }
    });
  }

  getOptionClass(question: any, option: any): string {
    if (this.step !== 'result') {
      return this.answers[question.id] === option.id ? 'selected' : '';
    }
    if (option.is_correct) return 'correct';
    if (this.answers[question.id] === option.id && !option.is_correct) return 'wrong';
    return '';
  }

  retry() { this.answers = {}; this.result = null; this.step = 'intro'; }
}
