import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent), canActivate: [guestGuard] },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'my-courses', loadComponent: () => import('./pages/my-courses/my-courses.component').then(m => m.MyCoursesComponent), canActivate: [authGuard] },
  { path: 'courses', loadComponent: () => import('./pages/courses/courses-list.component').then(m => m.CoursesListComponent), canActivate: [authGuard] },
  { path: 'courses/create', loadComponent: () => import('./pages/courses/course-create.component').then(m => m.CourseCreateComponent), canActivate: [authGuard] },
  { path: 'courses/:id', loadComponent: () => import('./pages/courses/course-detail.component').then(m => m.CourseDetailComponent), canActivate: [authGuard] },
  { path: 'courses/:id/manage', loadComponent: () => import('./pages/chapters/chapter-manage.component').then(m => m.ChapterManageComponent), canActivate: [authGuard] },
  { path: 'reset-password', loadComponent: () => import('./pages/auth/reset-password.component').then(m => m.ResetPasswordComponent), canActivate: [guestGuard] },
  { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot-password.component').then(m => m.ForgotPasswordComponent), canActivate: [guestGuard] },
  { path: 'verify-email', loadComponent: () => import('./pages/auth/verify-email.component').then(m => m.VerifyEmailComponent) },
  { path: 'courses/:courseId/td/:subId', loadComponent: () => import('./pages/td/td-manage.component').then(m => m.TdManageComponent), canActivate: [authGuard] },
  { path: 'courses/:id/certificate', loadComponent: () => import('./pages/certificate/certificate.component').then(m => m.CertificateComponent), canActivate: [authGuard] },
  { path: 'students', loadComponent: () => import('./pages/students/students.component').then(m => m.StudentsComponent), canActivate: [authGuard] },
  { path: 'courses/:id/students', loadComponent: () => import('./pages/courses/course-students.component').then(m => m.CourseStudentsComponent), canActivate: [authGuard] },
  { path: 'quiz-manage/:courseId/:chapterId', loadComponent: () => import('./pages/quiz-manage/quiz-manage.component').then(m => m.QuizManageComponent), canActivate: [authGuard] },
  { path: 'quiz/:id', loadComponent: () => import('./pages/quiz/quiz.component').then(m => m.QuizComponent), canActivate: [authGuard] },
  { path: 'exercise/:id', loadComponent: () => import('./pages/exercise/exercise.component').then(m => m.ExerciseComponent), canActivate: [authGuard] },
  { path: 'teacher-approvals', loadComponent: () => import('./pages/admin/teacher-approval.component').then(m => m.TeacherApprovalComponent), canActivate: [authGuard] },
  { path: 'admin', loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent), canActivate: [authGuard] },
  { path: 'analytics', loadComponent: () => import('./pages/analytics/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent), canActivate: [authGuard] },
  { path: 'chatbot', loadComponent: () => import('./pages/chatbot/chatbot.component').then(m => m.ChatbotComponent), canActivate: [authGuard] },
  { path: 'certificates', loadComponent: () => import('./pages/certificates/certificates.component').then(m => m.CertificatesComponent), canActivate: [authGuard] },
  { path: 'courses/:id/forum', loadComponent: () => import('./pages/forum/forum.component').then(m => m.ForumComponent), canActivate: [authGuard] },
  { path: 'search', loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent), canActivate: [authGuard] },
  { path: 'messages', loadComponent: () => import('./pages/messaging/messaging.component').then(m => m.MessagingComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
