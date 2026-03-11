import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="logo">🎓 E-Learning</div>
        <nav>
          <a routerLink="/dashboard" class="nav-item active">🏠 Tableau de bord</a>
          <a routerLink="/courses" class="nav-item">📚 Cours</a>
          <a routerLink="/my-courses" class="nav-item" *ngIf="isStudent">📖 Mes cours</a>
          <a routerLink="/courses/create" class="nav-item" *ngIf="isTeacher">➕ Créer un cours</a>
          <a routerLink="/admin" class="nav-item" *ngIf="isAdmin">⚙️ Administration</a>
          <a routerLink="/chatbot" class="nav-item">🤖 Assistant IA</a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="avatar">{{ userInitial }}</div>
            <div>
              <div class="user-name">{{ user?.name }}</div>
              <div class="user-role">{{ roleLabel }}</div>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">Déconnexion</button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="main">
        <div class="header">
          <h1>Bonjour, {{ user?.name }} 👋</h1>
          <p>Bienvenue sur votre tableau de bord</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">{{ stats.courses }}</div>
            <div class="stat-label">{{ isStudent ? 'Mes cours' : 'Cours créés' }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">Complétés</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-value">{{ stats.score }}%</div>
            <div class="stat-label">Score moyen</div>
          </div>
        </div>

        <div class="recent">
          <h2>Cours récents</h2>
          <div class="course-grid">
            <div class="course-card" *ngFor="let course of recentCourses" [routerLink]="['/courses', course.id]">
              <div class="course-img">📘</div>
              <div class="course-info">
                <h3>{{ course.title }}</h3>
                <p>{{ course.description | slice:0:80 }}...</p>
                <div class="progress-bar" *ngIf="isStudent">
                  <div class="progress-fill" [style.width]="(course.progress || 0) + '%'"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="empty" *ngIf="recentCourses.length === 0">
            Aucun cours pour l'instant. <a routerLink="/courses">Parcourir les cours</a>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    .sidebar { width:260px; background:#1E3A5F; color:white; display:flex; flex-direction:column; position:fixed; height:100vh; }
    .logo { padding:1.5rem; font-size:1.3rem; font-weight:700; border-bottom:1px solid rgba(255,255,255,.1); }
    nav { flex:1; padding:1rem 0; }
    .nav-item { display:block; padding:.75rem 1.5rem; color:rgba(255,255,255,.8); text-decoration:none; transition:all .2s; }
    .nav-item:hover, .nav-item.active { background:rgba(255,255,255,.1); color:white; }
    .sidebar-footer { padding:1rem; border-top:1px solid rgba(255,255,255,.1); }
    .user-info { display:flex; align-items:center; gap:.75rem; margin-bottom:.75rem; }
    .avatar { width:40px; height:40px; background:#4A90D9; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; }
    .user-name { font-weight:600; font-size:.9rem; }
    .user-role { font-size:.75rem; opacity:.7; }
    .logout-btn { width:100%; padding:.5rem; background:rgba(255,255,255,.1); color:white; border:none; border-radius:6px; cursor:pointer; }
    .logout-btn:hover { background:rgba(255,255,255,.2); }
    .main { margin-left:260px; flex:1; padding:2rem; background:#f8f9fa; }
    .header { margin-bottom:2rem; }
    .header h1 { font-size:1.75rem; color:#1E3A5F; }
    .header p { color:#666; }
    .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:2rem; }
    .stat-card { background:white; padding:1.5rem; border-radius:12px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .stat-icon { font-size:2rem; margin-bottom:.5rem; }
    .stat-value { font-size:2rem; font-weight:700; color:#1E3A5F; }
    .stat-label { color:#666; font-size:.85rem; }
    .recent h2 { color:#1E3A5F; margin-bottom:1rem; }
    .course-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; }
    .course-card { background:white; border-radius:12px; overflow:hidden; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.06); transition:transform .2s; }
    .course-card:hover { transform:translateY(-2px); }
    .course-img { height:100px; background:linear-gradient(135deg,#1E3A5F,#4A90D9); display:flex; align-items:center; justify-content:center; font-size:3rem; }
    .course-info { padding:1rem; }
    .course-info h3 { margin:0 0 .5rem; color:#1E3A5F; }
    .course-info p { color:#666; font-size:.85rem; margin:0 0 .75rem; }
    .progress-bar { height:6px; background:#e2e8f0; border-radius:3px; }
    .progress-fill { height:100%; background:#4A90D9; border-radius:3px; }
    .empty { text-align:center; color:#666; padding:2rem; }
    .empty a { color:#1E3A5F; }
  `]
})
export class DashboardComponent implements OnInit {
  user: any;
  recentCourses: any[] = [];
  stats = { courses: 0, completed: 0, score: 0 };

  get isStudent() { return this.auth.isStudent(); }
  get isTeacher() { return this.auth.isTeacher(); }
  get isAdmin() { return this.auth.isAdmin(); }
  get userInitial() { return this.user?.name?.charAt(0).toUpperCase() || 'U'; }
  get roleLabel() { const roles: Record<string, string> = { student: 'Étudiant', teacher: 'Formateur', admin: 'Administrateur' }; return roles[this.user?.role] || ''; }

  constructor(private auth: AuthService, private courseService: CourseService, private router: Router) {}

  ngOnInit() {
    this.user = this.auth.getCurrentUser();
    this.loadData();
  }

  loadData() {
    if (this.isStudent) {
      this.courseService.myCourses().subscribe({
        next: (courses) => {
          this.recentCourses = courses.slice(0, 6);
          this.stats.courses = courses.length;
        },
        error: () => {}
      });
    } else {
      this.courseService.getCourses().subscribe({
        next: (courses) => {
          this.recentCourses = courses.slice(0, 6);
          this.stats.courses = courses.length;
        },
        error: () => {}
      });
    }
  }

  logout() {
    this.auth.logout().subscribe({ next: () => this.router.navigate(['/login']), error: () => this.router.navigate(['/login']) });
  }
}
