import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Reports</h1>
        <p class="text-slate-500 text-sm mt-1">Select an exam to generate a detailed report</p>
      </div>

      <!-- Exam Selector -->
      <div class="card p-5">
        <label class="input-label">Select Exam</label>
        <select class="input max-w-md" (change)="onExamChange($event)">
          <option value="">Choose an exam…</option>
          @for (e of exams(); track e.id) {
            <option [value]="e.id">{{ e.title }} ({{ e.course_name }})</option>
          }
        </select>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12"><div class="spinner"></div></div>
      }

      @if (report()) {
        <!-- Summary -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="stat-card">
            <span class="stat-label">Total Attempts</span>
            <span class="stat-value text-navy-700">{{ report()!.summary?.total ?? 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Average Score</span>
            <span class="stat-value text-sky-600">{{ report()!.summary?.avg | number:'1.1-1' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Highest Score</span>
            <span class="stat-value text-green-600">{{ report()!.summary?.max ?? '—' }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Lowest Score</span>
            <span class="stat-value text-red-600">{{ report()!.summary?.min ?? '—' }}</span>
          </div>
        </div>

        <!-- Student Scores -->
        @if (report()!.students?.length) {
          <div class="card overflow-hidden">
            <div class="p-5 border-b border-slate-200">
              <h3 class="font-semibold text-slate-800">Student Scores</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of report()!.students; track $index; let i = $index) {
                    <tr>
                      <td class="text-slate-400">{{ i + 1 }}</td>
                      <td class="font-medium text-slate-800">{{ s.full_name }}</td>
                      <td>{{ s.score }} / {{ report()!.exam?.total_marks }}</td>
                      <td>
                        <div class="flex items-center gap-2">
                          <div class="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div class="h-full rounded-full"
                                 [class.bg-green-500]="s.pct >= 60"
                                 [class.bg-red-500]="s.pct < 60"
                                 [style.width.%]="s.pct"></div>
                          </div>
                          <span class="text-sm text-slate-600">{{ s.pct | number:'1.0-1' }}%</span>
                        </div>
                      </td>
                      <td>
                        <span class="badge" [class.badge-green]="s.status === 'COMPLETED'"
                              [class.badge-red]="s.status === 'TERMINATED'">{{ s.status }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Question Accuracy -->
        @if (report()!.question_stats?.length) {
          <div class="card overflow-hidden">
            <div class="p-5 border-b border-slate-200">
              <h3 class="font-semibold text-slate-800">Question Accuracy</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Correct</th>
                    <th>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  @for (q of report()!.question_stats; track $index; let i = $index) {
                    <tr>
                      <td class="text-slate-400">{{ i + 1 }}</td>
                      <td class="max-w-xs truncate" [innerHTML]="q.question_text"></td>
                      <td>{{ q.correct_count }}/{{ q.total_attempts }}</td>
                      <td>
                        <div class="flex items-center gap-2">
                          <div class="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div class="h-full bg-navy-600 rounded-full" [style.width.%]="q.accuracy"></div>
                          </div>
                          <span class="text-sm text-slate-600">{{ q.accuracy | number:'1.0-1' }}%</span>
                        </div>
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
export class ReportGeneratorComponent implements OnInit {
  private api = inject(ApiService);

  exams   = signal<any[]>([]);
  report  = signal<any>(null);
  loading = signal(false);

  ngOnInit() {
    this.api.getExams().subscribe({
      next: (e: any[]) => this.exams.set(e),
      error: () => {}
    });
  }

  onExamChange(event: Event) {
    const id = (event.target as HTMLSelectElement).value;
    if (!id) { this.report.set(null); return; }
    this.loading.set(true);
    this.report.set(null);
    this.api.getExamReport(+id).subscribe({
      next: (r: any) => {
        // Compute percentages
        if (r.students) {
          r.students = r.students.map((s: any) => ({
            ...s,
            pct: r.exam?.total_marks ? (s.score / r.exam.total_marks) * 100 : 0
          }));
        }
        // Map questionAccuracy to question_stats
        if (r.questionAccuracy) {
          r.question_stats = r.questionAccuracy.map((q: any) => ({
            ...q,
            accuracy: q.total_attempts ? (q.correct_count / q.total_attempts) * 100 : 0
          }));
        }
        this.report.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
