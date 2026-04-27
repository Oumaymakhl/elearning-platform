import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../services/quiz.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
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
  completedLabs: Set<number> = new Set();
  showLabBlockedModal = false;
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
        // Charger les TDs réussis
        const allSubs = this.chapters.flatMap((c: any) => c.sub_chapters || []);
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : '';
        const headers = { Authorization: 'Bearer ' + token };
        allSubs.filter((s: any) => s.is_lab && s.exercise_id).forEach((s: any) => {
          this.http.get<any>(`/api/exercises/${s.exercise_id}/my-submissions`, { headers: { Authorization: 'Bearer ' + token } }).subscribe({
            next: (res: any) => {
              const submissions = Array.isArray(res) ? res : (res.best || res.all || []);
              if (submissions.some((r: any) => r.passed)) this.completedLabs.add(s.exercise_id);
            },
            error: () => {}
          });
        });
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
    if (sub.is_lab && sub.exercise_id) {
      if (this.completedLabs.has(sub.exercise_id)) {
        this.showLabBlockedModal = true;
        setTimeout(() => this.showLabBlockedModal = false, 3000);
        return;
      }
      this.router.navigate(['/exercise', sub.exercise_id], {
        queryParams: { course_id: cid, sub_index: idx }
      });
    } else if (sub.quiz_id) {
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
          const token2 = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : '';
          const headers2 = new HttpHeaders({ Authorization: `Bearer ${token2}` });
          this.http.get<any[]>(`/api/courses/${this.courseId}/chapters`, { headers: headers2 }).subscribe({
            next: (chapters) => {
              const allSubs = chapters.flatMap((c: any) => c.sub_chapters || []);
              const linkedSub = allSubs.find((s: any) => s.quiz_id === this.quiz.id);
              if (linkedSub) {
                const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : '';
                const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
                this.http.post(`/api/courses/${this.courseId}/progress`,
                  { sub_chapter_id: linkedSub.id }, { headers }).subscribe({ error: () => {} });
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

  private getEffectiveSubIndex(): number {
    if (this.subIndex >= 0) return this.subIndex;
    const allSubs = this.chapters.flatMap((c: any) => c.sub_chapters || []);
    const idx = allSubs.findIndex((s: any) => s.quiz_id === this.quiz?.id || s.id === this.subId);
    if (idx >= 0) this.subIndex = idx;
    return this.subIndex;
  }

  hasPrev(): boolean {
    return this.getEffectiveSubIndex() > 0;
  }

  hasNext(): boolean {
    const allSubs = this.chapters.flatMap((c: any) => c.sub_chapters || []);
    return this.getEffectiveSubIndex() < allSubs.length - 1;
  }

  goToNext() {
    const cid = this.courseId || this.quiz?.course_id;
    if (!cid) { this.router.navigate(['/courses']); return; }
    const allSubs = this.chapters.flatMap((c: any) => c.sub_chapters || []);
    const nextIdx = this.getEffectiveSubIndex() + 1;
    if (nextIdx >= allSubs.length) return;
    const next = allSubs[nextIdx];
    if (next.quiz_id) {
      this.router.navigate(['/quiz', next.quiz_id], { queryParams: { course_id: cid, sub_id: next.id, sub_index: nextIdx } });
    } else if (next.is_lab && next.exercise_id) {
      this.router.navigate(['/exercise', next.exercise_id], { queryParams: { course_id: cid, sub_index: nextIdx } });
    } else {
      this.router.navigate(['/courses', cid], { queryParams: { openSub: nextIdx } });
    }
  }

  goToPrev() {
    const cid = this.courseId || this.quiz?.course_id;
    if (!cid) { this.router.navigate(['/courses']); return; }
    const allSubs = this.chapters.flatMap((c: any) => c.sub_chapters || []);
    const prevIdx = this.getEffectiveSubIndex() - 1;
    if (prevIdx < 0) return;
    const prev = allSubs[prevIdx];
    if (prev.quiz_id) {
      this.router.navigate(['/quiz', prev.quiz_id], { queryParams: { course_id: cid, sub_id: prev.id, sub_index: prevIdx } });
    } else if (prev.is_lab && prev.exercise_id) {
      this.router.navigate(['/exercise', prev.exercise_id], { queryParams: { course_id: cid, sub_index: prevIdx } });
    } else {
      this.router.navigate(['/courses', cid], { queryParams: { openSub: prevIdx } });
    }
  }
}
