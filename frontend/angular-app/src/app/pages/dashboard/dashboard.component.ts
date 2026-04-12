import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CourseService } from '../../services/course.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, FormsModule],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">

        <!-- Header -->
        <div class="topbar">
          <div>
            <h1>Bonjour, {{ user?.name }} 👋</h1>
            <p class="sub">{{ today }} — Bienvenue sur votre tableau de bord</p>
          </div>
          <div class="topbar-right">
            <span class="badge-role" [class.admin]="isAdmin">
              {{ isAdmin ? 'Vue administrateur' : isTeacher ? 'Vue formateur' : 'Vue étudiant' }}
            </span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tab-bar">
          <button class="tab" [class.active]="activeTab==='overview'" (click)="activeTab='overview'">Vue générale</button>
          <button *ngIf="!isStudent" class="tab" [class.active]="activeTab==='courses'" (click)="activeTab='courses'">Cours</button>

        </div>

        <!-- ===== TAB: Vue générale ===== -->
        <div *ngIf="activeTab==='overview'">

          <!-- KPI Admin -->
          <div class="kpi-grid" *ngIf="isAdmin">
            <div class="kpi-card blue">
              <div class="kpi-label">Utilisateurs total</div>
              <div class="kpi-value">{{ adminStats?.users?.total_users || 0 }}</div>
              <div class="kpi-delta">{{ adminStats?.users?.students || 0 }} étudiants · {{ adminStats?.users?.teachers || 0 }} formateurs</div>
            </div>
            <div class="kpi-card green">
              <div class="kpi-label">Cours publiés</div>
              <div class="kpi-value">{{ adminStats?.courses?.total_courses || 0 }}</div>
              <div class="kpi-delta delta-up">↑ actifs sur la plateforme</div>
            </div>
            <div class="kpi-card purple">
              <div class="kpi-label">Tentatives quiz</div>
              <div class="kpi-value">{{ adminStats?.quizzes?.total_attempts || 0 }}</div>
              <div class="kpi-delta">Taux réussite : {{ adminStats?.quizzes?.pass_rate || 0 }}%</div>
            </div>
            <div class="kpi-card amber">
              <div class="kpi-label">Quiz complétés</div>
              <div class="kpi-value">{{ adminStats?.quizzes?.completed || 0 }}</div>
              <div class="kpi-delta">sur toutes les tentatives</div>
            </div>
          </div>

          <!-- KPI Étudiant / Formateur -->
          <div class="kpi-grid" *ngIf="!isAdmin">
            <div class="kpi-card blue">
              <div class="kpi-label">{{ isStudent ? 'Mes cours' : 'Cours créés' }}</div>
              <div class="kpi-value">{{ stats.courses }}</div>
            </div>
            <div class="kpi-card green">
              <div class="kpi-label">Complétés</div>
              <div class="kpi-value">{{ stats.completed }}</div>
            </div>
            <div class="kpi-card purple">
              <div class="kpi-label">{{ isStudent ? 'Score moyen' : 'Taux complétion' }}</div>
              <div class="kpi-value">{{ isStudent ? stats.score : stats.completion }}%</div>
            </div>
            <div class="kpi-card amber">
              <div class="kpi-label">En cours</div>
              <div class="kpi-value">{{ stats.courses - stats.completed }}</div>
            </div>
          </div>

          <!-- Cours récents -->
          <div class="section" *ngIf="recentCourses.length > 0">
            <div class="section-header">
              <h2>📚 Mes cours</h2>
              <a routerLink="/my-courses" class="see-all">Voir tout →</a>
            </div>
            <div class="course-grid">
              <div class="course-card" *ngFor="let course of recentCourses" [routerLink]="['/courses', course.id]">
                <div class="course-img">
                  <img *ngIf="course.image_path" [src]="course.image_path" alt="{{ course.title }}" class="course-img-photo">
                  <span *ngIf="!course.image_path">📘</span>
                  <div class="course-badge" *ngIf="course.progress === 100">✅</div>
                </div>
                <div class="course-info">
                  <h3>{{ course.title }}</h3>
                  <div class="progress-wrap">
                    <div class="progress-bar">
                      <div class="progress-fill"
                        [style.width]="(course.progress || 0) + '%'"
                        [class.done]="course.progress === 100"
                        [class.mid]="course.progress >= 50 && course.progress < 100"
                        [class.low]="course.progress < 50"></div>
                    </div>
                    <span class="prog-label">{{ course.progress || 0 }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Certificats & Forum (2 colonnes) -->
          <div class="two-cols" *ngIf="isStudent">

            <!-- Certificats -->
            <div class="panel">
              <div class="section-header">
                <h2>🏆 Mes certificats</h2>
                <a routerLink="/certificates" class="see-all">Voir tout →</a>
              </div>
              <div class="cert-empty" *ngIf="certificates.length === 0">
                <div>🎓</div>
                <p>Complétez un cours pour obtenir votre certificat !</p>
              </div>
              <div class="cert-list" *ngIf="certificates.length > 0">
                <div class="cert-item" *ngFor="let cert of certificates | slice:0:3">
                  <div class="cert-icon">🏆</div>
                  <div class="cert-body">
                    <div class="cert-title">{{ cert.course_title || cert.title }}</div>
                    <div class="cert-date">{{ cert.issued_at | date:'dd/MM/yyyy' }}</div>
                  </div>
                  <a [routerLink]="['/courses', cert.course_id, 'certificate']" class="cert-link">Voir →</a>
                </div>
              </div>
            </div>

            <!-- Forum récent -->
            <div class="panel">
              <div class="section-header">
                <h2>💬 Forum récent</h2>
              </div>
              <div class="cert-empty" *ngIf="forumPosts.length === 0">
                <div>💬</div>
                <p>Aucune discussion récente</p>
              </div>
              <div class="forum-list" *ngIf="forumPosts.length > 0">
                <div class="forum-item" *ngFor="let post of forumPosts">
                  <div class="forum-avatar">{{ getInitials(post.user_name) }}</div>
                  <div class="forum-body">
                    <div class="forum-title">{{ post.title }}</div>
                    <div class="forum-meta">{{ post.reply_count }} réponse(s) · {{ post.user_name }}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div class="empty" *ngIf="recentCourses.length === 0">
            Aucun cours pour l'instant. <a routerLink="/courses">Parcourir les cours</a>
          </div>
        </div>

        <!-- ===== TAB: Cours ===== -->
        <div *ngIf="activeTab==='courses'">
          <div class="tables-row">
            <!-- La ligne suivante a été modifiée : ajout de *ngIf="!isStudent" -->
            <div class="card" *ngIf="!isStudent">
              <div class="card-title">Top cours par inscriptions</div>
              <table class="data-table">
                <thead><tr><th>#</th><th>Cours</th><th>Inscrits</th><th>Complétion</th></tr></thead>
                <tbody>
                  <tr *ngFor="let c of recentCourses; let i = index" [routerLink]="['/courses', c.id]" class="clickable">
                    <td><span class="rank" [class]="getRankClass(i)">{{ i+1 }}</span></td>
                    <td class="course-title-cell">{{ c.title }}</td>
                    <td><strong>{{ c.enrollments ?? '—' }}</strong></td>
                    <td>
                      <div class="mini-bar">
                        <div class="mini-fill" [class.high]="(c.progress ?? 0)>=70" [class.mid]="(c.progress ?? 0)>=40&&(c.progress ?? 0)<70" [class.low]="(c.progress ?? 0)<40" [style.width]="(c.progress ?? 0)+'%'"></div>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="recentCourses.length===0"><td colspan="4" class="empty-row">Aucun cours</td></tr>
                </tbody>
              </table>
            </div>
            <!-- Optionnel : afficher un message si l'étudiant n'a rien -->
            <div *ngIf="isStudent" class="empty">
              📘 Consultez vos cours dans l'onglet "Vue générale"
            </div>
          </div>
        </div>



      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    .main { margin-left:260px; flex:1; padding:2rem; background:#f8f9fa; }
    .topbar { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; }
    .topbar h1 { font-size:1.6rem; color:#1E3A5F; margin:0 0 .2rem; }
    .sub { color:#64748b; font-size:.85rem; margin:0; }
    .topbar-right { display:flex; gap:.5rem; align-items:center; }
    .badge-role { padding:.3rem .85rem; border-radius:20px; font-size:.75rem; font-weight:600; background:#e0eaff; color:#1E3A5F; }
    .badge-role.admin { background:#fef3c7; color:#92400e; }
    .tab-bar { display:flex; gap:4px; border-bottom:1px solid #e2e8f0; margin-bottom:1.5rem; }
    .tab { background:none; border:none; border-bottom:2px solid transparent; padding:.5rem 1rem; font-size:.85rem; cursor:pointer; color:#64748b; margin-bottom:-1px; transition:all .15s; }
    .tab.active { color:#1E3A5F; border-bottom-color:#4A90D9; font-weight:600; }
    .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
    .kpi-card { background:white; border-radius:12px; padding:1.25rem; border-top:3px solid; box-shadow:0 2px 8px rgba(0,0,0,.05); }
    .kpi-card.blue{border-top-color:#4A90D9} .kpi-card.green{border-top-color:#10b981}
    .kpi-card.purple{border-top-color:#7c3aed} .kpi-card.amber{border-top-color:#f59e0b}
    .kpi-label { font-size:.78rem; color:#64748b; margin-bottom:.3rem; }
    .kpi-value { font-size:2rem; font-weight:700; color:#1E3A5F; line-height:1; }
    .kpi-delta { font-size:.75rem; color:#64748b; margin-top:.3rem; }
    .delta-up { color:#10b981; }
    .section h2 { color:#1E3A5F; font-size:1.1rem; margin-bottom:1rem; }
    .course-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1rem; }
    .course-card { background:white; border-radius:12px; overflow:hidden; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.06); transition:transform .2s; }
    .course-card:hover { transform:translateY(-2px); }
    .course-img { height:90px; background:linear-gradient(135deg,#1E3A5F,#4A90D9); display:flex; align-items:center; justify-content:center; font-size:2.5rem; overflow:hidden; }
    .course-img-photo { width:100%; height:100%; object-fit:cover; }
    .course-info { padding:.9rem; }
    .course-info h3 { margin:0 0 .4rem; color:#1E3A5F; font-size:.95rem; }
    .course-info p { color:#64748b; font-size:.8rem; margin:0 0 .6rem; }
    .progress-bar { height:5px; background:#e2e8f0; border-radius:3px; }
    .progress-fill { height:100%; background:#4A90D9; border-radius:3px; }
    .prog-label { font-size:.72rem; color:#94a3b8; margin-top:.3rem; }
    .empty { text-align:center; color:#64748b; padding:3rem; }
    .empty a { color:#1E3A5F; }
    /* Tables */
    .tables-row { display:grid; gap:1rem; }
    .card { background:white; border-radius:12px; padding:1.25rem; box-shadow:0 2px 8px rgba(0,0,0,.05); }
    .card-title { font-size:.95rem; font-weight:700; color:#1E3A5F; margin-bottom:1rem; }
    .data-table { width:100%; border-collapse:collapse; font-size:.82rem; }
    .data-table th { text-align:left; padding:.4rem .6rem; font-size:.72rem; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; border-bottom:1px solid #f1f5f9; }
    .data-table td { padding:.6rem .6rem; border-bottom:1px solid #f8fafc; color:#374151; }
    .data-table tr.clickable { cursor:pointer; } .data-table tr.clickable:hover { background:#f8fafc; }
    .course-title-cell { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; }
    .rank { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; font-weight:700; font-size:.75rem; }
    .rank.gold{background:#fef3c7;color:#92400e} .rank.silver{background:#f1f5f9;color:#475569}
    .rank.bronze{background:#fff7ed;color:#9a3412} .rank.other{background:#f1f5f9;color:#64748b}
    .mini-bar { height:5px; background:#e2e8f0; border-radius:3px; width:80px; }
    .mini-fill { height:100%; border-radius:3px; }
    .mini-fill.high{background:#10b981} .mini-fill.mid{background:#f59e0b} .mini-fill.low{background:#ef4444}
    .empty-row { text-align:center; color:#94a3b8; padding:1.5rem; }
    .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; }
    .section-header h2 { margin:0; color:#1E3A5F; font-size:1rem; font-weight:700; }
    .see-all { font-size:.8rem; color:#4361ee; text-decoration:none; font-weight:600; }
    .see-all:hover { text-decoration:underline; }
    .course-badge { position:absolute; top:6px; right:6px; font-size:1.2rem; }
    .course-img { position:relative; }
    .progress-wrap { display:flex; align-items:center; gap:.5rem; margin-top:.5rem; }
    .progress-fill.done { background:#22c55e; }
    .progress-fill.mid { background:#f59e0b; }
    .progress-fill.low { background:#4A90D9; }
    .two-cols { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:1.5rem; }
    .panel { background:white; border-radius:12px; padding:1.25rem; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .cert-empty { text-align:center; padding:1.5rem; color:#94a3b8; }
    .cert-empty div { font-size:2rem; margin-bottom:.5rem; }
    .cert-empty p { font-size:.82rem; margin:0; }
    .cert-list { display:flex; flex-direction:column; gap:.75rem; }
    .cert-item { display:flex; align-items:center; gap:.75rem; padding:.6rem; border-radius:8px; background:#f8faff; }
    .cert-icon { font-size:1.5rem; flex-shrink:0; }
    .cert-body { flex:1; min-width:0; }
    .cert-title { font-size:.85rem; font-weight:600; color:#1a2340; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cert-date { font-size:.72rem; color:#94a3b8; }
    .cert-link { font-size:.75rem; color:#4361ee; text-decoration:none; font-weight:600; white-space:nowrap; }
    .forum-list { display:flex; flex-direction:column; gap:.75rem; }
    .forum-item { display:flex; align-items:flex-start; gap:.75rem; padding:.6rem; border-radius:8px; background:#f8faff; }
    .forum-avatar { width:32px; height:32px; border-radius:50%; background:#1E3A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:.68rem; font-weight:700; flex-shrink:0; }
    .forum-body { flex:1; min-width:0; }
    .forum-title { font-size:.85rem; font-weight:600; color:#1a2340; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .forum-meta { font-size:.72rem; color:#94a3b8; margin-top:.15rem; }
  `]
})
export class DashboardComponent implements OnInit {
  user: any;
  recentCourses: any[] = [];
  stats = { courses: 0, completed: 0, score: 0, completion: 0 };
  certificates: any[] = [];
  forumPosts: any[] = [];
  streakDays = 0;
  adminStats: any = null;
  activeTab = 'overview';
  today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  get isStudent() { return this.auth.isStudent(); }
  get isTeacher() { return this.auth.isTeacher(); }
  get isAdmin()   { return this.auth.isAdmin(); }
  get userPrefix(){ return `${this.user?.role || 'user'}@eduplatform`; }

  constructor(
    private auth: AuthService,
    private courseService: CourseService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.user = this.auth.getCurrentUser();
    this.loadData();
  }

  loadData() {
    if (this.isAdmin) {
      this.http.get('/api/admin/stats').subscribe({
        next: (s: any) => { this.adminStats = s; this.stats.courses = s.courses?.total || 0; },
        error: () => {}
      });
      this.courseService.getCourses().subscribe({
        next: (courses) => { this.recentCourses = courses.slice(0, 6); },
        error: () => {}
      });
    } else if (this.isStudent) {
      this.courseService.myCourses().subscribe({
        next: (enrollments) => {
          this.stats.courses = enrollments.length;
          this.recentCourses = enrollments.slice(0, 6).map((e: any) => ({
            ...e.course, progress: parseFloat(e.progress || 0)
          }));
          this.stats.completed = enrollments.filter((e: any) => parseFloat(e.progress) === 100).length;
        },
        error: () => {}
      });
      // Certificats
      this.courseService.getMyCertificates().subscribe({
        next: (certs) => { this.certificates = certs; },
        error: () => {}
      });
      // Forum posts récents
      this.courseService.myCourses().subscribe({
        next: (enrollments) => {
          const courseIds = enrollments.map((e: any) => e.course?.id || e.course_id).filter(Boolean);
          if (courseIds.length > 0) {
            this.http.get<any[]>(`/api/forum/courses/${courseIds[0]}/posts`).subscribe({
              next: (posts) => { this.forumPosts = posts.slice(0, 3); },
              error: () => {}
            });
          }
        },
        error: () => {}
      });
      this.http.get<any[]>('/api/attempts/mine').subscribe({
        next: (attempts) => {
          if (attempts.length > 0) {
            const best: Record<number, number> = {};
            for (const a of attempts) {
              const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0;
              if (!best[a.quiz_id] || pct > best[a.quiz_id]) best[a.quiz_id] = pct;
            }
            const scores = Object.values(best);
            this.stats.score = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
          }
        },
        error: () => {}
      });
    } else {
      this.courseService.getCourses().subscribe({
        next: (courses) => {
          const myId = this.user?.auth_id || this.user?.id;
          const myCourses = courses.filter((c: any) => c.instructor_id === myId).slice(0, 6);
          // Enrichir avec les stats analytics
          this.http.get<any>('/api/analytics/teacher').subscribe({
            next: (analytics: any) => {
              const topMap: any = {};
              (analytics.top_courses || []).forEach((tc: any) => { topMap[tc.id] = tc; });
              const compMap: any = {};
              (analytics.completion_by_course || []).forEach((cc: any) => { compMap[cc.course_id] = cc; });
              this.recentCourses = myCourses.map((c: any) => ({
                ...c,
                enrollments: topMap[c.id]?.enrollments ?? 0,
                progress: compMap[c.id]?.completion_rate ?? 0
              }));
              this.stats.courses = this.recentCourses.length;
              this.stats.completion = analytics.summary?.completion_rate ?? 0;
              this.stats.completed = (analytics.summary?.completed ?? 0);
            },
            error: (e) => {
              this.recentCourses = myCourses;
              this.stats.courses = myCourses.length;
            }
          });
        },
        error: () => {}
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRankClass(i: number): string {
    return ['gold','silver','bronze'][i] ?? 'other';
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
