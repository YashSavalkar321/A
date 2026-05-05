import { Component, inject, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  path:  string;
  icon:  string;
  roles: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-slate-50">

      <!-- Sidebar -->
      <aside class="w-64 flex-shrink-0 bg-navy-900 text-slate-200 flex flex-col">
        <!-- Brand -->
        <div class="h-16 flex items-center px-6 border-b border-navy-700">
          <span class="text-xl font-bold text-white tracking-tight">ExamPortal</span>
        </div>

        <!-- User info -->
        <div class="px-4 py-4 border-b border-navy-700/60">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-sky-600 flex items-center justify-center
                        text-white font-semibold text-sm flex-shrink-0">
              {{ initials() }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-white truncate">{{ user()?.fullName }}</p>
              <p class="text-xs text-navy-300 truncate capitalize">{{ user()?.role?.toLowerCase() }}</p>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          @for (item of visibleNav(); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="bg-navy-700 text-white"
               [routerLinkActiveOptions]="{ exact: item.path.includes('dashboard') }"
               class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                      text-navy-300 hover:bg-navy-800 hover:text-white transition-colors">
              <span class="text-base w-5 text-center">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- Logout -->
        <div class="p-4 border-t border-navy-700/60">
          <button (click)="logout()"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm
                         text-navy-400 hover:bg-red-900/40 hover:text-red-300 transition-colors">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top bar -->
        <header class="h-16 bg-white border-b border-slate-200 flex items-center px-6
                       justify-between shadow-sm flex-shrink-0">
          <h1 class="text-base font-semibold text-slate-700">{{ pageTitle() }}</h1>
          <div class="text-sm text-slate-500">
            Welcome, <span class="font-medium text-slate-800">{{ user()?.fullName }}</span>
          </div>
        </header>

        <!-- Content -->
        <main class="flex-1 p-6 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit {
  private auth   = inject(AuthService);
  private router = inject(Router);

  user = this.auth.user;

  initials = computed(() => {
    const name = this.user()?.fullName ?? '';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  });

  private allNav: NavItem[] = [
    { label: 'Dashboard',   path: '/dashboard',    icon: '📊', roles: ['ADMIN','FACULTY','STUDENT'] },
    { label: 'Users',       path: '/users',        icon: '👥', roles: ['ADMIN'] },
    { label: 'Questions',   path: '/questions',    icon: '❓', roles: ['ADMIN','FACULTY'] },
    { label: 'Exams',       path: '/exams',        icon: '📋', roles: ['ADMIN','FACULTY'] },
    { label: 'Reports',     path: '/reports',      icon: '📈', roles: ['ADMIN','FACULTY'] },
    { label: 'My Exams',    path: '/my-exams',     icon: '✏️', roles: ['STUDENT'] },
  ];

  visibleNav = computed(() => {
    const role = this.auth.primaryRole();
    return this.allNav.filter(nav => nav.roles.includes(role));
  });

  pageTitle = computed(() => {
    const url = this.router.url;
    if (url.includes('dashboard')) return 'Dashboard';
    if (url.includes('users'))     return 'User Management';
    if (url.includes('questions')) return 'Question Bank';
    if (url.includes('monitor'))   return 'Live Exam Monitor';
    if (url.includes('exams'))     return 'Exam Management';
    if (url.includes('reports'))   return 'Reports & Analytics';
    return 'ExamPortal';
  });

  ngOnInit() {
    // Redirect root to role-specific dashboard
    if (this.router.url === '/' || this.router.url === '') {
      this.router.navigate([this.auth.dashboardRoute]);
    }
  }

  logout() { this.auth.logout(); }
}
