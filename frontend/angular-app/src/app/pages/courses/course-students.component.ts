import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { CourseService } from '../../services/course.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-students',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, FormsModule],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">
        <div class="page-header">
          <a [routerLink]="['/courses', courseId]" class="back">← Retour au cours</a>
          <h1>👥 Étudiants inscrits</h1>
          <p class="subtitle">{{ filtered.length }} étudiant(s) inscrit(s)</p>
        </div>

        <!-- Recherche -->
        <div class="search-bar">
          <input type="text" [(ngModel)]="search" (input)="filter()"
                 placeholder="🔍 Rechercher un étudiant...">
        </div>

        <!-- Loading -->
        <div class="loading" *ngIf="loading">Chargement...</div>

        <!-- Table -->
        <div class="table-card" *ngIf="!loading">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Étudiant</th>
                <th>Email</th>
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
                  {{ s.student?.name || 'Étudiant #' + s.user_id }}
                </td>
                <td class="email">{{ s.student?.email || '—' }}</td>
                <td class="progress-cell">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width]="(s.progress || 0) + '%'"></div>
                  </div>
                  <span class="progress-pct">{{ s.progress || 0 }}%</span>
                </td>
                <td>
                  <span class="badge" [class.active]="s.status === 'active'" [class.inactive]="s.status !== 'active'">
                    {{ s.status === 'active' ? '✅ Actif' : '⏸ Inactif' }}
                  </span>
                </td>
                <td class="date">{{ s.created_at | date:'dd/MM/yyyy' }}</td>
              </tr>
              <tr *ngIf="filtered.length === 0">
                <td colspan="6" class="empty">Aucun étudiant trouvé</td>
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
    .back { color:#1E3A5F; text-decoration:none; font-size:.85rem; }
    h1 { color:#1E3A5F; margin:.5rem 0 .25rem; }
    .subtitle { color:#64748b; font-size:.9rem; }
    .search-bar { margin-bottom:1.5rem; }
    .search-bar input { width:100%; max-width:400px; padding:.75rem 1rem; border:1px solid #ddd; border-radius:8px; font-size:.9rem; }
    .loading { color:#64748b; padding:2rem; text-align:center; }
    .table-card { background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); overflow:hidden; }
    table { width:100%; border-collapse:collapse; }
    thead { background:#1E3A5F; color:white; }
    th { padding:.85rem 1rem; text-align:left; font-size:.82rem; font-weight:600; }
    td { padding:.75rem 1rem; border-bottom:1px solid #f1f5f9; font-size:.85rem; color:#374151; }
    tr:last-child td { border-bottom:none; }
    tr:hover td { background:#f8faff; }
    .num { color:#94a3b8; font-size:.8rem; width:40px; }
    .student-name { display:flex; align-items:center; gap:.75rem; font-weight:600; color:#1a2340; }
    .avatar { width:34px; height:34px; border-radius:50%; background:#1E3A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; flex-shrink:0; }
    .email { color:#64748b; }
    .progress-cell { display:flex; align-items:center; gap:.6rem; }
    .progress-bar { flex:1; height:6px; background:#e2e8f0; border-radius:3px; max-width:100px; }
    .progress-fill { height:100%; background:#1E3A5F; border-radius:3px; transition:width .3s; }
    .progress-pct { font-size:.78rem; color:#64748b; width:35px; }
    .badge { padding:.25rem .7rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .badge.active { background:#dcfce7; color:#166534; }
    .badge.inactive { background:#f1f5f9; color:#64748b; }
    .date { color:#94a3b8; font-size:.8rem; }
    .empty { text-align:center; color:#94a3b8; padding:2rem; font-style:italic; }
  `]
})
export class CourseStudentsComponent implements OnInit {
  courseId!: number;
  students: any[] = [];
  filtered: any[] = [];
  search = '';
  loading = true;

  constructor(private route: ActivatedRoute, private courseService: CourseService) {}

  ngOnInit() {
    this.courseId = +this.route.snapshot.paramMap.get('id')!;
    this.courseService.getCourseStudents(this.courseId).subscribe({
      next: (data) => {
        this.students = data;
        this.filtered = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  filter() {
    const s = this.search.toLowerCase();
    this.filtered = this.students.filter(st =>
      (st.student?.name || '').toLowerCase().includes(s) ||
      (st.student?.email || '').toLowerCase().includes(s)
    );
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
