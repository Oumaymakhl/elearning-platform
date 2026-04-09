import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../services/quiz.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HttpClientModule],
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

  course: any = null;
  chapters: any[] = [];
  sidebarCollapsed = false;

  get isTeacher() { return this.auth.isTeacher(); }
  get isAdmin()   { return this.auth.isAdmin(); }

  courseId: number | null = null;
  subId: number | null = null;
  subIndex: number = -1;

  constructor(
    private route: ActivatedRoute,
    private quizService: QuizService,
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    const qp = this.route.snapshot.queryParamMap;
    const cid  = qp.get('course_id');
    const sid  = qp.get('sub_id');
    const sidx = qp.get('sub_index');
    if (cid)  this.courseId  = +cid;
    if (sid)  this.subId     = +sid;
    if (sidx) this.subIndex  = +sidx;

    this.quizService.getQuiz(id).subscribe({
      next: (quiz) => {
        this.quiz = quiz;
        this.loading = false;
        if (!this.courseId && quiz.course_id) this.courseId = quiz.course_id;
        if (this.courseId) this.loadCourseSidebar(this.courseId);
      }
    });
    this.quizService.myAttempts(id).subscribe({
      next: (attempts) => { this.pastAttempts = attempts; },
      error: () => {}
    });
  }

  loadCourseSidebar(courseId: number) {
    this.courseService.getCourse(courseId).subscribe({
      next: (course) => {
        this.course = course;
        this.chapters = (course.chapters || []).map((c: any) => ({
          ...c,
          expanded: true,
          sub_chapters: c.sub_chapters || c.subChapters || []
        }));
      },
      error: () => {}
    });
  }

  goBackToCourse() {
    const cid = this.courseId || this.quiz?.course_id;
    if (cid) this.router.navigate(['/courses', cid]);
    else     this.router.navigate(['/courses']);
  }

  openSubFromSidebar(sub: any) {
    const cid = this.courseId || this.quiz?.course_id;
    if (!cid) return;
    const allSubs = this.chapters.flatMap((c: any) => c.sub_chapters || []);
    const idx = allSubs.findIndex((s: any) => s.id === sub.id);
    if (sub.quiz_id) {
      this.router.navigate(['/quiz', sub.quiz_id], {
        queryParams: { course_id: cid, sub_id: sub.id, sub_index: idx }
      });
    } else {
      this.router.navigate(['/courses', cid], { queryParams: { openSub: idx } });
    }
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
        if (result.passed && this.courseId) {
          this.http.get<any[]>(`/api/courses/${this.courseId}/chapters`).subscribe({
            next: (chapters) => {
              const allSubs = chapters.flatMap((c: any) => c.sub_chapters || []);
              const linkedSub = allSubs.find((s: any) => s.quiz_id === this.quiz.id);
              if (linkedSub) {
                this.http.post(`/api/courses/${this.courseId}/progress`,
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
    if (this.step !== 'result') return this.answers[question.id] === option.id ? 'selected' : '';
    if (option.is_correct) return 'correct';
    if (this.answers[question.id] === option.id && !option.is_correct) return 'wrong';
    return '';
  }

  retry() { this.answers = {}; this.result = null; this.step = 'intro'; }

  goToNext() {
    const cid = this.courseId || this.quiz.course_id;
    if (cid) this.router.navigate(['/courses', cid], { queryParams: { openSub: this.subIndex + 1 } });
    else     this.router.navigate(['/courses']);
  }

  goToPrev() {
    if (this.result?.score >= 70) {
      const cid = this.courseId || this.quiz.course_id;
      if (cid) this.router.navigate(['/courses', cid], { queryParams: { openSub: this.subIndex - 1 } });
    }
  }
}
