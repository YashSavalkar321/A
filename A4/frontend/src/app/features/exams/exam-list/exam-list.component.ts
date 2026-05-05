import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Exams</h1>
          <p class="text-slate-500 text-sm mt-1">{{ exams().length }} exam(s)</p>
        </div>
        <a routerLink="/exams/new" class="btn-primary">
          <span class="mr-1">＋</span> New Exam
        </a>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12"><div class="spinner"></div></div>
      } @else if (exams().length === 0) {
        <div class="card p-12 text-center">
          <p class="text-slate-400 text-lg mb-4">No exams yet</p>
          <a routerLink="/exams/new" class="btn-primary inline-flex">Create your first exam</a>
        </div>
      } @else {
        <div class="grid gap-4">
          @for (e of exams(); track e.id) {
            <div class="card p-5 hover:border-navy-300 transition-colors">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-base font-semibold text-slate-900 truncate">{{ e.title }}</h3>
                    <span class="badge" [class.badge-green]="e.is_published" [class.badge-slate]="!e.is_published">
                      {{ e.is_published ? 'Published' : 'Draft' }}
                    </span>
                  </div>
                  <p class="text-sm text-slate-500 truncate">{{ e.course_name }}</p>
                  <div class="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>⏱ {{ e.duration_minutes }} min</span>
                    <span>📋 {{ e.question_count ?? 0 }} Qs</span>
                    <span>📅 {{ e.start_time | date:'medium' }}</span>
                    <span>→ {{ e.end_time | date:'medium' }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  @if (e.is_published) {
                    <a [routerLink]="['/exams', e.id, 'monitor']" class="btn-ghost text-xs">Monitor</a>
                  }
                  <a [routerLink]="['/exams', e.id, 'edit']" class="btn-ghost text-xs">Edit</a>
                  <button (click)="togglePublish(e)" class="btn-ghost text-xs"
                          [class.text-green-600]="!e.is_published" [class.text-red-500]="e.is_published">
                    {{ e.is_published ? 'Unpublish' : 'Publish' }}
                  </button>
                  <button (click)="deleteExam(e.id)" class="btn-ghost text-xs text-red-500">Delete</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ExamListComponent implements OnInit {
  private api = inject(ApiService);
  exams   = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getExams().subscribe({
      next: (e: any[]) => { this.exams.set(e); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  togglePublish(e: any) {
    this.api.togglePublishExam(e.id).subscribe({
      next: () => this.load(),
      error: () => alert('Failed to update exam')
    });
  }

  deleteExam(id: number) {
    if (!confirm('Delete this exam permanently?')) return;
    this.api.deleteExam(id).subscribe({
      next: () => this.load(),
      error: () => alert('Failed to delete')
    });
  }
}
