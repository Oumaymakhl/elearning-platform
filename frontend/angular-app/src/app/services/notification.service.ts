import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Subscription, interval } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Notification {
  id: number;
  type: string;
  data: any;
  priority: 'low' | 'medium' | 'high';
  icon: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
  title?: string;
  message?: string;
  is_read?: boolean;
  time_ago?: string;
}

export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return 'À l\'instant';
  if (diff < 3600)   return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400)  return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const TYPE_META: Record<string, { icon: string; title: string; priority: 'low'|'medium'|'high' }> = {
  course_enrolled:      { icon: '📚', title: 'Inscription confirmée',      priority: 'medium' },
  course_completed:     { icon: '🎓', title: 'Cours terminé',              priority: 'high'   },
  quiz_passed:          { icon: '✅', title: 'Quiz réussi',                priority: 'medium' },
  quiz_failed:          { icon: '❌', title: 'Quiz non réussi',            priority: 'medium' },
  exercise_passed:      { icon: '💻', title: 'TD réussi',                  priority: 'medium' },
  exercise_failed:      { icon: '⚠️',  title: 'TD : tests échouent',       priority: 'low'    },
  new_student:          { icon: '👤', title: 'Nouvel étudiant inscrit',    priority: 'low'    },
  student_completed:    { icon: '🏆', title: 'Étudiant a terminé',         priority: 'medium' },
  student_quiz_done:    { icon: '📊', title: 'Quiz soumis',                priority: 'low'    },
  student_exercise_done:{ icon: '🔧', title: 'TD soumis',                  priority: 'low'    },
  progress_milestone:   { icon: '🌟', title: 'Étape atteinte',             priority: 'low'    },
  new_course:           { icon: '🆕', title: 'Nouveau cours disponible',   priority: 'low'    },
  new_message:          { icon: '💬', title: 'Nouveau message',            priority: 'medium' },
};

export function parseNotification(n: any): Notification {
  let data: any = {};
  try { data = typeof n.data === 'string' ? JSON.parse(n.data) : (n.data ?? {}); } catch (_) {}

  const meta     = TYPE_META[n.type] ?? { icon: 'ℹ️', title: n.type, priority: 'low' };
  const title    = data.title   || meta.title;
  const message  = data.message || data.course_title || data.quiz_title || data.exercise_title || '';
  const icon     = n.icon       || meta.icon;
  const priority = n.priority   || meta.priority;

  return {
    ...n,
    data,
    title,
    message,
    icon,
    priority,
    action_url: n.action_url || data.action_url || null,
    is_read:    !!n.read_at,
    time_ago:   timeAgo(n.created_at),
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private apiUrl = '/api/notifications';
  private eventSource?: EventSource;
  private lastId  = 0;
  private pollSub?: Subscription;

  notifications$   = new BehaviorSubject<Notification[]>([]);
  unreadCount$     = new BehaviorSubject<number>(0);
  highPriorityNew$ = new BehaviorSubject<Notification | null>(null);

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + (localStorage.getItem('token') || '') });
  }

  startPolling(): void {
    this.fetchNotifications();
    this.connectSSE();
  }

  private connectSSE(): void {
    this.closeSSE();
    const token = localStorage.getItem('token') || '';
    const url   = `${this.apiUrl}/stream?lastId=${this.lastId}&token=${token}`;
    try {
      this.eventSource = new EventSource(url);
      this.eventSource.onmessage = (event) => {
        try {
          const notif   = parseNotification(JSON.parse(event.data));
          if (!notif.message) return;
          const current = this.notifications$.value;
          if (!current.some(n => n.id === notif.id)) {
            const updated = [notif, ...current];
            this.notifications$.next(updated);
            this.unreadCount$.next(updated.filter(n => !n.read_at).length);
            this.lastId = Math.max(this.lastId, notif.id);
            this.showBrowserNotification(notif);
            if (notif.priority === 'high') this.highPriorityNew$.next(notif);
          }
        } catch {}
      };
      this.eventSource.onerror = () => { this.closeSSE(); this.startFallbackPolling(); };
    } catch { this.startFallbackPolling(); }
  }

  private startFallbackPolling(): void {
    if (!this.pollSub) {
      this.pollSub = interval(15000).pipe(
        switchMap(() => this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(catchError(() => of(null))))
      ).subscribe(res => { if (res) this.updateFromResponse(res); });
    }
  }

  private closeSSE(): void {
    if (this.eventSource) { this.eventSource.close(); this.eventSource = undefined; }
  }

  private updateFromResponse(res: any): void {
    const raw  = res.data || res.notifications || res || [];
    const list = (Array.isArray(raw) ? raw : [])
      .map(parseNotification)
      .filter((n: any) => n.message);
    this.notifications$.next(list);
    this.unreadCount$.next(list.filter((n: any) => !n.read_at).length);
    if (list.length > 0) this.lastId = Math.max(...list.map((n: any) => n.id));
  }

  fetchNotifications(): void {
    this.http.get<any>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(catchError(() => of(null)))
      .subscribe(res => { if (res) this.updateFromResponse(res); });
  }

  private showBrowserNotification(notif: Notification): void {
    if ('Notification' in window && (window as any).Notification.permission === 'granted') {
      new (window as any).Notification(notif.title || 'Notification', {
        body: notif.message, icon: '/favicon.ico', tag: 'notif-' + notif.id,
      });
    }
  }

  requestBrowserPermission(): void {
    if ('Notification' in window) (window as any).Notification.requestPermission();
  }

  markAsRead(id: number): void {
    this.http.post(this.apiUrl + '/' + id + '/read', {}, { headers: this.getHeaders() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.fetchNotifications());
  }

  markAllAsRead(): void {
    this.http.post(this.apiUrl + '/read-all', {}, { headers: this.getHeaders() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.fetchNotifications());
  }

  deleteNotification(id: number): void {
    this.http.delete(this.apiUrl + '/' + id, { headers: this.getHeaders() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        const updated = this.notifications$.value.filter(n => n.id !== id);
        this.notifications$.next(updated);
        this.unreadCount$.next(updated.filter(n => !n.read_at).length);
      });
  }

  clearAll(): void {
    this.http.delete(this.apiUrl + '/clear-all', { headers: this.getHeaders() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => { this.notifications$.next([]); this.unreadCount$.next(0); });
  }

  stopPolling(): void {
    this.closeSSE();
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  ngOnDestroy(): void { this.stopPolling(); }
}
