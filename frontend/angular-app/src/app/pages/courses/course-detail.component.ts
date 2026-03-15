import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { LessonContentComponent } from '../../shared/lesson-content/lesson-content.component';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink, LessonContentComponent],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {
  course: any;
  chapters: any[] = [];
  enrolled = false;
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

  constructor(private route: ActivatedRoute, private courseService: CourseService, private auth: AuthService, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    // 1. Charger le cours
    this.courseService.getCourse(id).subscribe({
      next: (course) => {
        this.course = course;
        this.chapters = (course.chapters || []).map((c: any) => ({ ...c, expanded: false, sub_chapters: c.sub_chapters || c.subChapters || [] }));
        // 2. Charger la progression APRES le cours
        if (this.isStudent) {
          this.courseService.getProgress(id).subscribe({
            next: (p) => {
              this.progress = { ...p, percentage: parseFloat(p.progress || 0) };
              this.enrolled = true;
              // Vider localStorage si progression = 0
              if (parseFloat(p.progress || 0) === 0 && typeof localStorage !== "undefined") {
                localStorage.removeItem("visited_" + id + "_" + (this.auth.getCurrentUser()?.id || 0));
              }
              this.visitedSubs.clear();
              this.loadQuizScores();
              // Charger visited-subs puis ouvrir sous-chapitre
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
                error: () => {
                  this.resumeProgress();
                }
              });
            },
            error: () => {}
          });
        }
      }
    });
  }

  deleteCourse() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;
    this.courseService.deleteCourse(this.course.id).subscribe({
      next: () => { this.router.navigate(['/courses']); },
      error: (e) => { alert('Erreur : ' + (e.error?.message || 'Suppression échouée')); }
    });
  }

  quizScores: Record<number, number> = {};
  activeSubChapter: any = null;
  chaptersCollapsed = false;
  visitedSubs: Set<number> = new Set();
  activeSubIndex: number = -1;
  allSubChapters: any[] = []; // liste plate de tous les sous-chapitres

  loadQuizScores() {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    // Charger scores quiz des chapitres ET sous-chapitres
    for (const chapter of this.chapters) {
      // Quiz du chapitre lui-même
      if (chapter.quiz_id) {
        this.http.get<any[]>(`http://localhost:8005/api/quizzes/${chapter.quiz_id}/attempts/mine`, { headers }).subscribe({
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
          this.http.get<any[]>(`http://localhost:8005/api/quizzes/${sub.quiz_id}/attempts/mine`, { headers }).subscribe({
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
      this.courseService.updateProgress(this.course.id, { sub_chapter_id: lastUnlockedSub.id }).subscribe({
        next: (r: any) => { if (this.progress) this.progress.percentage = r.progress; },
        error: () => {}
      });
    }
  }

  // Vérifie si un chapitre entier est débloqué (basé sur le quiz du chapitre précédent)
  isChapterUnlocked(chapterIndex: number): boolean {
    if (!this.isStudent) return true;
    if (!this.enrolled) return false;
    if (chapterIndex === 0) return true;
    const prevChapter = this.chapters[chapterIndex - 1];
    if (!prevChapter.quiz_id) return true;
    const score = this.quizScores[prevChapter.quiz_id];
    if (score === undefined) return false;
    return score >= (prevChapter.passing_score || 70);
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
      this.courseService.updateProgress(this.course.id, { sub_chapter_id: sub.id, progress: percentage }).subscribe({
        next: (r: any) => { if (this.progress) { this.progress.percentage = percentage; this.progress.current_sub_chapter_id = sub.id; } },
        error: () => {}
      });
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
    this.courseService.updateProgress(this.course.id, { sub_chapter_id: sub.id, progress: percentage }).subscribe({
      next: (r: any) => {
        if (this.progress) {
          this.progress.percentage = percentage;
          this.progress.current_sub_chapter_id = sub.id;
        }
      },
      error: () => {}
    });
    if (sub.is_lab && sub.exercise_id) {
      this.router.navigate(['/exercise', sub.exercise_id]);
    } else if (sub.quiz_id) {
      const allSubs = this.getAllSubs();
      const subIdx = allSubs.findIndex((s: any) => s.id === sub.id);
      this.router.navigate(['/quiz', sub.quiz_id], { queryParams: { course_id: this.course.id, sub_id: sub.id, sub_index: subIdx } });
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
    this.http.post<any>('http://localhost:8004/api/execute',
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

}
