import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Notification {
  id: number;
  type: string;
  data: any;
  read_at: string | null;
  created_at: string;
  // champs calculés
  title?: string;
  message?: string;
  is_read?: boolean;
}

export function parseNotification(n: any): Notification {
  let data: any = {};
  try { data = typeof n.data === 'string' ? JSON.parse(n.data) : n.data; } catch(_) {}

  const titles: Record<string, string> = {
    course_enrolled:   '📚 Inscription au cours',
    course_completed:  '🎉 Cours terminé',
    quiz_passed:       '✅ Quiz réussi',
    quiz_failed:       '❌ Quiz échoué',
    new_message:       '💬 Nouveau message',
    new_course:        '🆕 Nouveau cours disponible',
    info:              'ℹ️ Information',
  };

  const title = data.title || titles[n.type] || n.type;

  let message = data.message || '';
  if (!message) {
    if (data.course_title) message = data.course_title;
    else if (data.email)   message = data.email;
    else                   message = JSON.stringify(data);
  }

  return { ...n, data, title, message, is_read: !!n.read_at };
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private apiUrl = 'http://localhost:8006/api';
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
    this.pollSub = interval(15000).pipe(
      switchMap(() => this.http.get<any>('http://localhost:8006/api/notifications', { headers: this.getHeaders() }).pipe(catchError(() => of(null))))
    ).subscribe(res => {
      if (res) {
        const raw = res.data || res.notifications || res || [];
        const list = raw.map(parseNotification).filter((n: any) => n.message && n.message !== "[]" && n.message !== "{}");
        this.notifications$.next(list);
        this.unreadCount$.next(list.filter((n: any) => !n.read_at).length);
      }
    });
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
  }

  fetchNotifications(): void {
    this.http.get<any>(this.apiUrl + '/notifications', { headers: this.getHeaders() })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (res) {
          const raw = res.data || res.notifications || res || [];
        const list = raw.map(parseNotification).filter((n: any) => n.message && n.message !== "[]" && n.message !== "{}");
          this.notifications$.next(list);
          this.unreadCount$.next(list.filter((n: any) => !n.read_at).length);
        }
      });
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

  ngOnDestroy(): void { this.stopPolling(); }
}
