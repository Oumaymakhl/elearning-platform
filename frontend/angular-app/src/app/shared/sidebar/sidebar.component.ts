import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
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
            <div class="np-header">
              <div class="np-header-top">
                <span class="np-title">🔔 Notifications</span>
                <div class="np-actions">
                  <button class="np-btn" (click)="markAllAsRead()" *ngIf="unreadCount > 0">✓ Tout lire</button>
                  <button class="np-btn red" (click)="clearAll()" *ngIf="notifications.length > 0">🗑</button>
                </div>
              </div>
              <div class="np-filters">
                <button class="np-ftab" [class.on]="activeFilter==='all'"    (click)="setFilter('all')">Toutes</button>
                <button class="np-ftab" [class.on]="activeFilter==='unread'" (click)="setFilter('unread')">Non lues</button>
                <button class="np-ftab" [class.on]="activeFilter==='high'"   (click)="setFilter('high')">Urgentes</button>
              </div>
            </div>

            <div class="np-list">
              <div class="np-empty" *ngIf="filtered.length === 0">
                <div style="font-size:24px">🔕</div>
                <div>Aucune notification</div>
              </div>
              <div class="np-item"
                *ngFor="let n of filtered"
                [class.unread]="!n.is_read"
                [class.p-high]="n.priority==='high'"
                [class.p-med]="n.priority==='medium'"
                [class.p-low]="n.priority==='low'"
                (click)="markAsRead(n)">
                <div class="np-ico" [ngClass]="iconBg(n)">{{ n.icon }}</div>
                <div class="np-body">
                  <div class="np-item-top">
                    <span class="np-item-title">{{ n.title }}</span>
                    <span class="np-prio" *ngIf="n.priority==='high'">urgent</span>
                    <span class="np-dot" [class.np-dot-red]="n.priority==='high'" *ngIf="!n.is_read"></span>
                  </div>
                  <div class="np-msg">{{ n.message }}</div>
                  <div class="np-foot">
                    <span class="np-time">{{ n.time_ago }}</span>
                    <a class="np-link" *ngIf="n.action_url" [href]="n.action_url" (click)="$event.stopPropagation()">Voir →</a>
                  </div>
                </div>
                <div class="np-quick">
                  <button class="np-qbtn" *ngIf="!n.is_read" (click)="$event.stopPropagation(); quickRead(n)">✓</button>
                  <button class="np-qbtn del" (click)="$event.stopPropagation(); deleteNotif(n)">×</button>
                </div>
              </div>
            </div>

            <div class="np-footer">
              <span class="np-foot-txt">{{ notifications.length }} notification(s)</span>
              <div class="np-stats">
                <span class="np-stat s-unread" *ngIf="unreadCount > 0">{{ unreadCount }} non lue(s)</span>
                <span class="np-stat s-high" *ngIf="highCount > 0">{{ highCount }} urgente(s)</span>
              </div>
            </div>
          </div>
          <div class="notif-overlay" *ngIf="notifOpen" (click)="notifOpen = false"></div>
        </div>
      </div>

      <!-- Barre de recherche -->
      <div class="search-wrap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input class="sidebar-search" type="text" [(ngModel)]="searchQuery"
          (keyup.enter)="goSearch()"
          (input)="onSearchInput()"
          placeholder="Rechercher..."/>
        <button class="search-go" *ngIf="searchQuery" (click)="goSearch()">→</button>
      </div>

      <nav>
        <a routerLink="/dashboard" class="nav-item" routerLinkActive="active">🏠 Tableau de bord</a>
        <a routerLink="/courses" class="nav-item" routerLinkActive="active" *ngIf="!isAdmin">📚 Cours</a>
        <a routerLink="/my-courses" class="nav-item" routerLinkActive="active" *ngIf="isStudent">📖 Mes cours</a>
        <a routerLink="/courses/create" class="nav-item" routerLinkActive="active" *ngIf="isTeacher">➕ Créer un cours</a>
        <a routerLink="/students" class="nav-item" routerLinkActive="active" *ngIf="isTeacher">👥 Étudiants</a>
        <a routerLink="/analytics" class="nav-item" routerLinkActive="active" *ngIf="isTeacher || isAdmin">📊 Analytics</a>
        <a routerLink="/admin" class="nav-item" routerLinkActive="active" *ngIf="isAdmin">⚙️ Administration</a>
        <a routerLink="/teacher-approvals" class="nav-item" routerLinkActive="active" *ngIf="isAdmin">👨‍🏫 Approbations enseignants</a>
        <a routerLink="/chatbot" class="nav-item" routerLinkActive="active" *ngIf="isStudent">🤖 Assistant IA</a>
        <a routerLink="/messages" class="nav-item" routerLinkActive="active">✉️ Messages</a>
        <a routerLink="/certificates" class="nav-item" routerLinkActive="active" *ngIf="isStudent">🏆 Mes certificats</a>
      </nav>

      <div class="sidebar-footer" [routerLink]="['/profile']" style="cursor:pointer" title="Mon profil">
        <div class="user-info">
          <img *ngIf="user?.avatar_url" [src]="getAvatarUrl()" class="user-avatar user-avatar-img" alt="avatar">
          <div class="user-avatar" *ngIf="!user?.avatar_url">{{ getInitials() }}</div>
          <div class="user-details">
            <span class="user-name">{{ user?.name }}</span>
            <span class="user-role">{{ getRoleLabel() }}</span>
          </div>
        </div>
        <button class="btn-logout" (click)="logout()">⏻</button>
      </div>
    
      <!-- Popup confirmation -->
      <div class="confirm-overlay" *ngIf="showConfirm">
        <div class="confirm-box">
          <div class="confirm-icon">🗑️</div>
          <div class="confirm-title">Supprimer les notifications ?</div>
          <div class="confirm-msg">Toutes vos notifications seront supprimées définitivement.</div>
          <div class="confirm-actions">
            <button class="confirm-cancel" (click)="showConfirm=false">Annuler</button>
            <button class="confirm-ok" (click)="confirmClearAll()">Supprimer</button>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar{width:260px;background:linear-gradient(180deg,#0f2544,#1E3A5F);color:white;position:fixed;height:100vh;display:flex;flex-direction:column;z-index:100;box-shadow:4px 0 20px rgba(0,0,0,.15)}
    .logo{padding:1.75rem 1.5rem;font-size:1.3rem;font-weight:800;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between}
    nav{flex:1;padding:1.25rem 0;overflow-y:auto}
    .search-wrap{margin:.75rem 1rem;display:flex;align-items:center;gap:.5rem;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:7px 12px;transition:.2s}
    .search-wrap:focus-within{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.25)}
    .sidebar-search{flex:1;background:none;border:none;outline:none;color:white;font-size:.82rem}
    .sidebar-search::placeholder{color:rgba(255,255,255,.4)}
    .search-go{background:rgba(255,255,255,.15);border:none;color:white;border-radius:6px;padding:2px 7px;cursor:pointer;font-size:.85rem}
    .search-go:hover{background:rgba(255,255,255,.25)}
    .nav-item{display:block;padding:.85rem 1.5rem;color:rgba(255,255,255,.7);text-decoration:none;transition:.25s;border-left:3px solid transparent;font-size:.95rem}
    .nav-item:hover,.nav-item.active{background:rgba(255,255,255,.08);color:white;border-left-color:#4A90D9;padding-left:1.75rem}
    .sidebar-footer{padding:1rem 1.25rem;border-top:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:.75rem}
    .user-info{display:flex;align-items:center;gap:.75rem;flex:1;min-width:0}
    .user-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:800;flex-shrink:0}
    .user-avatar-img{object-fit:cover;background:none;}
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

    .notif-panel{position:fixed;top:20px;left:270px;z-index:1001;width:370px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.14);overflow:hidden;color:#1a202c}

    .np-header{padding:13px 15px 9px;border-bottom:1px solid #edf2f7}
    .np-header-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
    .np-title{font-size:13px;font-weight:700;color:#1a202c}
    .np-actions{display:flex;gap:5px}
    .np-btn{font-size:11px;color:#718096;background:#f7fafc;border:1px solid #e2e8f0;border-radius:6px;padding:3px 8px;cursor:pointer;font-weight:600}
    .np-btn:hover{background:#edf2f7;color:#2d3748}
    .np-btn.red:hover{background:#fff5f5;color:#e53e3e;border-color:#feb2b2}
    .np-filters{display:flex;gap:4px}
    .np-ftab{font-size:11px;padding:3px 11px;border-radius:20px;border:1.5px solid transparent;cursor:pointer;color:#718096;background:transparent;font-weight:500;transition:all .15s}
    .np-ftab:hover{background:#f7fafc}
    .np-ftab.on{background:#ebf4ff;color:#3b82f6;border-color:#93c5fd;font-weight:700}

    .np-list{max-height:360px;overflow-y:auto}
    .np-list::-webkit-scrollbar{width:3px}
    .np-list::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px}
    .np-empty{padding:36px 14px;text-align:center;color:#a0aec0;font-size:12px;display:flex;flex-direction:column;align-items:center;gap:6px}

    .np-item{display:flex;align-items:flex-start;gap:10px;padding:11px 15px;border-bottom:1px solid #f7fafc;cursor:pointer;transition:background .12s;position:relative}
    .np-item:last-child{border-bottom:none}
    .np-item:hover{background:#f7fafc}
    .np-item.unread{background:#f0f7ff}
    .np-item.unread:hover{background:#e8f0fe}
    .np-item.p-high{border-left:3px solid #e53e3e}
    .np-item.p-med{border-left:3px solid #4361ee}
    .np-item.p-low{border-left:3px solid #e2e8f0}

    .np-ico{width:36px;height:36px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px}
    .ico-purple{background:#f3f0ff}
    .ico-red{background:#fff5f5}
    .ico-green{background:#f0fff4}
    .ico-amber{background:#fffbeb}
    .ico-blue{background:#ebf8ff}
    .ico-gray{background:#f7fafc}

    .np-body{flex:1;min-width:0}
    .np-item-top{display:flex;align-items:center;gap:4px;margin-bottom:2px}
    .np-item-title{font-size:11px;font-weight:700;color:#1a202c;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .np-prio{font-size:9px;padding:1px 6px;border-radius:10px;font-weight:700;background:#fff5f5;color:#c53030}
    .np-dot{width:6px;height:6px;border-radius:50%;background:#4361ee;flex-shrink:0}
    .np-dot-red{background:#e53e3e}
    .np-msg{font-size:11px;color:#718096;line-height:1.45;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .np-foot{display:flex;justify-content:space-between;align-items:center}
    .np-time{font-size:10px;color:#a0aec0;font-weight:500}
    .np-link{font-size:10px;color:#4361ee;font-weight:700;text-decoration:none}
    .np-link:hover{text-decoration:underline}

    .np-quick{display:flex;flex-direction:column;gap:3px;opacity:0;transition:opacity .12s;flex-shrink:0}
    .np-item:hover .np-quick{opacity:1}
    .np-qbtn{width:21px;height:21px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;color:#718096}
    .np-qbtn:hover{background:#ebf4ff;color:#4361ee;border-color:#93c5fd}
    .np-qbtn.del:hover{background:#fff5f5;color:#e53e3e;border-color:#feb2b2}

    .np-footer{padding:9px 15px;border-top:1px solid #edf2f7;display:flex;justify-content:space-between;align-items:center;background:#f7fafc}
    .np-foot-txt{font-size:10px;color:#a0aec0}
    .np-stats{display:flex;gap:5px}
    .np-stat{font-size:10px;padding:2px 8px;border-radius:10px;font-weight:700}
    .s-unread{background:#ebf4ff;color:#3b82f6}
    .s-high{background:#fff5f5;color:#c53030}
    .notif-overlay{position:fixed;inset:0;z-index:1000}

    .confirm-overlay{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}
    .confirm-box{background:#fff;border-radius:16px;padding:28px 24px;width:300px;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.2)}
    .confirm-icon{font-size:32px;margin-bottom:12px}
    .confirm-title{font-size:15px;font-weight:700;color:#1a202c;margin-bottom:6px}
    .confirm-msg{font-size:12px;color:#718096;line-height:1.5;margin-bottom:20px}
    .confirm-actions{display:flex;gap:10px;justify-content:center}
    .confirm-cancel{padding:8px 20px;border-radius:8px;border:1px solid #e2e8f0;background:#f7fafc;color:#4a5568;font-size:13px;font-weight:600;cursor:pointer}
    .confirm-cancel:hover{background:#edf2f7}
    .confirm-ok{padding:8px 20px;border-radius:8px;border:none;background:#e53e3e;color:#fff;font-size:13px;font-weight:600;cursor:pointer}
    .confirm-ok:hover{background:#c53030}
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
    this.subs.add(this.notifService.notifications$.subscribe(n => {
      this.notifications = n;
      this.highCount = n.filter(x => !x.is_read && x.priority === 'high').length;
      this.applyFilter();
    }));
    this.subs.add(this.notifService.unreadCount$.subscribe(c => this.unreadCount = c));
  }

  ngOnDestroy(): void {
    this.notifService.stopPolling();
    this.subs.unsubscribe();
  }

  searchQuery = '';

  goSearch() {
    if (!this.searchQuery.trim()) return;
    this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    this.searchQuery = '';
  }

  onSearchInput() {}

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

  activeFilter = 'all';
  filtered: Notification[] = [];
  highCount = 0;

  markAllAsRead(): void { this.notifService.markAllAsRead(); }

  setFilter(f: string): void {
    this.activeFilter = f;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.activeFilter === 'unread')    this.filtered = this.notifications.filter(n => !n.is_read);
    else if (this.activeFilter === 'high') this.filtered = this.notifications.filter(n => n.priority === 'high');
    else                                   this.filtered = this.notifications;
  }

  iconBg(n: Notification): string {
    const map: Record<string, string> = {
      course_enrolled: 'ico-blue', course_completed: 'ico-amber',
      quiz_passed: 'ico-green',    quiz_failed: 'ico-red',
      exercise_passed: 'ico-green', exercise_failed: 'ico-red',
      new_student: 'ico-purple',   student_completed: 'ico-amber',
      progress_milestone: 'ico-blue', new_course: 'ico-gray',
    };
    return map[n.type] || 'ico-gray';
  }

  quickRead(n: Notification): void    { this.notifService.markAsRead(n.id); }
  deleteNotif(n: Notification): void  { this.notifService.deleteNotification(n.id); }
  showConfirm = false;

  clearAll(): void { this.showConfirm = true; this.notifOpen = false; }

  confirmClearAll(): void {
    this.notifService.clearAll();
    this.showConfirm = false;
  }

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

  getAvatarUrl(): string {
    const url = this.user?.avatar_url || '';
    if (url.startsWith('/storage')) return 'http://localhost:8001' + url;
    return url;
  }
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
