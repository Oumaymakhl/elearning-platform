import { ConfirmService } from '../../services/confirm.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatContext } from '../../services/chat.service';
import { RatingService } from '../../services/rating.service';
import { StarRatingComponent } from '../../shared/star-rating/star-rating.component';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { LessonContentComponent } from '../../shared/lesson-content/lesson-content.component';
import { QuizService } from '../../services/quiz.service';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, StarRatingComponent, FormsModule, SidebarComponent, RouterLink, LessonContentComponent],
  providers: [QuizService],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {
  course: any;
  chapters: any[] = [];
  enrolled = false;
  courseRating: { average: number | null; count: number } | null = null;
  showChat = false;
  paymentLoading = false;
  hasPaid = false;
  chatMessage = "";
  chatMessages: { role: string; content: string }[] = [];
  chatLoading = false;
  progress: any;

  get isStudent() { return this.auth.isStudent(); }
  get isTeacher() { return this.auth.isTeacher(); }
  get isAdmin() { return this.auth.isAdmin(); }

  // Éditeur de code
  editorLang = 'python';
  editorCode = '# Écrivez votre code ici\nprint("Hello, World!")';
  codeOutput = '';
  codeRunning = false;
  codeSuccess: boolean | null = null;

  starterCodes: Record<string, string> = {
    python: '# Écrivez votre code ici\nprint("Hello, World!")',
    php: '// Écrivez votre code ici\necho "Hello, World!";',
    node: '// Écrivez votre code ici\nconsole.log("Hello, World!")',
    cpp: '// C++\n#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
    bash: '#!/bin/bash\necho "Hello, World!"',
    c: '// C\n#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    perl: '# Perl\nprint "Hello, World!\\n";',
    java: '// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    go:   '// Go\npackage main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
    ruby: '# Ruby\nputs "Hello, World!"'
  };

  constructor(private route: ActivatedRoute, private ratingService: RatingService, private chatService: ChatService, private courseService: CourseService, private auth: AuthService, private router: Router, private http: HttpClient, private quizService: QuizService, private confirmSvc: ConfirmService, private paymentService: PaymentService) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    // 1. Charger le cours
    this.courseService.getCourse(id).subscribe({
      next: (course) => {
        this.course = course;
        this.chapters = (course.chapters || []).map((c: any) => ({ ...c, expanded: false, sub_chapters: c.sub_chapters || c.subChapters || [] }));
        this.checkPayment();
        // 2. Charger la progression APRES le cours
        if (this.isStudent) {
          this.courseService.getProgress(id).subscribe({
            next: (p) => {
              this.progress = { ...p, percentage: parseFloat(p.progress || 0) };
              this.enrolled = true;
              if (parseFloat(p.progress || 0) === 0 && typeof localStorage !== "undefined") {
                localStorage.removeItem("visited_" + id + "_" + (this.auth.getCurrentUser()?.id || 0));
              }
              this.visitedSubs.clear();
              this.loadQuizScores();
              this.loadCompletedLabs();
              this.courseService.getVisitedSubs(this.course.id).subscribe({
                next: (ids: number[]) => {
                  ids.forEach((id: number) => this.visitedSubs.add(id));
                  const total = this.chapters.reduce((acc: number, ch: any) => acc + (ch.sub_chapters?.length || 0), 0);
                  if (total > 0) this.progress.percentage = Math.round(this.visitedSubs.size / total * 100);
                  const qp = this.route.snapshot.queryParamMap;
                  const openSub = qp.get('openSub');
                  if (openSub !== null) {
                    const allSubs = this.getAllSubs();
                    const idx = +openSub;
                    if (idx >= 0 && idx < allSubs.length) {
                      const sub = allSubs[idx];
                      const ch = this.chapters.find((c: any) => (c.sub_chapters||[]).some((s: any) => s.id === sub.id));
                      if (ch) ch.expanded = true;
                      setTimeout(() => { this.activeSubChapter = sub; }, 100);
                    }
                  } else {
                    this.resumeProgress();
                  }
                },
                error: () => { this.resumeProgress(); }
              });
            },
            error: () => {}
          });
        }
      }
    });
  }

  async deleteCourse() {
    const ok = await this.confirmSvc.open({ icon: '🗑️', title: 'Supprimer ce cours ?', message: 'Cette action est irréversible. Le cours sera définitivement supprimé.', okLabel: 'Supprimer', okColor: '#e53e3e' });
    if (!ok) return;
    this.courseService.deleteCourse(this.course.id).subscribe({
      next: () => { this.router.navigate(['/courses']); },
      error: (e) => { alert('Erreur : ' + (e.error?.message || 'Suppression échouée')); }
    });
  }

  quizScores: Record<number, number> = {};
  activeSubChapter: any = null;
  activeQuiz: any = null;
  activeQuizQuestions: any[] = [];
  activeQuizAnswers: Record<number, number> = {};
  activeQuizAttemptId: number | null = null;
  activeQuizResult: any = null;
  activeQuizStep: 'intro' | 'quiz' | 'result' = 'intro';
  activeQuizPastAttempts: any[] = [];
  activeQuizSubmitting = false;
  activeQuizLoading = false;
  chaptersCollapsed = false;
  visitedSubs: Set<number> = new Set();
  completedLabs: Set<number> = new Set();
  showLabBlockedModal = false;
  activeSubIndex: number = -1;
  allSubChapters: any[] = []; // liste plate de tous les sous-chapitres

  loadCompletedLabs() {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
    const headers = new HttpHeaders({ Authorization: `Bearer \${token}` });
    for (const chapter of this.chapters) {
      for (const sub of chapter.sub_chapters || []) {
        if (sub.is_lab && sub.exercise_id) {
          this.http.get<any>(`/api/exercises/${sub.exercise_id}/my-submissions`, { headers }).subscribe({
            next: (res) => {
              const passed = (res.best || []).some((s: any) => s.passed);
              console.log('Lab check', sub.exercise_id, passed, res);
              if (passed) this.completedLabs.add(sub.exercise_id);
            },
            error: () => {}
          });
        }
      }
    }
  }

  loadQuizScores() {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    // Charger scores quiz des chapitres ET sous-chapitres
    for (const chapter of this.chapters) {
      // Quiz du chapitre lui-même
      if (chapter.quiz_id) {
        this.http.get<any[]>(`/api/quizzes/${chapter.quiz_id}/attempts/mine`, { headers }).subscribe({
          next: (attempts) => {
            if (attempts.length > 0) {
              const best = Math.max(...attempts.map((a: any) => Math.round((a.score / (a.max_score||1)) * 100)));
              this.quizScores = { ...this.quizScores, [chapter.quiz_id]: best };
            }
          }, error: () => {}
        });
      }
      // Quiz des sous-chapitres
      for (const sub of chapter.sub_chapters || []) {
        if (sub.quiz_id) {
          this.http.get<any[]>(`/api/quizzes/${sub.quiz_id}/attempts/mine`, { headers }).subscribe({
            next: (attempts) => {
              if (attempts.length > 0) {
                const best = Math.max(...attempts.map((a: any) => Math.round((a.score / (a.max_score||1)) * 100)));
                this.quizScores = { ...this.quizScores, [sub.quiz_id]: best };
              }
            }, error: () => {}
          });
        }
      }
    }
  }

  updateAutoProgress() {
    const allSubs: any[] = [];
    for (const ch of this.chapters) {
      for (const sub of ch.sub_chapters || []) {
        allSubs.push(sub);
      }
    }
    if (allSubs.length === 0) return;
    // Trouver le dernier sous-chapitre débloqué
    let lastUnlockedSub = null;
    for (let i = 0; i < allSubs.length; i++) {
      if (this.isUnlocked(allSubs[i], i, allSubs)) lastUnlockedSub = allSubs[i];
    }
    if (lastUnlockedSub) {
      if (this.isStudent) this.courseService.updateProgress(this.course.id, { sub_chapter_id: lastUnlockedSub.id }).subscribe({
        next: (r: any) => { if (this.progress) this.progress.percentage = r.progress; },
        error: () => {}
      });
    }
  }

  // Vérifie si un chapitre entier est débloqué (basé sur le quiz du dernier sous-chapitre du chapitre précédent)
  isChapterUnlocked(chapterIndex: number): boolean {
    if (!this.isStudent) return true;
    if (!this.enrolled) return false;
    if (chapterIndex === 0) return true;
    const prevChapter = this.chapters[chapterIndex - 1];
    const prevSubs = prevChapter.sub_chapters || [];
    // Chercher le dernier sous-chapitre avec un quiz
    const subWithQuiz = [...prevSubs].reverse().find((s: any) => s.quiz_id);
    if (!subWithQuiz) return true;
    const score = this.quizScores[subWithQuiz.quiz_id];
    if (score === undefined) return false;
    return score >= (subWithQuiz.passing_score || 70);
  }

  isUnlocked(sub: any, index: number, allSubs: any[]): boolean {
    if (!this.isStudent) return true;
    if (!this.enrolled) return false;
    // Trouver le chapitre de ce sous-chapitre
    const chapterIndex = this.chapters.findIndex((ch: any) =>
      (ch.sub_chapters || []).some((s: any) => s.id === sub.id)
    );
    return this.isChapterUnlocked(chapterIndex);
  }

  getAllSubs(): any[] {
    const subs: any[] = [];
    for (const ch of this.chapters) {
      for (const sub of ch.sub_chapters || []) {
        subs.push({ ...sub, _chapterIndex: this.chapters.indexOf(ch) });
      }
    }
    return subs;
  }

  goToPrev() {
    const all = this.getAllSubs();
    const idx = all.findIndex((s: any) => s.id === this.activeSubChapter?.id);
    if (idx > 0) this.openSubChapterDirect(all[idx - 1]);
  }

  goToNext() {
    const all = this.getAllSubs();
    const idx = all.findIndex((s: any) => s.id === this.activeSubChapter?.id);
    if (idx < all.length - 1) this.openSubChapterDirect(all[idx + 1]);
  }

  hasPrev(): boolean {
    const all = this.getAllSubs();
    const idx = all.findIndex((s: any) => s.id === this.activeSubChapter?.id);
    return idx > 0;
  }

  hasNext(): boolean {
    const all = this.getAllSubs();
    const idx = all.findIndex((s: any) => s.id === this.activeSubChapter?.id);
    return idx < all.length - 1;
  }

  openSubChapterDirect(sub: any) {
    this.activeSubChapter = sub;
    if (!this.visitedSubs.has(sub.id)) {
      this.visitedSubs.add(sub.id);
    }
    const total = this.chapters.reduce((acc: number, ch: any) => acc + (ch.sub_chapters?.length || 0), 0);
    const percentage = total > 0 ? Math.round(this.visitedSubs.size / total * 100) : 0;
    if (percentage > (this.progress?.percentage || 0)) {
      if (this.isStudent) {
        this.courseService.updateProgress(this.course.id, { sub_chapter_id: sub.id, progress: percentage }).subscribe({
          next: (r: any) => { if (this.progress) { this.progress.percentage = percentage; this.progress.current_sub_chapter_id = sub.id; } },
          error: () => {}
        });
      }
    }
  }

  openSubChapter(sub: any, index: number, allSubs: any[]) {
    if (!this.isUnlocked(sub, index, allSubs)) {
      alert('Vous devez obtenir au moins ' + (allSubs[index-1].passing_score || 70) + '% au quiz précédent pour débloquer ce chapitre.');
      return;
    }
    // Ajouter ce sous-chapitre aux visités et recalculer
    if (!this.visitedSubs.has(sub.id)) {
      this.visitedSubs.add(sub.id);
    }
    const total = this.chapters.reduce((acc: number, ch: any) => acc + (ch.sub_chapters?.length || 0), 0);
    const percentage = total > 0 ? Math.round(this.visitedSubs.size / total * 100) : 0;
    if (this.isStudent) {
      this.courseService.updateProgress(this.course.id, { sub_chapter_id: sub.id, progress: percentage }).subscribe({
        next: (r: any) => {
          if (this.progress) {
            this.progress.percentage = percentage;
            this.progress.current_sub_chapter_id = sub.id;
          }
        },
        error: () => {}
      });
    }
    if (sub.is_lab && sub.exercise_id) {
      // Bloquer si TD déjà réussi
      if (this.completedLabs.has(sub.exercise_id)) { this.showLabBlockedModal = true; setTimeout(() => this.showLabBlockedModal = false, 3000); return; }
      const allSubs = this.getAllSubs();
      const subIdx = allSubs.findIndex((s: any) => s.id === sub.id);
      this.router.navigate(['/exercise', sub.exercise_id], {
        queryParams: { course_id: this.course.id, sub_index: subIdx }
      });
    } else if (sub.quiz_id) {
      const allSubs = this.getAllSubs();
      const subIdx = allSubs.findIndex((s: any) => s.id === sub.id);
      this.router.navigate(['/quiz', sub.quiz_id], { queryParams: { course_id: this.course.id, sub_id: sub.id, sub_index: subIdx } });
      this.quizService.myAttempts(sub.quiz_id).subscribe({
        next: (attempts) => { this.activeQuizPastAttempts = attempts; },
        error: () => { this.activeQuizPastAttempts = []; }
      });
    } else {
      // Afficher le contenu inline
      this.activeSubChapter = this.activeSubChapter?.id === sub.id ? null : sub;
      // Progression gérée par visitedSubs déjà au dessus
      if (false) this.courseService.updateProgress(this.course.id, { sub_chapter_id: sub.id }).subscribe({
        next: (r: any) => { if (this.progress) { this.progress.percentage = r.progress; this.progress.current_sub_chapter_id = sub.id; } },
        error: () => {}
      });
    }
  }

  enroll() {
    this.courseService.enroll(this.course.id).subscribe({
      next: () => {
        this.enrolled = true;
        this.courseService.getProgress(this.course.id).subscribe({
          next: (p: any) => { this.progress = { ...p, percentage: parseFloat(p.progress || 0) }; setTimeout(() => this.loadQuizScores(), 100); },
          error: () => {}
        });
      },
      error: (e) => { alert(e.error?.message || 'Erreur inscription'); }
    });
  }

  unenroll() {
    this.courseService.unenroll(this.course.id).subscribe({ next: () => { this.enrolled = false; } });
  }

  onEditorLangChange() {
    this.editorCode = this.starterCodes[this.editorLang];
    this.codeOutput = '';
    this.codeSuccess = null;
  }

  resetEditor() {
    this.editorCode = this.starterCodes[this.editorLang];
    this.codeOutput = '';
    this.codeSuccess = null;
  }

  onEditorTab(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target as HTMLTextAreaElement;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      this.editorCode = this.editorCode.substring(0, start) + '    ' + this.editorCode.substring(end);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4; });
    }
  }

  runCode() {
    if (this.codeRunning) return;
    this.codeRunning = true;
    this.codeOutput = '';
    this.codeSuccess = null;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.post<any>('/api/execute',
      { language: this.editorLang, code: this.editorCode },
      { headers }
    ).subscribe({
      next: (res) => {
        this.codeOutput = res.output || '(aucune sortie)';
        this.codeSuccess = res.success;
        this.codeRunning = false;
      },
      error: () => {
        this.codeOutput = 'Erreur de connexion au serveur.';
        this.codeSuccess = false;
        this.codeRunning = false;
      }
    });
  }

  resumeProgress() {
    if (!this.progress?.current_sub_chapter_id) return;
    const allSubs = this.getAllSubs();
    const sub = allSubs.find((s: any) => s.id === this.progress.current_sub_chapter_id);
    if (sub) {
      const ch = this.chapters.find((c: any) => (c.sub_chapters||[]).some((s: any) => s.id === sub.id));
      if (ch) ch.expanded = true;
      this.activeSubChapter = sub;
    }
  }

  get displayPercentage(): number {
    const total = this.chapters.reduce((acc: number, ch: any) => acc + (ch.sub_chapters?.length || 0), 0);
    if (total === 0) return this.progress?.percentage || 0;
    return Math.round(this.visitedSubs.size / total * 100);
  }

  initVisitedSubs() {
    // Utiliser seulement la DB - reconstituer depuis percentage sauvegardé
    this.visitedSubs.clear();
    const allSubs = this.getAllSubs();
    const total = allSubs.length;
    if (total === 0) return;
    const pct = this.progress?.percentage || 0;
    const countVisited = Math.round((pct / 100) * total);
    // Charger les IDs visités depuis l'API
    this.courseService.getVisitedSubs(this.course.id).subscribe({
      next: (ids: number[]) => {
        ids.forEach(id => this.visitedSubs.add(id));
      },
      error: () => {
        // Fallback: approximation depuis percentage
        for (let i = 0; i < countVisited && i < allSubs.length; i++) {
          this.visitedSubs.add(allSubs[i].id);
        }
      }
    });
  }

  saveVisitedSubs() {} // No-op, DB est source de vérité


  getChatContext(): ChatContext {
    return {
      course_title: this.course?.title,
      lesson_title: this.activeSubChapter?.title,
      lesson_content: this.activeSubChapter?.content,
    };
  }

  sendChatMessage() {
    const msg = this.chatMessage.trim();
    if (!msg || this.chatLoading) return;
    this.chatMessage = "";
    this.chatLoading = true;
    this.chatMessages.push({ role: "user", content: msg });
    const history = this.chatMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    this.chatService.sendMessage(msg, null, this.getChatContext()).subscribe({
      next: (res: any) => {
        this.chatMessages.push({ role: "assistant", content: res.reply });
        this.chatLoading = false;
      },
      error: () => {
        this.chatMessages.push({ role: "assistant", content: "Erreur de connexion." });
        this.chatLoading = false;
      }
    });
  }

  onRatingChanged(stars: number) {
    console.log("Note mise a jour:", stars);
  }

  // ── Quiz inline methods ──────────────────────────────────────────────────────
  startInlineQuiz() {
    if (!this.activeQuiz) return;
    this.quizService.startAttempt(this.activeQuiz._quiz_id).subscribe({
      next: (attempt) => {
        this.activeQuizAttemptId = attempt.id;
        this.quizService.getQuestions(this.activeQuiz._quiz_id).subscribe({
          next: (questions) => { this.activeQuizQuestions = questions; this.activeQuizStep = 'quiz'; }
        });
      }
    });
  }

  selectInlineOption(questionId: number, optionId: number) {
    this.activeQuizAnswers[questionId] = optionId;
  }

  get inlineAnsweredCount() { return Object.keys(this.activeQuizAnswers).length; }

  submitInlineQuiz() {
    if (this.activeQuizSubmitting || !this.activeQuiz) return;
    this.activeQuizSubmitting = true;
    const answersArray = Object.entries(this.activeQuizAnswers).map(([qId, oId]) => ({
      question_id: +qId, option_id: +oId
    }));
    this.quizService.submitAttempt(this.activeQuiz._quiz_id, this.activeQuizAttemptId!, answersArray).subscribe({
      next: (result) => {
        this.activeQuizResult = result;
        this.activeQuizResult.score = result.percentage ?? Math.round((result.score / result.max_score) * 100);
        this.activeQuizStep = 'result';
        this.activeQuizSubmitting = false;
        if (result.passed) {
          this.quizScores = { ...this.quizScores, [this.activeQuiz._quiz_id]: this.activeQuizResult.score };
          if (!this.visitedSubs.has(this.activeQuiz.id)) this.visitedSubs.add(this.activeQuiz.id);
          const total = this.chapters.reduce((acc: number, ch: any) => acc + (ch.sub_chapters?.length || 0), 0);
          const percentage = total > 0 ? Math.round(this.visitedSubs.size / total * 100) : 0;
          this.courseService.updateProgress(this.course.id, { sub_chapter_id: this.activeQuiz.id, progress: percentage }).subscribe({ error: () => {} });
        }
      },
      error: () => { this.activeQuizSubmitting = false; }
    });
  }

  retryInlineQuiz() {
    this.activeQuizAnswers = {};
    this.activeQuizResult = null;
    this.activeQuizStep = 'intro';
  }

  closeInlineQuiz() {
    this.activeQuiz = null;
    this.activeQuizStep = 'intro';
    this.activeQuizAnswers = {};
    this.activeQuizResult = null;
  }
  get chatContext(): ChatContext {
    return {
      course_title:   this.course?.title,
      lesson_title:   this.activeSubChapter?.title,
      lesson_content: this.activeSubChapter?.content,
    };
  }
  async exportChatPDF() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const title = this.activeSubChapter ? this.activeSubChapter.title : this.course?.title;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Assistant IA — ' + title, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(new Date().toLocaleDateString('fr-FR'), 14, 26);
    doc.line(14, 29, 196, 29);
    let y = 36;
    doc.setTextColor(0);
    for (const m of this.chatMessages) {
      const isUser = m.role === 'user';
      doc.setFont('helvetica', isUser ? 'bold' : 'normal');
      doc.setFontSize(10);
      const prefix = isUser ? 'Vous : ' : 'Assistant : ';
      const lines = doc.splitTextToSize(prefix + m.content, 175);
      if (y + lines.length * 6 > 280) { doc.addPage(); y = 16; }
      doc.setTextColor(isUser ? 60 : 100, isUser ? 60 : 100, isUser ? 200 : 100);
      doc.text(lines, 14, y);
      y += lines.length * 6 + 4;
    }
    doc.save('conversation-assistant.pdf');
  }

  async exportCoursePDF() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ putOnlyUsedFonts: true, compress: true });

    const clean = (s: string) => (s || '')
      .replace(/[\u0080-\uFFFF]/g, c => {
        const map: any = {
          'é':'e','è':'e','ê':'e','ë':'e','à':'a','â':'a','ä':'a',
          'î':'i','ï':'i','ô':'o','ö':'o','ù':'u','û':'u','ü':'u',
          'ç':'c','É':'E','È':'E','Ê':'E','À':'A','Â':'A','Î':'I',
          'Ô':'O','Û':'U','Ù':'U','Ç':'C','œ':'oe','Œ':'OE','æ':'ae'
        };
        return map[c] || '';
      });

    let y = 16;

    // Titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(67, 97, 238);
    doc.text(clean(this.course?.title || 'Cours'), 14, y);
    y += 8;

    // Description
    if (this.course?.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100);
      const desc = doc.splitTextToSize(clean(this.course.description), 175);
      doc.text(desc, 14, y);
      y += desc.length * 5 + 4;
    }

    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 6;

    // Chapitres
    for (const chapter of this.chapters) {
      if (y > 270) { doc.addPage(); y = 16; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(67, 97, 238);
      doc.text('Chapitre : ' + clean(chapter.title), 14, y);
      y += 7;

      for (const sub of (chapter.sub_chapters || []).filter((s:any) => !s.title?.toLowerCase().startsWith('td') && !s.title?.toLowerCase().startsWith('quiz'))) {
        if (y > 270) { doc.addPage(); y = 16; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(40);
        doc.text('  - ' + clean(sub.title), 14, y);
        y += 6;

        if (sub.content) {
          const parser = new DOMParser();
          const dom = parser.parseFromString(sub.content, 'text/html');

          // Images
          const imgs = dom.querySelectorAll('img');
          for (const img of Array.from(imgs)) {
            try {
              const src = img.getAttribute('src') || '';
              if (src) {
                const canvas = document.createElement('canvas');
                const image = new Image();
                image.crossOrigin = 'anonymous';
                await new Promise<void>(resolve => {
                  image.onload = () => {
                    canvas.width = image.width;
                    canvas.height = image.height;
                    canvas.getContext('2d')!.drawImage(image, 0, 0);
                    const ratio = Math.min(160 / image.width, 80 / image.height);
                    const w = image.width * ratio;
                    const h = image.height * ratio;
                    if (y + h > 275) { doc.addPage(); y = 16; }
                    try { doc.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 20, y, w, h); } catch(e) {}
                    y += h + 4;
                    resolve();
                  };
                  image.onerror = () => resolve();
                  image.src = src;
                });
              }
            } catch(e) {}
          }

          // Videos → lien
          const videos = dom.querySelectorAll('video, iframe');
          for (const v of Array.from(videos)) {
            const src = v.getAttribute('src') || v.getAttribute('data-src') || '';
            if (src) {
              if (y > 275) { doc.addPage(); y = 16; }
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(67, 97, 238);
              doc.text('[Video] ' + clean(src.substring(0, 80)), 20, y);
              y += 6;
            }
          }

          // Blocs de code
          const codes = dom.querySelectorAll('pre, code');
          for (const c of Array.from(codes)) {
            const codeText = clean((c.textContent || '').trim());
            if (codeText) {
              const clines = doc.splitTextToSize(codeText, 165);
              const maxC = Math.min(clines.length, 10);
              if (y + maxC * 4 + 6 > 275) { doc.addPage(); y = 16; }
              doc.setFillColor(240, 240, 245);
              doc.rect(18, y - 3, 172, maxC * 4 + 4, 'F');
              doc.setFont('courier', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(30);
              doc.text(clines.slice(0, maxC), 20, y);
              y += maxC * 4 + 6;
            }
          }

          // Texte principal (sans les balises)
          const text = clean(dom.body.innerText.replace(/\s+/g, ' ').trim());
          if (text) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(80);
            const lines = doc.splitTextToSize(text, 168);
            const maxLines = Math.min(lines.length, 10);
            if (y + maxLines * 4.5 > 275) { doc.addPage(); y = 16; }
            doc.text(lines.slice(0, maxLines), 20, y);
            y += maxLines * 4.5 + 3;
            if (lines.length > 10) {
              doc.setTextColor(150);
              doc.text('[...]', 20, y);
              y += 5;
            }
          }
        }
      }
      y += 4;
    }

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Genere le ' + new Date().toLocaleDateString('fr-FR') + ' - Page ' + i + '/' + pageCount, 14, 290);
    }

    doc.save(clean(this.course?.title || 'cours') + '-resume.pdf');
  }


  checkPayment() {
    if (!this.isStudent || !this.course?.price) return;
    this.paymentService.hasPaid(this.course.id).subscribe({
      next: (res) => {
        this.hasPaid = (res.data || []).some((p: any) =>
          p.course_id == this.course.id && p.status === 'paid'
        );
      },
      error: () => {}
    });
  }

  buyAndEnroll() {
    if (this.paymentLoading) return;
    this.paymentLoading = true;
    const user = this.auth.getCurrentUser();
    const price = this.course.price && this.course.price > 0 ? this.course.price : 50;
    this.paymentService.initiatePayment(
      this.course.id,
      price,
      user?.email || 'test@test.com'
    ).subscribe({
      next: (res) => {
        this.paymentLoading = false;
        if (res.payment_url) window.location.href = res.payment_url;
      },
      error: (e) => {
        this.paymentLoading = false;
        alert('Erreur paiement : ' + (e.error?.message || 'Réessayez'));
      }
    });
  }
}
