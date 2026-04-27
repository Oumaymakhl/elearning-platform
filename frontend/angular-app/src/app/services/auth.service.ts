import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();
  constructor(private http: HttpClient) {
  }
  private getUserFromStorage(): any {
    if (typeof localStorage === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  private refreshProfile() {
    const token = this.getToken();
    if (!token) return;
    this.http.get<any>('/api/me', {
      headers: { Authorization: 'Bearer ' + token }
    }).subscribe({
      next: (profile) => {
        const current = this.currentUserSubject.value;
        const full = {
          ...current,
          ...profile,
          avatar_url: profile.avatar_url || (profile.avatar ? '/storage/' + profile.avatar : current?.avatar_url) || null
        };
        localStorage.setItem('user', JSON.stringify(full));
        this.currentUserSubject.next(full);
      },
      error: () => {}
    });
  }
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res: any) => {
        if (res.authorization?.token) {
          localStorage.setItem('token', res.authorization.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          this.http.get<any>('/api/me', { headers: { Authorization: 'Bearer ' + res.authorization.token } })
            .subscribe(profile => {
              const full = {
                ...res.user,
                ...profile,
                avatar_url: profile.avatar_url || (profile.avatar ? '/storage/' + profile.avatar : null)
              };
              localStorage.setItem('user', JSON.stringify(full));
              this.currentUserSubject.next(full);
            });
        }
      })
    );
  }
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
      })
    );
  }
  getToken(): string | null { if (typeof localStorage === 'undefined') return null; return localStorage.getItem('token'); }
  getUserId(): number | null { const u = this.getCurrentUser(); return u ? u.id : null; }
  getCurrentUser(): any { return this.currentUserSubject.value; }
  isLoggedIn(): boolean { return !!this.getToken(); }
  isAdmin(): boolean { return this.getCurrentUser()?.role === 'admin'; }
  isTeacher(): boolean { return this.getCurrentUser()?.role === 'teacher'; }
  isStudent(): boolean { return this.getCurrentUser()?.role === 'student'; }
  registerWithFormData(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, formData);
  }
}
