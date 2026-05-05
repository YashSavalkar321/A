import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-available-exams',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">My Exams</h1>
        <p class="text-slate-500 text-sm mt-1">Browse available exams or review past attempts</p>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12"><div class="spinner"></div></div>
      } @else {

        <!-- Live / Upcoming -->
        @if (liveExams().length) {
          <div>
            <h2 class="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Available Now
            </h2>
            <div class="grid gap-4 sm:grid-cols-2">
              @for (e of liveExams(); track e.id) {
                <div class="card p-5 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                  <h3 class="font-semibold text-slate-900">{{ e.title }}</h3>
                  <p class="text-sm text-slate-500 mt-1">{{ e.course_name }}</p>
                  <div class="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>⏱ {{ e.duration_minutes }} min</span>
                    <span>📋 {{ e.question_count }} Qs</span>
                    <span>Ends {{ e.end_time | date:'short' }}</span>
                  </div>
                  <div class="mt-4">
                    @if (e.student_exam_id && e.attempt_status === 'ONGOING') {
                      <button (click)="resumeExam(e.student_exam_id)" class="btn-primary text-sm">Resume Exam</button>
                    } @else if (!e.student_exam_id) {
                      <button (click)="startExam(e.id)" class="btn-primary text-sm">Start Exam</button>
                    } @else {
                      <span class="badge badge-green">Completed</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Upcoming -->
        @if (upcomingExams().length) {
          <div>
            <h2 class="text-base font-semibold text-slate-700 mb-3">📅 Upcoming</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              @for (e of upcomingExams(); track e.id) {
                <div class="card p-5 border-l-4 border-l-sky-400 opacity-80">
                  <h3 class="font-semibold text-slate-900">{{ e.title }}</h3>
                  <p class="text-sm text-slate-500 mt-1">{{ e.course_name }}</p>
                  <div class="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>⏱ {{ e.duration_minutes }} min</span>
                    <span>Starts {{ e.start_time | date:'short' }}</span>
                  </div>
                  <p class="mt-3 text-xs text-sky-600 font-medium">Not yet open</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Completed -->
        @if (completedExams().length) {
          <div>
            <h2 class="text-base font-semibold text-slate-700 mb-3">✅ Completed</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              @for (e of completedExams(); track e.id) {
                <div class="card p-5 border-l-4 border-l-slate-300">
                  <h3 class="font-semibold text-slate-900">{{ e.title }}</h3>
                  <p class="text-sm text-slate-500 mt-1">{{ e.course_name }}</p>
                  <div class="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>Score: {{ e.attempt_score }}/{{ e.total_marks }}</span>
                    <span class="badge" [class.badge-green]="e.attempt_status === 'COMPLETED'"
                          [class.badge-red]="e.attempt_status === 'TERMINATED'">{{ e.attempt_status }}</span>
                  </div>
                  <div class="mt-4">
                    <button (click)="viewResult(e.student_exam_id)" class="btn-ghost text-sm">View Result</button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @if (!liveExams().length && !upcomingExams().length && !completedExams().length) {
          <div class="card p-12 text-center text-slate-400">No exams available at this time.</div>
        }
      }
    </div>
  `,
})
export class AvailableExamsComponent implements OnInit {
  private api    = inject(ApiService);
  private router = inject(Router);

  allExams       = signal<any[]>([]);
  liveExams      = signal<any[]>([]);
  upcomingExams  = signal<any[]>([]);
  completedExams = signal<any[]>([]);
  loading        = signal(true);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getAvailableExams().subscribe({
      next: (exams: any[]) => {
        this.allExams.set(exams);
        const now = new Date();
        this.liveExams.set(exams.filter(e => {
          const started = new Date(e.start_time) <= now;
          const notEnded = new Date(e.end_time) > now;
          const notDone = !e.attempt_status || e.attempt_status === 'ONGOING';
          return started && notEnded && notDone;
        }));
        this.upcomingExams.set(exams.filter(e => new Date(e.start_time) > now && !e.student_exam_id));
        this.completedExams.set(exams.filter(e =>
          e.attempt_status === 'COMPLETED' || e.attempt_status === 'TERMINATED'
        ));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  startExam(examId: number) {
    this.api.startExam(examId).subscribe({
      next: (res: any) => this.router.navigate(['/take-exam', res.studentExamId]),
      error: (err: any) => alert(err.error?.message ?? 'Cannot start exam')
    });
  }

  resumeExam(studentExamId: number) {
    this.router.navigate(['/take-exam', studentExamId]);
  }

  viewResult(studentExamId: number) {
    this.router.navigate(['/my-exams', studentExamId, 'result']);
  }
}
