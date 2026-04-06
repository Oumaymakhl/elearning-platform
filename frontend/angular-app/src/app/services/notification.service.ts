import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Subscription, interval } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Notification {
  id: number;
  type: string;
  data: any;
  read_at: string | null;
  created_at: string;
  title?: string;
  message?: string;
  is_read?: boolean;
}

export function parseNotification(n: any): Notification {
  let data: any = {};
  try { data = typeof n.data === 'string' ? JSON.parse(n.data) : n.data; } catch(_) {}

  const titles: Record<string, string> = {
    course_enrolled:  '📚 Inscription au cours',
    course_completed: '🎉 Cours terminé',
    quiz_passed:      '✅ Quiz réussi',
    quiz_failed:      '❌ Quiz échoué',
    new_message:      '💬 Nouveau message',
    new_course:       '🆕 Nouveau cours disponible',
    info:             'ℹ️ Information',
  };

  const title   = data.title   || titles[n.type] || n.type;
  let   message = data.message || '';
  if (!message) {
    if (data.course_title) message = data.course_title;
    else if (data.email)   message = data.email;
    else                   message = JSON.stringify(data);
  }

  return { ...n, data, title, message, is_read: !!n.read_at };
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private apiUrl   = 'http://localhost:8006/api';
  private eventSource?: EventSource;
  private lastId   = 0;
  private pollSub?: Subscription;

  notifications$ = new BehaviorSubject<Notification[]>([]);
  unreadCount$   = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: 'Bearer ' + token });
  }

  startPolling(): void {
    this.fetchNotifications();
    this.connectSSE();
  }

  private connectSSE(): void {
    this.closeSSE();
    const token = localStorage.getItem('token') || '';
    const url   = `${this.apiUrl}/notifications/stream?lastId=${this.lastId}&token=${token}`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onmessage = (event) => {
        try {
          const raw  = JSON.parse(event.data);
          const notif = parseNotification(raw);
          if (notif.message && notif.message !== '[]' && notif.message !== '{}') {
            const current = this.notifications$.value;
            const exists  = current.some(n => n.id === notif.id);
            if (!exists) {
              const updated = [notif, ...current];
              this.notifications$.next(updated);
              this.unreadCount$.next(updated.filter(n => !n.read_at).length);
              this.lastId = Math.max(this.lastId, notif.id);
              this.showBrowserNotification(notif);
            }
          }
        } catch {}
      };

      this.eventSource.onerror = () => {
        this.closeSSE();
        // Fallback polling toutes les 15s si SSE échoue
        if (!this.pollSub) {
          this.pollSub = interval(15000).pipe(
            switchMap(() => this.http.get<any>(this.apiUrl + '/notifications', { headers: this.getHeaders() }).pipe(catchError(() => of(null))))
          ).subscribe(res => {
            if (res) this.updateFromResponse(res);
          });
        }
      };

    } catch {
      // SSE non supporté — fallback polling
      this.pollSub = interval(15000).pipe(
        switchMap(() => this.http.get<any>(this.apiUrl + '/notifications', { headers: this.getHeaders() }).pipe(catchError(() => of(null))))
      ).subscribe(res => { if (res) this.updateFromResponse(res); });
    }
  }

  private closeSSE(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

  private updateFromResponse(res: any): void {
    const raw  = res.data || res.notifications || res || [];
    const list = raw.map(parseNotification).filter((n: any) => n.message && n.message !== '[]' && n.message !== '{}');
    this.notifications$.next(list);
    this.unreadCount$.next(list.filter((n: any) => !n.read_at).length);
    if (list.length > 0) this.lastId = Math.max(...list.map((n: any) => n.id));
  }

  fetchNotifications(): void {
    this.http.get<any>(this.apiUrl + '/notifications', { headers: this.getHeaders() })
      .pipe(catchError(() => of(null)))
      .subscribe(res => { if (res) this.updateFromResponse(res); });
  }

  private showBrowserNotification(notif: Notification): void {
    if ('Notification' in window && (window as any).Notification.permission === 'granted') {
      new (window as any).Notification(notif.title || 'Nouvelle notification', {
        body: notif.message,
        icon: '/favicon.ico'
      });
    }
  }

  requestBrowserPermission(): void {
    if ('Notification' in window) {
      (window as any).Notification.requestPermission();
    }
  }

  markAsRead(id: number): void {
    this.http.post(this.apiUrl + '/notifications/' + id + '/read', {}, { headers: this.getHeaders() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.fetchNotifications());
  }

  markAllAsRead(): void {
    this.http.post(this.apiUrl + '/notifications/read-all', {}, { headers: this.getHeaders() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.fetchNotifications());
  }

  stopPolling(): void {
    this.closeSSE();
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  ngOnDestroy(): void { this.stopPolling(); }
}
