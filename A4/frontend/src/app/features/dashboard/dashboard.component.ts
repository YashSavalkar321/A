import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- ═══ ADMIN DASHBOARD ═══ -->
    @if (auth.isAdmin()) {
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p class="text-slate-500 text-sm mt-1">Platform-wide overview and control centre</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="stat-card">
            <span class="stat-label">Total Users</span>
            <span class="stat-value text-navy-700">{{ stats()?.totalUsers ?? '—' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Exams</span>
            <span class="stat-value text-navy-700">{{ stats()?.totalExams ?? '—' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Questions in Bank</span>
            <span class="stat-value text-navy-700">{{ stats()?.totalQuestions ?? '—' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Completed Attempts</span>
            <span class="stat-value text-navy-700">{{ stats()?.totalAttempts ?? '—' }}</span>
          </div>
        </div>

        @if (stats()?.roleBreakdown) {
          <div class="card p-6">
            <h3 class="font-semibold text-slate-800 mb-4">User Roles</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              @for (r of stats()!.roleBreakdown; track r.name) {
                <div class="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                       [class.bg-red-500]="r.name === 'ADMIN'"
                       [class.bg-navy-600]="r.name === 'FACULTY'"
                       [class.bg-sky-600]="r.name === 'STUDENT'">
                    {{ r.count }}
                  </div>
                  <span class="text-sm text-slate-700 font-medium">{{ r.name }}</span>
                </div>
              }
            </div>
          </div>
        }

        @if (stats()?.recentActivity?.length) {
          <div class="card overflow-hidden">
            <div class="p-5 border-b border-slate-200">
              <h3 class="font-semibold text-slate-800">Recent Completions</h3>
            </div>
            <div class="divide-y divide-slate-100">
              @for (a of stats()!.recentActivity; track $index) {
                <div class="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <span class="text-sm text-slate-800 font-medium">{{ a.student }}</span>
                    <span class="text-sm text-slate-500 mx-2">→</span>
                    <span class="text-sm text-slate-700">{{ a.exam }}</span>
                  </div>
                  <span class="text-sm text-slate-500">Score: {{ a.score ?? '—' }}</span>
                </div>
              }
            </div>
          </div>
        }

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a routerLink="/users" class="card p-5 text-center hover:border-navy-400 transition-colors">
            <span class="text-2xl block mb-2">👥</span>
            <span class="text-sm font-medium text-slate-700">Manage Users</span>
          </a>
          <a routerLink="/questions" class="card p-5 text-center hover:border-navy-400 transition-colors">
            <span class="text-2xl block mb-2">📝</span>
            <span class="text-sm font-medium text-slate-700">Questions</span>
          </a>
          <a routerLink="/exams" class="card p-5 text-center hover:border-navy-400 transition-colors">
            <span class="text-2xl block mb-2">📋</span>
            <span class="text-sm font-medium text-slate-700">Exams</span>
          </a>
          <a routerLink="/reports" class="card p-5 text-center hover:border-navy-400 transition-colors">
            <span class="text-2xl block mb-2">📊</span>
            <span class="text-sm font-medium text-slate-700">Reports</span>
          </a>
        </div>
      </div>
    }

    <!-- ═══ FACULTY DASHBOARD ═══ -->
    @if (auth.isFaculty() && !auth.isAdmin()) {
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Faculty Dashboard</h1>
          <p class="text-slate-500 text-sm mt-1">Manage your exams and question bank</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div class="stat-card">
            <span class="stat-label">My Exams</span>
            <span class="stat-value text-navy-700">{{ stats()?.myExams?.length ?? 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">My Questions</span>
            <span class="stat-value text-navy-700">{{ stats()?.myQuestionCount ?? 0 }}</span>
          </div>
        </div>

        @if (stats()?.myExams?.length) {
          <div class="card overflow-hidden">
            <div class="p-5 border-b border-slate-200">
              <h3 class="font-semibold text-slate-800">My Exams</h3>
            </div>
            <div class="divide-y divide-slate-100">
              @for (e of stats()!.myExams; track e.id) {
                <div class="flex items-center justify-between px-5 py-3">
                  <div>
                    <span class="text-sm text-slate-800 font-medium">{{ e.title }}</span>
                    <span class="text-xs text-slate-400 ml-2">{{ e.question_count }} Qs · {{ e.attempt_count }} attempts</span>
                  </div>
                  <div class="flex items-center gap-3">
                    @if (e.avg_score !== null) {
                      <span class="text-xs text-slate-500">Avg: {{ e.avg_score }}</span>
                    }
                    <span class="badge" [class.badge-green]="e.is_published" [class.badge-slate]="!e.is_published">
                      {{ e.is_published ? 'Published' : 'Draft' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a routerLink="/questions/new" class="card p-5 text-center hover:border-navy-400 transition-colors">
            <span class="text-2xl block mb-2">➕</span>
            <span class="text-sm font-medium text-slate-700">New Question</span>
          </a>
          <a routerLink="/exams/new" class="card p-5 text-center hover:border-navy-400 transition-colors">
            <span class="text-2xl block mb-2">📋</span>
            <span class="text-sm font-medium text-slate-700">New Exam</span>
          </a>
          <a routerLink="/questions" class="card p-5 text-center hover:border-navy-400 transition-colors">
            <span class="text-2xl block mb-2">📝</span>
            <span class="text-sm font-medium text-slate-700">Questions</span>
          </a>
          <a routerLink="/reports" class="card p-5 text-center hover:border-navy-400 transition-colors">
            <span class="text-2xl block mb-2">📊</span>
            <span class="text-sm font-medium text-slate-700">Reports</span>
          </a>
        </div>
      </div>
    }

    <!-- ═══ STUDENT DASHBOARD ═══ -->
    @if (auth.isStudent() && !auth.isAdmin() && !auth.isFaculty()) {
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Student Dashboard</h1>
          <p class="text-slate-500 text-sm mt-1">Track your progress and upcoming exams</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div class="stat-card">
            <span class="stat-label">Total Attempts</span>
            <span class="stat-value text-navy-700">{{ stats()?.myAttempts?.length ?? 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Passed</span>
            <span class="stat-value text-green-600">{{ stats()?.stats?.passed ?? 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Average Score</span>
            <span class="stat-value text-sky-600">{{ stats()?.stats?.avg_score ?? '—' }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a routerLink="/my-exams" class="card p-6 flex items-center gap-4 hover:border-navy-400 transition-colors">
            <div class="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-2xl">🎯</div>
            <div>
              <span class="font-semibold text-slate-800">Available Exams</span>
              <p class="text-xs text-slate-500 mt-0.5">Browse and start new exams</p>
            </div>
          </a>
          <a routerLink="/my-exams" class="card p-6 flex items-center gap-4 hover:border-navy-400 transition-colors">
            <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">📊</div>
            <div>
              <span class="font-semibold text-slate-800">My Results</span>
              <p class="text-xs text-slate-500 mt-0.5">View past attempts and scores</p>
            </div>
          </a>
        </div>

        @if (stats()?.myAttempts?.length) {
          <div class="card overflow-hidden">
            <div class="p-5 border-b border-slate-200">
              <h3 class="font-semibold text-slate-800">Recent Attempts</h3>
            </div>
            <div class="divide-y divide-slate-100">
              @for (a of stats()!.myAttempts.slice(0, 8); track $index) {
                <div class="flex items-center justify-between px-5 py-3">
                  <span class="text-sm text-slate-700 font-medium">{{ a.title }}</span>
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-slate-500">{{ a.score ?? '—' }}/{{ a.total_marks }}</span>
                    <span class="badge" [class.badge-green]="a.status === 'COMPLETED'"
                          [class.badge-blue]="a.status === 'ONGOING'"
                          [class.badge-red]="a.status === 'TERMINATED'">{{ a.status }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  stats = signal<any>(null);

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: (d: any) => this.stats.set(d),
      error: () => {}
    });
  }
}
