import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ─── Auth (public) ─────────────────────────────────────────────────────
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },

  // ─── Exam interface (fullscreen, outside layout) ───────────────────────
  {
    path: 'take-exam/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['STUDENT'] },
    loadComponent: () => import('./features/take-exam/exam-interface/exam-interface.component').then(m => m.ExamInterfaceComponent),
  },

  // ─── Protected layout shell ────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [

      // Dashboard (all roles)
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },

      // Admin: user management
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent),
      },

      // Questions (ADMIN, FACULTY)
      {
        path: 'questions',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'FACULTY'] },
        children: [
          { path: '', loadComponent: () => import('./features/questions/question-list/question-list.component').then(m => m.QuestionListComponent) },
          { path: 'new', loadComponent: () => import('./features/questions/question-form/question-form.component').then(m => m.QuestionFormComponent) },
          { path: ':id/edit', loadComponent: () => import('./features/questions/question-form/question-form.component').then(m => m.QuestionFormComponent) },
        ]
      },

      // Exams (ADMIN, FACULTY)
      {
        path: 'exams',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'FACULTY'] },
        children: [
          { path: '', loadComponent: () => import('./features/exams/exam-list/exam-list.component').then(m => m.ExamListComponent) },
          { path: 'new', loadComponent: () => import('./features/exams/exam-form/exam-form.component').then(m => m.ExamFormComponent) },
          { path: ':id/edit', loadComponent: () => import('./features/exams/exam-form/exam-form.component').then(m => m.ExamFormComponent) },
          { path: ':id/monitor', loadComponent: () => import('./features/exams/exam-monitor/exam-monitor.component').then(m => m.ExamMonitorComponent) },
        ]
      },

      // Reports (ADMIN, FACULTY)
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'FACULTY'] },
        loadComponent: () => import('./features/reports/report-generator/report-generator.component').then(m => m.ReportGeneratorComponent),
      },

      // Student exams
      {
        path: 'my-exams',
        canActivate: [roleGuard],
        data: { roles: ['STUDENT'] },
        children: [
          { path: '', loadComponent: () => import('./features/take-exam/available-exams/available-exams.component').then(m => m.AvailableExamsComponent) },
          { path: ':id/result', loadComponent: () => import('./features/take-exam/exam-result/exam-result.component').then(m => m.ExamResultComponent) },
        ]
      },

      // Unauthorized
      { path: 'unauthorized', loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent) },

      // Default
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },

  { path: '**', redirectTo: 'auth' }
];
