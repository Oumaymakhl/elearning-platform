import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-wrapper">
      <button class="notif-btn" (click)="togglePanel()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="notif-badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

      <div class="notif-panel" *ngIf="open">
        <div class="notif-header">
          <span>🔔 Notifications</span>
          <button class="read-all" (click)="markAllAsRead()" *ngIf="unreadCount > 0">
            Tout lire
          </button>
        </div>

        <div class="notif-empty" *ngIf="notifications.length === 0">
          Aucune notification
        </div>

        <div class="notif-list">
          <div
            class="notif-item"
            [class.unread]="!n.is_read"
            *ngFor="let n of notifications"
            (click)="markAsRead(n)"
          >
            <div class="notif-dot" *ngIf="!n.is_read"></div>
            <div class="notif-content">
              <div class="notif-title">{{ n.title }}</div>
              <div class="notif-msg">{{ n.message }}</div>
              <div class="notif-time">{{ formatTime(n.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="notif-overlay" *ngIf="open" (click)="open = false"></div>
    </div>
  `,
  styles: [`
    .notif-wrapper { position: relative; }

    .notif-btn {
      position: relative; background: transparent; border: none;
      cursor: pointer; padding: 6px; border-radius: 8px;
      color: #4a5568; transition: background .15s;
    }
    .notif-btn:hover { background: #e8edf7; }
    .notif-btn svg { width: 22px; height: 22px; display: block; }

    .notif-badge {
      position: absolute; top: 2px; right: 2px;
      background: #e53e3e; color: #fff;
      font-size: .6rem; font-weight: 700;
      min-width: 16px; height: 16px;
      border-radius: 8px; padding: 0 4px;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
    }

    .notif-panel {
      position: absolute; top: calc(100% + 8px); right: 0; z-index: 1000;
      width: 340px; background: #fff;
      border: 1.5px solid #e2e8f0; border-radius: 14px;
      box-shadow: 0 8px 30px rgba(0,0,0,.12);
      overflow: hidden;
    }

    .notif-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; background: #f6f8fc;
      border-bottom: 1px solid #e2e8f0;
      font-size: .85rem; font-weight: 700; color: #1a2332;
    }

    .read-all {
      font-size: .75rem; color: #4361ee; background: none;
      border: none; cursor: pointer; font-weight: 600;
    }
    .read-all:hover { text-decoration: underline; }

    .notif-empty {
      padding: 32px 16px; text-align: center;
      color: #94a3b8; font-size: .85rem;
    }

    .notif-list { max-height: 380px; overflow-y: auto; }

    .notif-item {
      display: flex; gap: 10px; padding: 12px 16px;
      border-bottom: 1px solid #f0f4f8; cursor: pointer;
      transition: background .15s; position: relative;
    }
    .notif-item:hover { background: #f6f8fc; }
    .notif-item.unread { background: #f0f4ff; }
    .notif-item.unread:hover { background: #e8eef9; }

    .notif-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #4361ee; flex-shrink: 0; margin-top: 5px;
    }

    .notif-content { flex: 1; min-width: 0; }
    .notif-title { font-size: .82rem; font-weight: 700; color: #1a2332; margin-bottom: 2px; }
    .notif-msg { font-size: .78rem; color: #64748b; line-height: 1.4; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-time { font-size: .7rem; color: #94a3b8; }

    .notif-overlay {
      position: fixed; inset: 0; z-index: 999;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  open = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  private subs = new Subscription();

  constructor(private notifService: NotificationService) {}

  ngOnInit(): void {
    this.notifService.startPolling();
    this.subs.add(this.notifService.notifications$.subscribe(n => this.notifications = n));
    this.subs.add(this.notifService.unreadCount$.subscribe(c => this.unreadCount = c));
  }

  ngOnDestroy(): void {
    this.notifService.stopPolling();
    this.subs.unsubscribe();
  }

  togglePanel(): void { this.open = !this.open; }

  markAsRead(n: Notification): void {
    if (!n.is_read) this.notifService.markAsRead(n.id);
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
}
