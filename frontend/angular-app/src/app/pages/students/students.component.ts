import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

interface StudentRow {
  user_id: number;
  name: string;
  email: string;
  enrollments: {
    course_id: number;
    course_title: string;
    progress: number;
    status: string;
    created_at: string;
  }[];
  selectedEnrollment: any | null;
}

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">

        <div class="page-header">
          <div>
            <h1>👥 Mes Étudiants</h1>
            <p class="subtitle">{{ totalStudents }} étudiant(s) au total</p>
          </div>
        </div>

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

        <div class="loading" *ngIf="loading">
          <div class="spinner"></div>
          Chargement des étudiants...
        </div>

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

        <div class="table-card" *ngIf="!loading">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Étudiant</th>
                <th>Email</th>
                <th>Cours (cliquez pour les détails)</th>
                <th>Progression</th>
                <th>Statut</th>
                <th>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of filtered; let i = index">
                <td class="num">{{ i + 1 }}</td>
                <td class="student-name">
                  <div class="avatar">{{ getInitials(s.name) }}</div>
                  <span>{{ s.name || 'Étudiant #' + s.user_id }}</span>
                </td>
                <td class="email">{{ s.email || '—' }}</td>
                <td class="courses-cell">
                  <select class="course-select" (change)="onSelectChange(s, $event)">
                    <option value="">-- Choisir un cours --</option>
                    <option *ngFor="let enr of s.enrollments" [value]="enr.course_id">
                      {{ enr.course_title }}
                    </option>
                  </select>
                </td>
                <td class="progress-cell">
                  <ng-container *ngIf="s.selectedEnrollment; else emptyP">
                    <div class="progress-bar">
                      <div class="progress-fill"
                           [style.width]="(s.selectedEnrollment.progress || 0) + '%'"
                           [class.high]="s.selectedEnrollment.progress >= 70"
                           [class.mid]="s.selectedEnrollment.progress >= 30 && s.selectedEnrollment.progress < 70"
                           [class.low]="s.selectedEnrollment.progress < 30"></div>
                    </div>
                    <span class="progress-pct">{{ s.selectedEnrollment.progress || 0 }}%</span>
                  </ng-container>
                  <ng-template #emptyP><span class="dash">—</span></ng-template>
                </td>
                <td>
                  <span *ngIf="s.selectedEnrollment" class="badge" [class.active]="s.selectedEnrollment.status === 'active'">
                    {{ s.selectedEnrollment.status === 'active' ? '✅ Actif' : '⏸ Inactif' }}
                  </span>
                  <span *ngIf="!s.selectedEnrollment" class="dash">—</span>
                </td>
                <td class="date">
                  <span *ngIf="s.selectedEnrollment">{{ s.selectedEnrollment.created_at | date:'dd/MM/yyyy' }}</span>
                  <span *ngIf="!s.selectedEnrollment" class="dash">—</span>
                </td>
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
    .courses-cell { min-width:200px; }
    .course-select {
      width:100%; padding:7px 32px 7px 12px;
      border-radius:20px;
      border:1.5px solid #c7d4f0;
      font-size:.78rem; font-weight:600;
      color:#1E3A5F;
      background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231E3A5F' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 10px center;
      appearance:none; -webkit-appearance:none;
      cursor:pointer; outline:none;
      box-shadow: 0 1px 4px rgba(30,58,95,.08);
      transition: border-color .2s, box-shadow .2s;
    }
    .course-select:hover { border-color:#1E3A5F; box-shadow:0 2px 8px rgba(30,58,95,.15); }
    .course-select:focus { border-color:#1E3A5F; box-shadow:0 0 0 3px rgba(30,58,95,.12); }
    .course-select option { font-weight:500; color:#1E3A5F; background:white; }
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
    .dash { color:#cbd5e1; }
    .empty { text-align:center; color:#94a3b8; padding:3rem; font-style:italic; }
    .empty div { font-size:2rem; margin-bottom:.5rem; }
    .empty p { margin:0; }
  `]
})
export class StudentsComponent implements OnInit {
  courses: any[] = [];
  allStudentRows: StudentRow[] = [];
  filtered: StudentRow[] = [];
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
            const studentMap = new Map<number, StudentRow>();
            results.forEach((enrollments, i) => {
              const course = this.courses[i];
              enrollments.forEach((e: any) => {
                const uid = e.user_id;
                if (!studentMap.has(uid)) {
                  studentMap.set(uid, {
                    user_id: uid,
                    name: e.student?.name || '',
                    email: e.student?.email || '',
                    enrollments: [],
                    selectedEnrollment: null
                  });
                }
                studentMap.get(uid)!.enrollments.push({
                  course_id: course.id,
                  course_title: course.title,
                  progress: parseFloat(e.progress) || 0,
                  status: e.status,
                  created_at: e.created_at
                });
              });
            });
            this.allStudentRows = Array.from(studentMap.values());
            this.filtered = [...this.allStudentRows];
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  onSelectChange(student: StudentRow, event: Event) {
    const courseId = +(event.target as HTMLSelectElement).value;
    student.selectedEnrollment = courseId
      ? student.enrollments.find(e => e.course_id === courseId) || null
      : null;
  }

  applyFilters() {
    let data = [...this.allStudentRows];
    if (this.selectedCourse) {
      data = data
        .map(s => ({ ...s, enrollments: s.enrollments.filter(e => e.course_id == +this.selectedCourse), selectedEnrollment: null }))
        .filter(s => s.enrollments.length > 0);
    }
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      data = data.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    this.filtered = data;
  }

  get totalStudents(): number { return this.allStudentRows.length; }

  get avgProgress(): number {
    const all = this.allStudentRows.flatMap(s => s.enrollments);
    if (!all.length) return 0;
    return Math.round(all.reduce((acc, e) => acc + e.progress, 0) / all.length);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
