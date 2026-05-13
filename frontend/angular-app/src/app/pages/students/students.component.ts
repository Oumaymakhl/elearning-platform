import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

interface StudentRow {
  user_id: number;
  name: string;
  email: string;
  enrollments: { course_id: number; course_title: string; progress: number; status: string; created_at: string; }[];
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
          <div class="header-left">
            <div class="header-icon">👥</div>
            <div>
              <h1>Mes Étudiants</h1>
              <p class="subtitle">{{ totalStudents }} étudiant(s) au total</p>
            </div>
          </div>
        </div>

        <div class="filters">
          <div class="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B97A8" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" [(ngModel)]="search" (input)="applyFilters()" placeholder="Rechercher un étudiant...">
          </div>
          <div class="select-wrap">
            <select [(ngModel)]="selectedCourse" (change)="applyFilters()">
              <option value="">Tous les cours</option>
              <option *ngFor="let c of courses" [value]="c.id">{{ c.title }}</option>
            </select>
            <svg class="chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9B97A8" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <button class="reset-btn" (click)="search=''; selectedCourse=''; applyFilters()">↺ Réinitialiser</button>
        </div>

        <div class="loading" *ngIf="loading">
          <div class="spinner"></div> Chargement...
        </div>

        <div class="stats-row" *ngIf="!loading">
          <div class="stat-card blue">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <div class="stat-value">{{ totalStudents }}</div>
              <div class="stat-label">Total étudiants uniques</div>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">📚</div>
            <div class="stat-info">
              <div class="stat-value">{{ courses.length }}</div>
              <div class="stat-label">Cours actifs</div>
            </div>
          </div>
          <div class="stat-card purple">
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
                <th>Cours</th>
                <th>Progression</th>
                <th>Statut</th>
                <th>Inscrit le</th>
                <th></th>
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
                    <option *ngFor="let enr of s.enrollments" [value]="enr.course_id">{{ enr.course_title }}</option>
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
                    {{ s.selectedEnrollment.status === 'active' ? 'Actif' : 'Inactif' }}
                  </span>
                  <span *ngIf="!s.selectedEnrollment" class="dash">—</span>
                </td>
                <td class="date">
                  <span *ngIf="s.selectedEnrollment">{{ s.selectedEnrollment.created_at | date:'dd/MM/yyyy' }}</span>
                  <span *ngIf="!s.selectedEnrollment" class="dash">—</span>
                </td>
                <td>
                  <button class="msg-btn" (click)="messageStudent(s, $event)" title="Envoyer un message">✉️</button>
                </td>
              </tr>
              <tr *ngIf="filtered.length === 0">
                <td colspan="8" class="empty"><div>📭</div><p>Aucun étudiant trouvé</p></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; font-family:'DM Sans',sans-serif; }
    .layout { display:flex; min-height:100vh; }
    .main { margin-left:260px; flex:1; padding:2rem 2.5rem; background:#f8f9fa; }
    .page-header { margin-bottom:1.75rem; }
    .header-left { display:flex; align-items:center; gap:1rem; }
    .header-icon { width:48px; height:48px; background:#F0EDFF; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; border:1px solid #D8D3F8; }
    h1 { font-size:1.4rem; font-weight:700; color:#1A1A2E; }
    .subtitle { color:#9B97A8; font-size:.85rem; margin-top:2px; }
    .filters { background:#1E3A5F; border-radius:12px; padding:12px 14px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:1.5rem; }
    .search-box { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,.1); border-radius:9px; padding:8px 14px; flex:1; min-width:180px; border:1px solid rgba(255,255,255,.15); transition:.2s; }
    .search-box input { border:none; outline:none; background:transparent; font-size:.85rem; color:#fff; width:100%; font-family:'DM Sans',sans-serif; }
    .search-box input::placeholder { color:rgba(255,255,255,.4); }
    .select-wrap { position:relative; min-width:200px; }
    .select-wrap select { appearance:none; width:100%; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); border-radius:9px; padding:8px 34px 8px 14px; font-size:.85rem; color:#fff; cursor:pointer; outline:none; font-family:'DM Sans',sans-serif; }
    .select-wrap select option { background:#1E3A5F; color:#fff; }
    .chevron { position:absolute; right:10px; top:50%; transform:translateY(-50%); pointer-events:none; }
    .reset-btn { background:rgba(255,255,255,.15); color:#fff; border:1px solid rgba(255,255,255,.2); border-radius:9px; padding:8px 16px; font-size:.83rem; cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:500; transition:.2s; white-space:nowrap; }
    .reset-btn:hover { background:rgba(255,255,255,.25); }
    .loading { display:flex; align-items:center; gap:1rem; padding:3rem; justify-content:center; color:#9B97A8; }
    .spinner { width:22px; height:22px; border:2.5px solid #E0DDF5; border-top-color:#6C63FF; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.5rem; }
    .stat-card { background:#fff; border-radius:12px; padding:1.1rem 1.4rem; display:flex; align-items:center; gap:1rem; border:1px solid #e9ecef; box-shadow:0 1px 4px rgba(0,0,0,.04); transition:.2s; }
    .stat-card:hover { transform:translateY(-2px); box-shadow:0 4px 14px rgba(0,0,0,.08); }
    .stat-card.blue { border-left:3px solid #6C63FF; }
    .stat-card.green { border-left:3px solid #22C55E; }
    .stat-card.purple { border-left:3px solid #A78BFA; }
    .stat-icon { font-size:1.6rem; }
    .stat-value { font-size:1.65rem; font-weight:800; color:#1A1A2E; line-height:1; }
    .stat-label { font-size:.75rem; color:#9B97A8; margin-top:3px; }
    .table-card { background:#fff; border-radius:12px; border:1px solid #e9ecef; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.04); }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#1E3A5F; border-bottom:1.5px solid #1E3A5F; }
    th { padding:.8rem 1rem; text-align:left; font-size:.73rem; font-weight:600; color:rgba(255,255,255,.7); text-transform:uppercase; letter-spacing:.05em; }
    td { padding:.75rem 1rem; border-bottom:1px solid #f4f4f6; font-size:.85rem; color:#374151; vertical-align:middle; }
    tr:last-child td { border-bottom:none; }
    tbody tr:hover td { background:#f8f9ff; }
    .num { color:#C0BBD0; font-size:.78rem; width:36px; }
    .student-name { display:flex; align-items:center; gap:.65rem; font-weight:600; color:#1A1A2E; }
    .avatar { width:32px; height:32px; border-radius:10px; background:#F0EDFF; color:#6C63FF; border:1px solid #D8D3F8; display:flex; align-items:center; justify-content:center; font-size:.68rem; font-weight:700; flex-shrink:0; }
    .email { color:#9B97A8; font-size:.82rem; }
    .courses-cell { min-width:190px; }
    .course-select { width:100%; padding:6px 28px 6px 10px; border-radius:8px; border:1.5px solid #e2e8f0; font-size:.78rem; color:#1A1A2E; background:#f8f9fa url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239B97A8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 8px center; appearance:none; cursor:pointer; outline:none; transition:.2s; font-family:'DM Sans',sans-serif; }
    .course-select:focus { border-color:#6C63FF; background-color:#fff; }
    .progress-cell { display:flex; align-items:center; gap:.55rem; }
    .progress-bar { flex:1; height:6px; background:#f0f0f5; border-radius:4px; max-width:90px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:4px; transition:width .3s; }
    .progress-fill.high { background:#22C55E; }
    .progress-fill.mid { background:#F59E0B; }
    .progress-fill.low { background:#EF4444; }
    .progress-pct { font-size:.75rem; color:#9B97A8; width:32px; font-weight:500; }
    .badge { padding:.25rem .75rem; border-radius:20px; font-size:.73rem; font-weight:600; background:#f1f5f9; color:#9B97A8; }
    .badge.active { background:#DCFCE7; color:#166534; }
    .date { color:#C0BBD0; font-size:.78rem; }
    .dash { color:#d1d5db; }
    .msg-btn { background:#F0EDFF; border:1px solid #D8D3F8; border-radius:8px; padding:5px 9px; cursor:pointer; font-size:.85rem; transition:.2s; }
    .msg-btn:hover { background:#6C63FF; }
    .empty { text-align:center; color:#C0BBD0; padding:3rem; }
    .empty div { font-size:2rem; margin-bottom:.5rem; }
    .empty p { margin:0; font-size:.85rem; }
  `]
})
export class StudentsComponent implements OnInit {
  courses: any[] = [];
  allStudentRows: StudentRow[] = [];
  filtered: StudentRow[] = [];
  search = '';
  selectedCourse = '';
  loading = true;

  constructor(private courseService: CourseService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    const userId = user?.id;
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
                  studentMap.set(uid, { user_id: uid, name: e.student?.name || '', email: e.student?.email || '', enrollments: [], selectedEnrollment: null });
                }
                studentMap.get(uid)!.enrollments.push({ course_id: course.id, course_title: course.title, progress: parseFloat(e.progress) || 0, status: e.status, created_at: e.created_at });
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
    student.selectedEnrollment = courseId ? student.enrollments.find(e => e.course_id === courseId) || null : null;
  }

  applyFilters() {
    let data = [...this.allStudentRows];
    if (this.selectedCourse) {
      data = data.map(s => ({ ...s, enrollments: s.enrollments.filter(e => e.course_id == +this.selectedCourse), selectedEnrollment: null })).filter(s => s.enrollments.length > 0);
    }
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      data = data.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    this.filtered = data;
  }

  messageStudent(student: StudentRow, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/messages'], { queryParams: { with: student.user_id, name: student.name, avatar: '' } });
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
