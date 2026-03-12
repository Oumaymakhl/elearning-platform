import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="logo">🎓 E-Learning</div>
      <nav>
        <a routerLink="/dashboard" class="nav-item" routerLinkActive="active">🏠 Tableau de bord</a>
        <a routerLink="/courses" class="nav-item" routerLinkActive="active" *ngIf="!isAdmin">📚 Cours</a>
        <a routerLink="/my-courses" class="nav-item" routerLinkActive="active" *ngIf="isStudent">📖 Mes cours</a>
        <a routerLink="/courses/create" class="nav-item" routerLinkActive="active" *ngIf="isTeacher">➕ Créer un cours</a>
        <a routerLink="/admin" class="nav-item" routerLinkActive="active" *ngIf="isAdmin">⚙️ Administration</a>
        <a routerLink="/chatbot" class="nav-item" routerLinkActive="active" *ngIf="!isAdmin">🤖 Assistant IA</a>
        <a routerLink="/profile" class="nav-item" routerLinkActive="active">👤 Mon profil</a>
      </nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ getInitials() }}</div>
          <div class="user-details">
            <span class="user-name">{{ user?.name }}</span>
            <span class="user-role">{{ getRoleLabel() }}</span>
          </div>
        </div>
        <button class="btn-logout" (click)="logout()">⏻</button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar{width:260px;background:linear-gradient(180deg,#0f2544,#1E3A5F);color:white;position:fixed;height:100vh;display:flex;flex-direction:column;z-index:100;box-shadow:4px 0 20px rgba(0,0,0,.15)}
    .logo{padding:1.75rem 1.5rem;font-size:1.3rem;font-weight:800;border-bottom:1px solid rgba(255,255,255,.08)}
    nav{flex:1;padding:1.25rem 0;overflow-y:auto}
    .nav-item{display:block;padding:.85rem 1.5rem;color:rgba(255,255,255,.7);text-decoration:none;transition:.25s;border-left:3px solid transparent;font-size:.95rem}
    .nav-item:hover,.nav-item.active{background:rgba(255,255,255,.08);color:white;border-left-color:#4A90D9;padding-left:1.75rem}
    .sidebar-footer{padding:1rem 1.25rem;border-top:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:.75rem}
    .user-info{display:flex;align-items:center;gap:.75rem;flex:1;min-width:0}
    .user-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:800;flex-shrink:0}
    .user-details{display:flex;flex-direction:column;min-width:0}
    .user-name{font-size:.85rem;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .user-role{font-size:.72rem;color:rgba(255,255,255,.5)}
    .btn-logout{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.7);border-radius:8px;padding:.5rem .6rem;cursor:pointer;font-size:1rem;transition:.2s;flex-shrink:0}
    .btn-logout:hover{background:rgba(220,53,69,.3);color:white;border-color:rgba(220,53,69,.4)}
  `]
})
export class SidebarComponent {
  user: any = null;

  constructor(private auth: AuthService, private router: Router) {
    this.auth.currentUser$.subscribe(u => this.user = u);
  }

  get isAdmin() { return this.auth.isAdmin(); }
  get isTeacher() { return this.auth.isTeacher(); }
  get isStudent() { return this.auth.isStudent(); }

  getInitials(): string {
    return (this.user?.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleLabel(): string {
    const labels: Record<string, string> = { admin: 'Administrateur', teacher: 'Formateur', student: 'Étudiant' };
    return labels[this.user?.role] || '';
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
