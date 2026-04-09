import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">

        <!-- Header -->
        <div class="page-header">
          <div>
            <h1>👥 Mes Étudiants</h1>
            <p class="subtitle">{{ totalStudents }} étudiant(s) au total</p>
          </div>
        </div>

        <!-- Filtres -->
        <div class="filters">
          <div class="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" [(ngModel)]="search" (input)="applyFilters()" placeholder="Rechercher un étudiant...">
          </div>
          <div class="select-wrap">
            <select [(ngModel)]="selectedCourse" (change)="applyFilters()">
              <option value="">Tous les cours</option>
              <option *ngFor="let c of courses" [value]="c.id">{{ c.title }}</option>
            </select>
            <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <button class="reset-btn" (click)="search=''; selectedCourse=''; applyFilters()">↺ Réinitialiser</button>
        </div>

        <!-- Loading -->
        <div class="loading" *ngIf="loading">
          <div class="spinner"></div>
          Chargement des étudiants...
        </div>

        <!-- Stats cards -->
        <div class="stats-row" *ngIf="!loading">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <div class="stat-value">{{ totalStudents }}</div>
              <div class="stat-label">Total étudiants uniques</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-info">
              <div class="stat-value">{{ courses.length }}</div>
              <div class="stat-label">Cours actifs</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <div class="stat-value">{{ avgProgress }}%</div>
              <div class="stat-label">Progression moyenne</div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="table-card" *ngIf="!loading">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Étudiant</th>
                <th>Email</th>
                <th>Cours</th>
                <th>Progression</th>
                <th>Statut</th>
                <th>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of filtered; let i = index">
                <td class="num">{{ i + 1 }}</td>
                <td class="student-name">
                  <div class="avatar">{{ getInitials(s.student?.name) }}</div>
                  <span>{{ s.student?.name || 'Étudiant #' + s.user_id }}</span>
                </td>
                <td class="email">{{ s.student?.email || '—' }}</td>
                <td class="course-name">
                  <a [routerLink]="['/courses', s.course_id]" class="course-link">
                    {{ getCourseTitle(s.course_id) }}
                  </a>
                </td>
                <td class="progress-cell">
                  <div class="progress-bar">
                    <div class="progress-fill"
                         [style.width]="(s.progress || 0) + '%'"
                         [class.high]="s.progress >= 70"
                         [class.mid]="s.progress >= 30 && s.progress < 70"
                         [class.low]="s.progress < 30"></div>
                  </div>
                  <span class="progress-pct">{{ s.progress || 0 }}%</span>
                </td>
                <td>
                  <span class="badge" [class.active]="s.status === 'active'">
                    {{ s.status === 'active' ? '✅ Actif' : '⏸ Inactif' }}
                  </span>
                </td>
                <td class="date">{{ s.created_at | date:'dd/MM/yyyy' }}</td>
              </tr>
              <tr *ngIf="filtered.length === 0">
                <td colspan="7" class="empty">
                  <div>📭</div>
                  <p>Aucun étudiant trouvé</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    .main { margin-left:260px; flex:1; padding:2rem; background:#f8f9fa; }
    .page-header { margin-bottom:1.5rem; }
    h1 { color:#1E3A5F; margin:0 0 .25rem; }
    .subtitle { color:#64748b; font-size:.9rem; margin:0; }
    .filters { background:#1E3A5F; border-radius:12px; padding:14px 16px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:2rem; }
    .search-box { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,.1); border-radius:8px; padding:8px 14px; flex:1; min-width:180px; border:0.5px solid rgba(255,255,255,.15); }
    .search-box input { border:none; outline:none; background:transparent; font-size:13px; color:white; width:100%; }
    .search-box input::placeholder { color:rgba(255,255,255,.45); }
    .select-wrap { position:relative; min-width:200px; }
    .select-wrap select { appearance:none; width:100%; background:rgba(255,255,255,.1); border:0.5px solid rgba(255,255,255,.2); border-radius:8px; padding:8px 36px 8px 14px; font-size:13px; color:white; cursor:pointer; outline:none; }
    .select-wrap select option { background:#1E3A5F; color:white; }
    .chevron { position:absolute; right:10px; top:50%; transform:translateY(-50%); pointer-events:none; }
    .reset-btn { background:rgba(255,255,255,.15); color:white; border:0.5px solid rgba(255,255,255,.2); border-radius:8px; padding:8px 16px; font-size:13px; cursor:pointer; white-space:nowrap; }
    .reset-btn:hover { background:rgba(255,255,255,.25); }
    .loading { display:flex; align-items:center; gap:1rem; padding:3rem; justify-content:center; color:#64748b; }
    .spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#1E3A5F; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.5rem; }
    .stat-card { background:white; border-radius:12px; padding:1.25rem 1.5rem; display:flex; align-items:center; gap:1rem; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .stat-icon { font-size:1.8rem; }
    .stat-value { font-size:1.6rem; font-weight:800; color:#1E3A5F; }
    .stat-label { font-size:.78rem; color:#64748b; }
    .table-card { background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); overflow:hidden; }
    table { width:100%; border-collapse:collapse; }
    thead { background:#1E3A5F; color:white; }
    th { padding:.85rem 1rem; text-align:left; font-size:.82rem; font-weight:600; }
    td { padding:.75rem 1rem; border-bottom:1px solid #f1f5f9; font-size:.85rem; color:#374151; vertical-align:middle; }
    tr:last-child td { border-bottom:none; }
    tr:hover td { background:#f8faff; }
    .num { color:#94a3b8; font-size:.8rem; width:40px; }
    .student-name { display:flex; align-items:center; gap:.75rem; font-weight:600; color:#1a2340; }
    .avatar { width:34px; height:34px; border-radius:50%; background:#1E3A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; flex-shrink:0; }
    .email { color:#64748b; }
    .course-link { color:#4361ee; text-decoration:none; font-weight:500; }
    .course-link:hover { text-decoration:underline; }
    .progress-cell { display:flex; align-items:center; gap:.6rem; }
    .progress-bar { flex:1; height:7px; background:#e2e8f0; border-radius:4px; max-width:100px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:4px; transition:width .3s; }
    .progress-fill.high { background:#22c55e; }
    .progress-fill.mid  { background:#f59e0b; }
    .progress-fill.low  { background:#ef4444; }
    .progress-pct { font-size:.78rem; color:#64748b; width:35px; }
    .badge { padding:.25rem .7rem; border-radius:20px; font-size:.75rem; font-weight:600; background:#f1f5f9; color:#64748b; }
    .badge.active { background:#dcfce7; color:#166534; }
    .date { color:#94a3b8; font-size:.8rem; }
    .empty { text-align:center; color:#94a3b8; padding:3rem; font-style:italic; }
    .empty div { font-size:2rem; margin-bottom:.5rem; }
    .empty p { margin:0; }
  `]
})
export class StudentsComponent implements OnInit {
  courses: any[] = [];
  allEnrollments: any[] = [];
  filtered: any[] = [];
  search = '';
  selectedCourse = '';
  loading = true;

  constructor(private courseService: CourseService, private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    const userId = user?.auth_id || user?.id;
    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.courses = courses.filter((c: any) => c.instructor_id === userId);
        if (this.courses.length === 0) { this.loading = false; return; }
        const requests = this.courses.map((c: any) => this.courseService.getCourseStudents(c.id));
        forkJoin(requests).subscribe({
          next: (results: any[][]) => {
            this.allEnrollments = [];
            results.forEach((enrollments, i) => {
              enrollments.forEach((e: any) => {
                this.allEnrollments.push({ ...e, course_id: this.courses[i].id });
              });
            });
            this.filtered = [...this.allEnrollments];
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() {
    let data = [...this.allEnrollments];
    if (this.selectedCourse) {
      data = data.filter(e => e.course_id == +this.selectedCourse);
    }
    if (this.search.trim()) {
      const s = this.search.toLowerCase();
      data = data.filter(e =>
        (e.student?.name || '').toLowerCase().includes(s) ||
        (e.student?.email || '').toLowerCase().includes(s)
      );
    }
    this.filtered = data;
  }

  get totalStudents(): number {
    return new Set(this.allEnrollments.map(e => e.user_id)).size;
  }

  get avgProgress(): number {
    if (!this.allEnrollments.length) return 0;
    return Math.round(this.allEnrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / this.allEnrollments.length);
  }

  getCourseTitle(courseId: number): string {
    return this.courses.find(c => c.id === courseId)?.title || 'Cours #' + courseId;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
