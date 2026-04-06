import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="logo">
        <span>🎓 E-Learning</span>
        <div class="notif-wrap">
          <button class="notif-btn" (click)="toggleNotif()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="notif-badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </button>

          <div class="notif-panel" *ngIf="notifOpen">
            <div class="notif-header">
              <span>🔔 Notifications</span>
              <button class="read-all-btn" (click)="markAllAsRead()" *ngIf="unreadCount > 0">Tout lire</button>
            </div>
            <div class="notif-empty" *ngIf="notifications.length === 0">Aucune notification</div>
            <div class="notif-list">
              <div class="notif-item" [class.unread]="!n.is_read"
                   *ngFor="let n of notifications" (click)="markAsRead(n)">
                <div class="notif-dot" *ngIf="!n.is_read"></div>
                <div class="notif-body">
                  <div class="notif-title">{{ n.title }}</div>
                  <div class="notif-msg">{{ n.message }}</div>
                  <div class="notif-time">{{ formatTime(n.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="notif-overlay" *ngIf="notifOpen" (click)="notifOpen = false"></div>
        </div>
      </div>

      <nav>
        <a routerLink="/dashboard" class="nav-item" routerLinkActive="active">🏠 Tableau de bord</a>
        <a routerLink="/courses" class="nav-item" routerLinkActive="active" *ngIf="!isAdmin">📚 Cours</a>
        <a routerLink="/my-courses" class="nav-item" routerLinkActive="active" *ngIf="isStudent">📖 Mes cours</a>
        <a routerLink="/courses/create" class="nav-item" routerLinkActive="active" *ngIf="isTeacher">➕ Créer un cours</a>
        <a routerLink="/students" class="nav-item" routerLinkActive="active" *ngIf="isTeacher || isAdmin">👥 Étudiants</a>
        <a routerLink="/analytics" class="nav-item" routerLinkActive="active" *ngIf="isTeacher || isAdmin">📊 Analytics</a>
        <a routerLink="/admin" class="nav-item" routerLinkActive="active" *ngIf="isAdmin">⚙️ Administration</a>
        <a routerLink="/chatbot" class="nav-item" routerLinkActive="active" *ngIf="isStudent">🤖 Assistant IA</a>
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
    .logo{padding:1.75rem 1.5rem;font-size:1.3rem;font-weight:800;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between}
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

    /* NOTIFICATIONS */
    .notif-wrap{position:relative}
    .notif-btn{position:relative;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:6px 8px;cursor:pointer;color:rgba(255,255,255,.8);display:flex;align-items:center;transition:.2s}
    .notif-btn:hover{background:rgba(255,255,255,.2)}
    .notif-btn svg{width:18px;height:18px;display:block}
    .notif-badge{position:absolute;top:-6px;right:-6px;background:#e53e3e;color:#fff;font-size:.6rem;font-weight:700;min-width:16px;height:16px;border-radius:8px;padding:0 4px;display:flex;align-items:center;justify-content:center;border:2px solid #0f2544}
    .notif-panel{position:fixed;top:20px;left:270px;z-index:1001;width:320px;background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.18);overflow:hidden;color:#1a2332}
    .notif-header{display:flex;justify-content:space-between;align-items:center;padding:11px 14px;background:#f6f8fc;border-bottom:1px solid #e2e8f0;font-size:.82rem;font-weight:700}
    .read-all-btn{font-size:.72rem;color:#4361ee;background:none;border:none;cursor:pointer;font-weight:600}
    .read-all-btn:hover{text-decoration:underline}
    .notif-empty{padding:28px 14px;text-align:center;color:#94a3b8;font-size:.82rem}
    .notif-list{max-height:340px;overflow-y:auto}
    .notif-item{display:flex;gap:8px;padding:11px 14px;border-bottom:1px solid #f0f4f8;cursor:pointer;transition:background .15s}
    .notif-item:hover{background:#f6f8fc}
    .notif-item.unread{background:#f0f4ff}
    .notif-item.unread:hover{background:#e8eef9}
    .notif-dot{width:7px;height:7px;border-radius:50%;background:#4361ee;flex-shrink:0;margin-top:5px}
    .notif-body{flex:1;min-width:0}
    .notif-title{font-size:.8rem;font-weight:700;color:#1a2332;margin-bottom:2px}
    .notif-msg{font-size:.75rem;color:#64748b;line-height:1.4;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .notif-time{font-size:.68rem;color:#94a3b8}
    .notif-overlay{position:fixed;inset:0;z-index:1000}
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  user: any = null;
  notifOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  private subs = new Subscription();

  constructor(
    private auth: AuthService,
    private router: Router,
    private notifService: NotificationService
  ) {
    this.auth.currentUser$.subscribe(u => this.user = u);
  }

  ngOnInit(): void {
    this.notifService.startPolling();
    this.subs.add(this.notifService.notifications$.subscribe(n => this.notifications = n));
    this.subs.add(this.notifService.unreadCount$.subscribe(c => this.unreadCount = c));
  }

  ngOnDestroy(): void {
    this.notifService.stopPolling();
    this.subs.unsubscribe();
  }

  toggleNotif(): void { this.notifOpen = !this.notifOpen; }

  markAsRead(n: Notification): void {
    if (!n.is_read) this.notifService.markAsRead(n.id);
    this.notifOpen = false;
    // Redirection selon le type de notification
    const data = n.data || {};
    if (data.course_id) {
      this.router.navigate(['/courses', data.course_id]);
    }
  }

  markAllAsRead(): void { this.notifService.markAllAsRead(); }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'A l instant';
    if (diff < 3600) return Math.floor(diff / 60) + ' min';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    return date.toLocaleDateString('fr-FR');
  }

  get isAdmin() { return this.auth.isAdmin(); }
  get isTeacher() { return this.auth.isTeacher(); }
  get isStudent() { return this.auth.isStudent(); }

  getInitials(): string {
    return (this.user?.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleLabel(): string {
    const labels: Record<string, string> = { admin: 'Administrateur', teacher: 'Formateur', student: 'Etudiant' };
    return labels[this.user?.role] || '';
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
