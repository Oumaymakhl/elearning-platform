import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent), canActivate: [guestGuard] },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'courses', loadComponent: () => import('./pages/courses/courses-list.component').then(m => m.CoursesListComponent), canActivate: [authGuard] },
  { path: 'courses/create', loadComponent: () => import('./pages/courses/course-create.component').then(m => m.CourseCreateComponent), canActivate: [authGuard] },
  { path: 'courses/:id', loadComponent: () => import('./pages/courses/course-detail.component').then(m => m.CourseDetailComponent), canActivate: [authGuard] },
  { path: 'courses/:id/manage', loadComponent: () => import('./pages/chapters/chapter-manage.component').then(m => m.ChapterManageComponent), canActivate: [authGuard] },
  { path: 'quiz/:id', loadComponent: () => import('./pages/quiz/quiz.component').then(m => m.QuizComponent), canActivate: [authGuard] },
  { path: 'exercise/:id', loadComponent: () => import('./pages/exercise/exercise.component').then(m => m.ExerciseComponent), canActivate: [authGuard] },
  { path: 'chatbot', loadComponent: () => import('./pages/chatbot/chatbot.component').then(m => m.ChatbotComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
