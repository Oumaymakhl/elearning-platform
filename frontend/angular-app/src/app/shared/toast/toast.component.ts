import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

interface Toast extends Notification {
  visible: boolean;
  removing: boolean;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div class="toast"
        *ngFor="let t of toasts"
        [class.removing]="t.removing"
        [class.t-high]="t.priority==='high'"
        [class.t-med]="t.priority==='medium'"
        [class.t-low]="t.priority==='low'">

        <div class="toast-ico" [ngClass]="iconBg(t)">{{ t.icon }}</div>

        <div class="toast-body">
          <div class="toast-title">{{ t.title }}</div>
          <div class="toast-msg">{{ t.message }}</div>
          <a class="toast-link" *ngIf="t.action_url" [href]="t.action_url">Voir →</a>
        </div>

        <button class="toast-close" (click)="remove(t)">×</button>

        <div class="toast-bar" [class.bar-high]="t.priority==='high'"></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 24px; right: 24px;
      z-index: 9999; display: flex; flex-direction: column;
      gap: 10px; align-items: flex-end;
    }

    .toast {
      display: flex; align-items: flex-start; gap: 11px;
      background: #fff; border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 8px 28px rgba(0,0,0,.13);
      padding: 13px 14px 16px;
      width: 340px; position: relative; overflow: hidden;
      animation: slide-in .25s cubic-bezier(.34,1.56,.64,1);
      transition: opacity .3s, transform .3s;
    }
    .toast.removing {
      opacity: 0; transform: translateX(20px);
    }
    .toast.t-high { border-left: 4px solid #e53e3e; }
    .toast.t-med  { border-left: 4px solid #4361ee; }
    .toast.t-low  { border-left: 4px solid #cbd5e0; }

    @keyframes slide-in {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .toast-ico {
      width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .ico-purple { background: #f3f0ff; }
    .ico-red    { background: #fff5f5; }
    .ico-green  { background: #f0fff4; }
    .ico-amber  { background: #fffbeb; }
    .ico-blue   { background: #ebf8ff; }
    .ico-gray   { background: #f7fafc; }

    .toast-body { flex: 1; min-width: 0; }
    .toast-title {
      font-size: 13px; font-weight: 700; color: #1a202c; margin-bottom: 3px;
    }
    .toast-msg {
      font-size: 12px; color: #718096; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .toast-link {
      font-size: 11px; color: #4361ee; font-weight: 700;
      text-decoration: none; margin-top: 4px; display: inline-block;
    }
    .toast-link:hover { text-decoration: underline; }

    .toast-close {
      position: absolute; top: 8px; right: 8px;
      background: none; border: none; cursor: pointer;
      font-size: 16px; color: #a0aec0; line-height: 1;
      padding: 2px 5px; border-radius: 4px;
    }
    .toast-close:hover { background: #f7fafc; color: #4a5568; }

    .toast-bar {
      position: absolute; bottom: 0; left: 0;
      height: 3px; background: #4361ee; border-radius: 0 0 14px 14px;
      animation: shrink 5s linear forwards;
    }
    .toast-bar.bar-high { background: #e53e3e; animation-duration: 7s; }

    @keyframes shrink {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private seen = new Set<number>();
  private subs = new Subscription();

  constructor(private notifService: NotificationService) {}

  ngOnInit(): void {
    // Premier chargement — marquer toutes comme "déjà vues" sans toast
    this.subs.add(
      this.notifService.notifications$.subscribe(list => {
        if (!this.initialized) {
          list.forEach(n => this.seen.add(n.id));
          this.initialized = true;
          return;
        }
        // Après init — toaster seulement les nouvelles
        list.forEach(n => {
          if (!this.seen.has(n.id)) this.addToast(n);
        });
      })
    );
  }

  initialized = false;

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  addToast(n: Notification): void {
    if (this.seen.has(n.id)) return;
    this.seen.add(n.id);
    const toast: Toast = { ...n, visible: true, removing: false };
    this.toasts = [toast, ...this.toasts].slice(0, 5);
    const duration = n.priority === 'high' ? 7000 : 5000;
    setTimeout(() => this.remove(toast), duration);
  }

  remove(t: Toast): void {
    t.removing = true;
    setTimeout(() => {
      this.toasts = this.toasts.filter(x => x.id !== t.id);
    }, 320);
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
}
