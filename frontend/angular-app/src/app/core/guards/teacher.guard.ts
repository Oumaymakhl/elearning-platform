import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const teacherGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isTeacher() || auth.isAdmin()) return true;
  return router.navigate(['/dashboard']);
};
