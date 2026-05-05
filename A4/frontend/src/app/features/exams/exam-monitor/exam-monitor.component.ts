import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-exam-monitor',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <a routerLink="/exams" class="btn-ghost text-sm">← Back</a>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Live Monitor</h1>
          <p class="text-slate-500 text-sm mt-1">{{ exam()?.title }} — Auto-refreshes every 10s</p>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12"><div class="spinner"></div></div>
      } @else {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="stat-card">
            <span class="stat-label">Total Participants</span>
            <span class="stat-value text-navy-700">{{ students().length }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Ongoing</span>
            <span class="stat-value text-sky-600">{{ countByStatus('ONGOING') }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Completed</span>
            <span class="stat-value text-green-600">{{ countByStatus('COMPLETED') }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Terminated</span>
            <span class="stat-value text-red-600">{{ countByStatus('TERMINATED') }}</span>
          </div>
        </div>

        <!-- Student Table -->
        @if (students().length === 0) {
          <div class="card p-12 text-center text-slate-400">No students have started this exam yet.</div>
        } @else {
          <div class="card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Started</th>
                    <th>Answered</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of students(); track s.id) {
                    <tr>
                      <td class="font-medium text-slate-800">{{ s.full_name }}</td>
                      <td class="text-slate-500 text-sm">{{ s.start_time | date:'short' }}</td>
                      <td>{{ s.answered_count ?? 0 }} / {{ s.total_questions ?? '?' }}</td>
                      <td>
                        @if (s.status !== 'ONGOING') {
                          <span class="font-semibold">{{ s.score ?? '—' }}</span>
                        } @else {
                          <span class="text-slate-400">—</span>
                        }
                      </td>
                      <td>
                        <span class="badge"
                              [class.badge-blue]="s.status === 'ONGOING'"
                              [class.badge-green]="s.status === 'COMPLETED'"
                              [class.badge-red]="s.status === 'TERMINATED'">{{ s.status }}</span>
                      </td>
                      <td class="text-right">
                        @if (s.status === 'ONGOING') {
                          <button (click)="terminateStudent(s.id)"
                                  class="text-xs text-red-500 hover:text-red-700 font-medium">Terminate</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class ExamMonitorComponent implements OnInit, OnDestroy {
  private api   = inject(ApiService);
  private route = inject(ActivatedRoute);

  examId   = 0;
  exam     = signal<any>(null);
  students = signal<any[]>([]);
  loading  = signal(true);
  private intervalId: any;

  ngOnInit() {
    this.examId = +(this.route.snapshot.paramMap.get('id') ?? 0);
    this.load();
    this.intervalId = setInterval(() => this.load(), 10000);
  }

  ngOnDestroy() { clearInterval(this.intervalId); }

  load() {
    this.api.monitorExam(this.examId).subscribe({
      next: (data: any) => {
        this.exam.set(data.exam ?? data);
        this.students.set(data.students ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  countByStatus(s: string) {
    return this.students().filter(st => st.status === s).length;
  }

  terminateStudent(studentExamId: number) {
    if (!confirm('Terminate this student\'s attempt?')) return;
    this.api.submitExam(studentExamId).subscribe({
      next: () => this.load(),
      error: () => alert('Failed to terminate')
    });
  }
}
