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
          <button *ngIf="!isStudent" class="tab" [class.active]="activeTab==='terminal'" (click)="activeTab='terminal'">Terminal cat</button>
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
              <div class="kpi-label">Score moyen</div>
              <div class="kpi-value">{{ stats.score }}%</div>
            </div>
            <div class="kpi-card amber">
              <div class="kpi-label">En cours</div>
              <div class="kpi-value">{{ stats.courses - stats.completed }}</div>
            </div>
          </div>

          <!-- Cours récents -->
          <div class="section" *ngIf="recentCourses.length > 0">
            <h2>Cours récents</h2>
            <div class="course-grid">
              <div class="course-card" *ngFor="let course of recentCourses" [routerLink]="['/courses', course.id]">
                <div class="course-img">
                  <img *ngIf="course.image_path" [src]="course.image_path" alt="{{ course.title }}" class="course-img-photo">
                  <span *ngIf="!course.image_path">📘</span>
                </div>
                <div class="course-info">
                  <h3>{{ course.title }}</h3>
                  <p>{{ course.description | slice:0:80 }}...</p>
                  <div class="progress-bar" *ngIf="isStudent">
                    <div class="progress-fill" [style.width]="(course.progress || 0) + '%'"></div>
                  </div>
                  <div class="prog-label" *ngIf="isStudent">{{ course.progress || 0 }}% complété</div>
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
                    <td><strong>{{ c.enrollments || '—' }}</strong></td>
                    <td>
                      <div class="mini-bar">
                        <div class="mini-fill" [class.high]="(c.progress||0)>=70" [class.mid]="(c.progress||0)>=40&&(c.progress||0)<70" [class.low]="(c.progress||0)<40" [style.width]="(c.progress||0)+'%'"></div>
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

        <!-- ===== TAB: Terminal cat ===== -->
        <div *ngIf="activeTab==='terminal'">
          <div class="terminal">
            <div class="term-header">
              <div class="term-dot r"></div>
              <div class="term-dot y"></div>
              <div class="term-dot g"></div>
              <span class="term-title">eduplatform — bash — 80x24</span>
            </div>
            <div class="term-body" #termBody>
              <div class="term-history" [innerHTML]="terminalOutput"></div>
              <div class="term-input-line">
                <span class="prompt">{{ userPrefix }}:~$</span>
                <input
                  class="term-input"
                  [(ngModel)]="termCmd"
                  (keydown.enter)="runCmd()"
                  placeholder="cat /api/admin/stats"
                  autocomplete="off"
                  spellcheck="false"
                />
              </div>
            </div>
          </div>
          <div class="cmd-shortcuts">
            <button *ngFor="let s of shortcuts" (click)="insertShortcut(s.cmd)">{{ s.label }}</button>
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
    /* Terminal */
    .terminal { background:#0d1117; border-radius:12px; border:1px solid #30363d; overflow:hidden; margin-bottom:1rem; }
    .term-header { background:#161b22; padding:.5rem 1rem; display:flex; align-items:center; gap:6px; border-bottom:1px solid #30363d; }
    .term-dot { width:10px; height:10px; border-radius:50%; }
    .term-dot.r{background:#ff5f57} .term-dot.y{background:#ffbd2e} .term-dot.g{background:#28ca42}
    .term-title { font-size:.72rem; color:#8b949e; margin-left:4px; font-family:monospace; }
    .term-body { padding:1rem 1.25rem; font-family:'Courier New',monospace; font-size:.8rem; line-height:1.7; max-height:400px; overflow-y:auto; }
    .term-history { white-space:pre-wrap; word-break:break-all; }
    .term-input-line { display:flex; align-items:center; gap:.5rem; margin-top:.25rem; }
    .prompt { color:#4A90D9; white-space:nowrap; }
    .term-input { flex:1; background:transparent; border:none; outline:none; color:#e6edf3; font-family:'Courier New',monospace; font-size:.8rem; caret-color:#4A90D9; }
    .cmd-shortcuts { display:flex; gap:.5rem; flex-wrap:wrap; }
    .cmd-shortcuts button { font-family:monospace; font-size:.75rem; padding:.3rem .7rem; background:#1E3A5F; color:white; border:none; border-radius:6px; cursor:pointer; }
    .cmd-shortcuts button:hover { background:#4A90D9; }
  `]
})
export class DashboardComponent implements OnInit {
  user: any;
  recentCourses: any[] = [];
  stats = { courses: 0, completed: 0, score: 0 };
  adminStats: any = null;
  activeTab = 'overview';
  today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Terminal
  termCmd = '';
  terminalOutput = '';

  shortcuts = [
    { label: 'cat /api/admin/stats',       cmd: 'cat /api/admin/stats' },
    { label: 'cat /api/admin/users',       cmd: 'cat /api/admin/users' },
    { label: 'cat /api/analytics/teacher', cmd: 'cat /api/analytics/teacher' },
    { label: 'cat /api/quiz-stats',        cmd: 'cat /api/quiz-stats' },
    { label: 'cat /api/attempts/mine',     cmd: 'cat /api/attempts/mine' },
    { label: 'ls',                         cmd: 'ls' },
    { label: 'help',                       cmd: 'help' },
  ];

  private catRoutes: Record<string, () => void> = {
    '/api/admin/stats':        () => this.catAdminStats(),
    '/api/admin/users':        () => this.catAdminUsers(),
    '/api/analytics/teacher':  () => this.catAnalytics(),
    '/api/quiz-stats':         () => this.catQuizStats(),
    '/api/attempts/mine':      () => this.catAttempts(),
  };

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
    this.appendTermLine(`<span style="color:#7ee787">EduPlatform Terminal v1.0</span> — Tapez <span style="color:#79c0ff">help</span> pour voir les commandes\n`);
  }

  loadData() {
    if (this.isAdmin) {
      this.http.get('http://localhost:8001/api/admin/stats').subscribe({
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
      this.http.get<any[]>('http://localhost:8005/api/attempts/mine').subscribe({
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
          this.recentCourses = courses.filter((c: any) => c.instructor_id === this.user?.id).slice(0, 6);
          this.stats.courses = this.recentCourses.length;
        },
        error: () => {}
      });
    }
  }

  getRankClass(i: number): string {
    return ['gold','silver','bronze'][i] ?? 'other';
  }

  // ---- Terminal ----

  insertShortcut(cmd: string) { this.termCmd = cmd; }

  runCmd() {
    const raw = this.termCmd.trim();
    if (!raw) return;
    this.appendTermLine(`<span style="color:#4A90D9">${this.userPrefix}:~$</span> <span style="color:#79c0ff">${raw}</span>\n`);
    const parts = raw.split(/\s+/);
    const cmd = parts[0];
    const arg = parts[1] || '';

    if (cmd === 'cat') {
      const route = this.catRoutes[arg];
      if (route) { route(); }
      else {
        this.appendTermLine(`<span style="color:#ff7b72">bash: cat: ${arg}: No such endpoint. Tapez help.</span>\n\n`);
      }
    } else if (cmd === 'ls') {
      this.appendTermLine(`<span style="color:#a5d6ff">admin/  analytics/  attempts/  courses/  quiz-stats  users/</span>\n\n`);
    } else if (cmd === 'help') {
      this.appendTermLine(
        `<span style="color:#d2a8ff">Commandes disponibles:</span>\n` +
        `  <span style="color:#79c0ff">cat /api/admin/stats</span>        — statistiques globales\n` +
        `  <span style="color:#79c0ff">cat /api/admin/users</span>        — liste des utilisateurs\n` +
        `  <span style="color:#79c0ff">cat /api/analytics/teacher</span>  — analytics formateur\n` +
        `  <span style="color:#79c0ff">cat /api/quiz-stats</span>         — stats quizzes\n` +
        `  <span style="color:#79c0ff">cat /api/attempts/mine</span>      — tentatives quiz\n` +
        `  <span style="color:#79c0ff">ls</span>                          — endpoints disponibles\n` +
        `  <span style="color:#79c0ff">clear</span>                       — vider le terminal\n\n`
      );
    } else if (cmd === 'clear') {
      this.terminalOutput = '';
    } else {
      this.appendTermLine(`<span style="color:#ff7b72">bash: ${cmd}: command not found. Tapez <span style="color:#79c0ff">help</span>.</span>\n\n`);
    }
    this.termCmd = '';
  }

  private appendTermLine(html: string) {
    this.terminalOutput += html;
  }

  private catAdminStats() {
    this.http.get('http://localhost:8001/api/admin/stats').subscribe({
      next: (s: any) => {
        this.appendTermLine(
          `<span style="color:#8b949e">{</span>\n` +
          `  <span style="color:#7ee787">"users"</span>: {\n` +
          `    <span style="color:#7ee787">"total_users"</span>: <span style="color:#ff7b72">${s.users?.total_users ?? 0}</span>,\n` +
          `    <span style="color:#7ee787">"students"</span>: <span style="color:#ff7b72">${s.users?.students ?? 0}</span>,\n` +
          `    <span style="color:#7ee787">"teachers"</span>: <span style="color:#ff7b72">${s.users?.teachers ?? 0}</span>\n` +
          `  },\n` +
          `  <span style="color:#7ee787">"courses"</span>: { <span style="color:#7ee787">"total_courses"</span>: <span style="color:#ff7b72">${s.courses?.total_courses ?? 0}</span> },\n` +
          `  <span style="color:#7ee787">"quizzes"</span>: {\n` +
          `    <span style="color:#7ee787">"total_attempts"</span>: <span style="color:#ff7b72">${s.quizzes?.total_attempts ?? 0}</span>,\n` +
          `    <span style="color:#7ee787">"pass_rate"</span>: <span style="color:#ff7b72">${s.quizzes?.pass_rate ?? 0}</span>\n` +
          `  }\n` +
          `<span style="color:#8b949e">}</span>\n\n`
        );
      },
      error: (e) => this.appendTermLine(`<span style="color:#ff7b72">Erreur HTTP ${e.status}: ${e.message}</span>\n\n`)
    });
  }

  private catAdminUsers() {
    this.http.get<any>('http://localhost:8001/api/admin/users').subscribe({
      next: (res: any) => {
        const users: any[] = res.data || res;
        let out = `<span style="color:#d2a8ff">ID   NOM                  EMAIL                        RÔLE</span>\n`;
        out += `<span style="color:#8b949e">${'─'.repeat(65)}</span>\n`;
        for (const u of users.slice(0, 8)) {
          const name  = (u.name  || '').padEnd(20).slice(0,20);
          const email = (u.email || '').padEnd(28).slice(0,28);
          out += `<span style="color:#ff7b72">${String(u.id).padEnd(4)}</span> <span style="color:#a5d6ff">${name}</span> <span style="color:#a5d6ff">${email}</span> <span style="color:#7ee787">${u.role}</span>\n`;
        }
        if (users.length > 8) out += `<span style="color:#8b949e">... ${users.length - 8} autres entrées</span>\n`;
        this.appendTermLine(out + '\n');
      },
      error: (e) => this.appendTermLine(`<span style="color:#ff7b72">Erreur HTTP ${e.status}: ${e.message}</span>\n\n`)
    });
  }

  private catAnalytics() {
    this.http.get<any>('http://localhost:8002/api/analytics/teacher').subscribe({
      next: (data: any) => {
        const s = data.summary || {};
        this.appendTermLine(
          `<span style="color:#8b949e">{</span>\n` +
          `  <span style="color:#7ee787">"summary"</span>: {\n` +
          `    <span style="color:#7ee787">"total_courses"</span>: <span style="color:#ff7b72">${s.total_courses ?? 0}</span>,\n` +
          `    <span style="color:#7ee787">"total_enrollments"</span>: <span style="color:#ff7b72">${s.total_enrollments ?? 0}</span>,\n` +
          `    <span style="color:#7ee787">"completion_rate"</span>: <span style="color:#ff7b72">${s.completion_rate ?? 0}</span>,\n` +
          `    <span style="color:#7ee787">"active_students"</span>: <span style="color:#ff7b72">${s.active_students ?? 0}</span>,\n` +
          `    <span style="color:#7ee787">"avg_progress"</span>: <span style="color:#ff7b72">${s.avg_progress ?? 0}</span>,\n` +
          `    <span style="color:#7ee787">"completed"</span>: <span style="color:#ff7b72">${s.completed ?? 0}</span>\n` +
          `  }\n` +
          `<span style="color:#8b949e">}</span>\n\n`
        );
      },
      error: (e) => this.appendTermLine(`<span style="color:#ff7b72">Erreur HTTP ${e.status}: ${e.message}</span>\n\n`)
    });
  }

  private catQuizStats() {
    this.http.get<any>('http://localhost:8005/api/quiz-stats').subscribe({
      next: (data: any) => {
        this.appendTermLine(
          `<span style="color:#8b949e">{</span>\n` +
          `  <span style="color:#7ee787">"total_quizzes"</span>: <span style="color:#ff7b72">${data.total_quizzes ?? 0}</span>,\n` +
          `  <span style="color:#7ee787">"total_attempts"</span>: <span style="color:#ff7b72">${data.total_attempts ?? 0}</span>,\n` +
          `  <span style="color:#7ee787">"completed"</span>: <span style="color:#ff7b72">${data.completed ?? 0}</span>,\n` +
          `  <span style="color:#7ee787">"pass_rate"</span>: <span style="color:#ff7b72">${data.pass_rate ?? 0}</span>\n` +
          `<span style="color:#8b949e">}</span>\n\n`
        );
      },
      error: (e) => this.appendTermLine(`<span style="color:#ff7b72">Erreur HTTP ${e.status}: ${e.message}</span>\n\n`)
    });
  }

  private catAttempts() {
    this.http.get<any[]>('http://localhost:8005/api/attempts/mine').subscribe({
      next: (attempts: any[]) => {
        let out = `<span style="color:#8b949e">[  /* ${attempts.length} tentatives */</span>\n`;
        for (const a of attempts.slice(0, 5)) {
          const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0;
          const passed = pct >= 50;
          out += `  { <span style="color:#7ee787">"quiz_id"</span>: <span style="color:#ff7b72">${a.quiz_id}</span>, <span style="color:#7ee787">"score"</span>: <span style="color:#ff7b72">${a.score}/${a.max_score}</span>, <span style="color:#7ee787">"pct"</span>: <span style="color:#ff7b72">${pct}%</span>, <span style="color:#7ee787">"passed"</span>: <span style="color:${passed ? '#7ee787' : '#ff7b72'}">${passed}</span> },\n`;
        }
        if (attempts.length > 5) out += `  <span style="color:#8b949e">... ${attempts.length - 5} autres</span>\n`;
        out += `<span style="color:#8b949e">]</span>\n\n`;
        this.appendTermLine(out);
      },
      error: (e) => this.appendTermLine(`<span style="color:#ff7b72">Erreur HTTP ${e.status}: ${e.message}</span>\n\n`)
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
