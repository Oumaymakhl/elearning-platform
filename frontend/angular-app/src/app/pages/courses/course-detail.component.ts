import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
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

  constructor(private route: ActivatedRoute, private courseService: CourseService, private auth: AuthService, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.courseService.getCourse(id).subscribe({
      next: (course) => {
        this.course = course;
        this.chapters = (course.chapters || []).map((c: any) => ({ ...c, expanded: false, sub_chapters: c.sub_chapters || c.subChapters || [] }));
      }
    });
    if (this.isStudent) {
      this.courseService.getProgress(id).subscribe({
        next: (p) => { this.progress = { ...p, percentage: parseFloat(p.progress || 0) }; this.enrolled = true; setTimeout(() => this.loadQuizScores(), 100); },
        error: () => {}
      });
    }
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

  loadQuizScores() {
    // Charger les scores de tous les quiz liés aux sous-chapitres
    for (const chapter of this.chapters) {
      for (const sub of chapter.sub_chapters || []) {
        if (sub.quiz_id) {
          this.http.get<any[]>(`http://localhost:8005/api/quizzes/${sub.quiz_id}/attempts/mine`).subscribe({
            next: (attempts) => {
              if (attempts.length > 0) {
                const best = Math.max(...attempts.map((a: any) => {
                  const maxScore = a.max_score || 1;
                  return Math.round((a.score / maxScore) * 100);
                }));
                this.quizScores = { ...this.quizScores, [sub.quiz_id]: best };
              }
            },
            error: () => {}
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

  isUnlocked(sub: any, index: number, allSubs: any[]): boolean {
    if (!this.isStudent) return true;
    if (!this.enrolled) return false;
    if (index === 0) return true;
    const prev = allSubs[index - 1];
    if (!prev.quiz_id) return true;
    const score = this.quizScores[prev.quiz_id];
    if (score === undefined) return false; // Pas encore tenté
    return score >= (prev.passing_score || 70);
  }

  openSubChapter(sub: any, index: number, allSubs: any[]) {
    if (!this.isUnlocked(sub, index, allSubs)) {
      alert('Vous devez obtenir au moins ' + (allSubs[index-1].passing_score || 70) + '% au quiz précédent pour débloquer ce chapitre.');
      return;
    }
    // Mettre à jour la progression
    const total = this.chapters.reduce((acc: number, ch: any) => acc + (ch.sub_chapters?.length || 0), 0);
    const completed = index + 1;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.courseService.updateProgress(this.course.id, { sub_chapter_id: sub.id, progress: percentage }).subscribe({
      next: () => { if (this.progress) this.progress.percentage = percentage; },
      error: () => {}
    });
    if (sub.is_lab && sub.exercise_id) {
      this.router.navigate(['/exercise', sub.exercise_id]);
    } else if (sub.quiz_id) {
      this.router.navigate(['/quiz', sub.quiz_id]);
    } else {
      // Afficher le contenu inline
      this.activeSubChapter = this.activeSubChapter?.id === sub.id ? null : sub;
      // Sauvegarder progression
      this.courseService.updateProgress(this.course.id, { sub_chapter_id: sub.id }).subscribe({
        next: (r: any) => { if (this.progress) this.progress.percentage = r.progress; },
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
}
