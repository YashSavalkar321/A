import { Routes } from '@angular/router';
import { authGuard, adminGuard, facultyGuard, studentGuard, dashboardRedirectGuard, permissionGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'signup', loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent) },
  {
    path: '', loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard redirect — sends to role-specific dashboard
      { path: 'dashboard', canActivate: [dashboardRedirectGuard], children: [] },

      // Role-specific dashboards
      { path: 'dashboard/admin',   loadComponent: () => import('./pages/dashboard/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),     canActivate: [adminGuard] },
      { path: 'dashboard/faculty', loadComponent: () => import('./pages/dashboard/faculty-dashboard/faculty-dashboard.component').then(m => m.FacultyDashboardComponent), canActivate: [facultyGuard] },
      { path: 'dashboard/student', loadComponent: () => import('./pages/dashboard/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent), canActivate: [studentGuard] },
      { path: 'dashboard/generic', loadComponent: () => import('./pages/dashboard/generic-dashboard/generic-dashboard.component').then(m => m.GenericDashboardComponent) },

      // Entity pages — guarded by RBAC read permission
      { path: 'departments', loadComponent: () => import('./pages/departments/departments.component').then(m => m.DepartmentsComponent), canActivate: [permissionGuard('department')] },
      { path: 'classrooms',  loadComponent: () => import('./pages/classrooms/classrooms.component').then(m => m.ClassroomsComponent),   canActivate: [permissionGuard('classroom')] },
      { path: 'courses',     loadComponent: () => import('./pages/courses/courses.component').then(m => m.CoursesComponent),             canActivate: [permissionGuard('course')] },
      { path: 'instructors', loadComponent: () => import('./pages/instructors/instructors.component').then(m => m.InstructorsComponent), canActivate: [permissionGuard('instructor')] },
      { path: 'students',    loadComponent: () => import('./pages/students/students.component').then(m => m.StudentsComponent),           canActivate: [permissionGuard('student')] },
      { path: 'timeslots',   loadComponent: () => import('./pages/timeslots/timeslots.component').then(m => m.TimeslotsComponent),       canActivate: [permissionGuard('timeslot')] },
      { path: 'sections',    loadComponent: () => import('./pages/sections/sections.component').then(m => m.SectionsComponent),           canActivate: [permissionGuard('section')] },
      { path: 'teaches',     loadComponent: () => import('./pages/teaches/teaches.component').then(m => m.TeachesComponent),             canActivate: [permissionGuard('teaches')] },
      { path: 'takes',       loadComponent: () => import('./pages/takes/takes.component').then(m => m.TakesComponent),                   canActivate: [permissionGuard('takes')] },
      { path: 'advisors',    loadComponent: () => import('./pages/advisors/advisors.component').then(m => m.AdvisorsComponent),           canActivate: [permissionGuard('advisor')] },
      { path: 'prereqs',     loadComponent: () => import('./pages/prereqs/prereqs.component').then(m => m.PrereqsComponent),             canActivate: [permissionGuard('prereq')] },
      { path: 'reports',     loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),             canActivate: [permissionGuard('report')] },

      // Administration
      { path: 'users',       loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),   canActivate: [permissionGuard('users')] },
      { path: 'roles',       loadComponent: () => import('./pages/roles/roles.component').then(m => m.RolesComponent),   canActivate: [permissionGuard('roles')] },
    ]
  },
  { path: '**', redirectTo: '' }
];
