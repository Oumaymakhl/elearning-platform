import { ConfirmService } from '../../services/confirm.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nw">
      <button class="bell-btn" (click)="togglePanel()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

      <div class="panel" *ngIf="open">
        <div class="ph">
          <div class="ph-top">
            <span class="ph-title">🔔 Notifications</span>
            <div class="ph-actions">
              <button class="btn-sm" (click)="markAllAsRead()" *ngIf="unreadCount > 0">✓ Tout lire</button>
              <button class="btn-sm red" (click)="clearAll()" *ngIf="notifications.length > 0">🗑</button>
            </div>
          </div>
          <div class="filters">
            <button class="ftab" [class.on]="activeFilter==='all'"    (click)="setFilter('all')">Toutes</button>
            <button class="ftab" [class.on]="activeFilter==='unread'" (click)="setFilter('unread')">Non lues</button>
            <button class="ftab" [class.on]="activeFilter==='high'"   (click)="setFilter('high')">Urgentes</button>
          </div>
        </div>

        <div class="list">
          <div class="empty" *ngIf="filtered.length === 0">
            <div style="font-size:28px">🔕</div>
            <div>Aucune notification</div>
          </div>

          <div class="item"
            *ngFor="let n of filtered"
            [class.unread]="!n.is_read"
            [class.p-high]="n.priority==='high'"
            [class.p-med]="n.priority==='medium'"
            [class.p-low]="n.priority==='low'"
            (click)="onClickNotif(n)">

            <div class="ico-wrap" [ngClass]="iconBg(n)">{{ n.icon }}</div>

            <div class="item-body">
              <div class="item-top">
                <span class="item-title">{{ n.title }}</span>
                <span class="prio-pill" *ngIf="n.priority==='high'">urgent</span>
                <span class="dot" [class.dot-red]="n.priority==='high'" *ngIf="!n.is_read"></span>
              </div>
              <div class="item-msg">{{ n.message }}</div>
              <div class="item-foot">
                <span class="item-time">{{ n.time_ago }}</span>
                <a class="item-link" *ngIf="n.action_url" [href]="n.action_url" (click)="$event.stopPropagation()">Voir →</a>
              </div>
            </div>

            <div class="quick">
              <button class="qbtn" *ngIf="!n.is_read" (click)="$event.stopPropagation(); markRead(n)">✓</button>
              <button class="qbtn del" (click)="$event.stopPropagation(); deleteNotif(n)">×</button>
            </div>
          </div>
        </div>

        <div class="panel-foot">
          <span class="foot-txt">{{ notifications.length }} notification(s)</span>
          <div class="foot-stats">
            <span class="stat-pill s-unread" *ngIf="unreadCount > 0">{{ unreadCount }} non lue(s)</span>
            <span class="stat-pill s-high" *ngIf="highCount > 0">{{ highCount }} urgente(s)</span>
          </div>
        </div>
      </div>

      <div class="overlay" *ngIf="open" (click)="open=false"></div>
    </div>
  `,
  styles: [`
    .nw { position: relative; }

    .bell-btn {
      position: relative; background: transparent; border: none;
      cursor: pointer; padding: 8px; border-radius: 10px; color: #4a5568;
      transition: background .15s;
    }
    .bell-btn:hover { background: rgba(0,0,0,.06); }
    .bell-btn svg { width: 22px; height: 22px; display: block; }

    .badge {
      position: absolute; top: 2px; right: 2px;
      background: #e53e3e; color: #fff; font-size: 10px; font-weight: 700;
      min-width: 17px; height: 17px; border-radius: 9px; padding: 0 4px;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
    }

    .panel {
      position: absolute; top: calc(100% + 8px); right: 0; z-index: 1000;
      width: 370px; background: #fff;
      border: 1px solid #e2e8f0; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,.12); overflow: hidden;
    }

    .ph { padding: 14px 16px 10px; border-bottom: 1px solid #edf2f7; }
    .ph-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .ph-title { font-size: 14px; font-weight: 700; color: #1a202c; }
    .ph-actions { display: flex; gap: 6px; }
    .btn-sm {
      font-size: 11px; color: #718096; background: #f7fafc;
      border: 1px solid #e2e8f0; border-radius: 6px;
      padding: 3px 9px; cursor: pointer; font-weight: 600;
    }
    .btn-sm:hover { background: #edf2f7; color: #2d3748; }
    .btn-sm.red:hover { background: #fff5f5; color: #e53e3e; border-color: #feb2b2; }

    .filters { display: flex; gap: 4px; }
    .ftab {
      font-size: 11px; padding: 4px 12px; border-radius: 20px;
      border: 1.5px solid transparent; cursor: pointer;
      color: #718096; background: transparent; font-weight: 500;
      transition: all .15s;
    }
    .ftab:hover { background: #f7fafc; }
    .ftab.on { background: #ebf4ff; color: #3b82f6; border-color: #93c5fd; font-weight: 700; }

    .list { max-height: 380px; overflow-y: auto; }
    .list::-webkit-scrollbar { width: 3px; }
    .list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

    .empty { padding: 44px 16px; text-align: center; color: #a0aec0; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px; }

    .item {
      display: flex; align-items: flex-start; gap: 11px;
      padding: 12px 16px; border-bottom: 1px solid #f7fafc;
      cursor: pointer; transition: background .12s; position: relative;
    }
    .item:last-child { border-bottom: none; }
    .item:hover { background: #f7fafc; }
    .item.unread { background: #f0f7ff; }
    .item.unread:hover { background: #e8f0fe; }
    .item.p-high { border-left: 3px solid #e53e3e; }
    .item.p-med  { border-left: 3px solid #4361ee; }
    .item.p-low  { border-left: 3px solid #e2e8f0; }

    .ico-wrap {
      width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 17px;
    }
    .ico-purple { background: #f3f0ff; }
    .ico-red    { background: #fff5f5; }
    .ico-green  { background: #f0fff4; }
    .ico-amber  { background: #fffbeb; }
    .ico-blue   { background: #ebf8ff; }
    .ico-gray   { background: #f7fafc; }

    .item-body { flex: 1; min-width: 0; }
    .item-top  { display: flex; align-items: center; gap: 5px; margin-bottom: 3px; }
    .item-title { font-size: 12px; font-weight: 700; color: #1a202c; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #4361ee; flex-shrink: 0; }
    .dot-red { background: #e53e3e; }
    .prio-pill { font-size: 9px; padding: 2px 7px; border-radius: 10px; font-weight: 700; background: #fff5f5; color: #c53030; }

    .item-msg { font-size: 11px; color: #718096; line-height: 1.5; margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .item-foot { display: flex; justify-content: space-between; align-items: center; }
    .item-time { font-size: 10px; color: #a0aec0; font-weight: 500; }
    .item-link { font-size: 10px; color: #4361ee; font-weight: 700; text-decoration: none; }
    .item-link:hover { text-decoration: underline; }

    .quick { display: flex; flex-direction: column; gap: 3px; opacity: 0; transition: opacity .15s; flex-shrink: 0; }
    .item:hover .quick { opacity: 1; }
    .qbtn {
      width: 22px; height: 22px; border-radius: 6px; border: 1px solid #e2e8f0;
      background: #fff; cursor: pointer; font-size: 11px;
      display: flex; align-items: center; justify-content: center; color: #718096;
    }
    .qbtn:hover { background: #ebf4ff; color: #4361ee; border-color: #93c5fd; }
    .qbtn.del:hover { background: #fff5f5; color: #e53e3e; border-color: #feb2b2; }

    .panel-foot {
      padding: 10px 16px; border-top: 1px solid #edf2f7;
      display: flex; justify-content: space-between; align-items: center; background: #f7fafc;
    }
    .foot-txt { font-size: 10px; color: #a0aec0; }
    .foot-stats { display: flex; gap: 6px; }
    .stat-pill { font-size: 10px; padding: 3px 9px; border-radius: 10px; font-weight: 700; }
    .s-unread { background: #ebf4ff; color: #3b82f6; }
    .s-high   { background: #fff5f5; color: #c53030; }

    .overlay { position: fixed; inset: 0; z-index: 999; }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  open = false;
  notifications: Notification[] = [];
  filtered: Notification[] = [];
  unreadCount = 0;
  highCount = 0;
  activeFilter = 'all';
  private subs = new Subscription();

  constructor(private notifService: NotificationService, private confirmSvc: ConfirmService) {}

  ngOnInit(): void {
    this.notifService.startPolling();
    this.notifService.requestBrowserPermission();
    this.subs.add(this.notifService.notifications$.subscribe(n => {
      this.notifications = n;
      this.highCount = n.filter(x => !x.is_read && x.priority === 'high').length;
      this.applyFilter();
    }));
    this.subs.add(this.notifService.unreadCount$.subscribe(c => this.unreadCount = c));
  }

  ngOnDestroy(): void { this.notifService.stopPolling(); this.subs.unsubscribe(); }

  togglePanel(): void { this.open = !this.open; }

  setFilter(f: string): void { this.activeFilter = f; this.applyFilter(); }

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

  onClickNotif(n: Notification): void {
    if (!n.is_read) this.notifService.markAsRead(n.id);
    if (n.action_url) window.location.href = n.action_url;
  }

  markRead(n: Notification): void    { this.notifService.markAsRead(n.id); }
  deleteNotif(n: Notification): void { this.notifService.deleteNotification(n.id); }
  markAllAsRead(): void              { this.notifService.markAllAsRead(); }
  clearAll(): void {
    if (confirm('Supprimer toutes les notifications ?')) this.notifService.clearAll();
  }
}
