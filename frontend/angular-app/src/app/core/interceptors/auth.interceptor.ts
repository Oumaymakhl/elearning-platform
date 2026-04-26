import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  const user = auth.getCurrentUser();

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (user) {
    try {
      headers['X-User-Data'] = btoa(unescape(encodeURIComponent(JSON.stringify({
        id: user.auth_id || user.id,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url || null
      }))));
    } catch(e) {}
  }

  if (Object.keys(headers).length > 0) {
    req = req.clone({ setHeaders: headers });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Nettoyer le storage
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        // Rediriger vers login avec rechargement complet
        router.navigate(['/login']).then(() => {
          window.location.reload();
        });
      }
      return throwError(() => error);
    })
  );
};
