import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="max-w-4xl mx-auto space-y-6 pb-12">
      <div class="flex items-center gap-3">
        <a routerLink="/my-exams" class="btn-ghost text-sm">← Back to Exams</a>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12"><div class="spinner"></div></div>
      } @else if (exam()) {
        <!-- Score Card -->
        <div class="card p-8 text-center">
          <h1 class="text-2xl font-bold text-slate-900 mb-2">{{ exam()!.title }}</h1>
          <p class="text-slate-500 text-sm mb-6">Exam Result</p>

          <div class="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 mb-6"
               [class.border-green-500]="percentage() >= 60"
               [class.border-red-500]="percentage() < 60">
            <div>
              <div class="text-3xl font-bold" [class.text-green-600]="percentage() >= 60"
                   [class.text-red-600]="percentage() < 60">
                {{ percentage() | number:'1.0-1' }}%
              </div>
              <div class="text-xs text-slate-400">Score</div>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto">
            <div class="text-center">
              <div class="text-lg font-bold text-navy-700">{{ exam()!.score }}</div>
              <div class="text-xs text-slate-500">Scored</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-slate-700">{{ exam()!.total_marks }}</div>
              <div class="text-xs text-slate-500">Total</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-green-600">{{ correctCount() }}</div>
              <div class="text-xs text-slate-500">Correct</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-red-600">{{ questions().length - correctCount() }}</div>
              <div class="text-xs text-slate-500">Incorrect</div>
            </div>
          </div>
        </div>

        @if (hidden()) {
          <div class="card p-8 text-center text-slate-500">Detailed results are hidden by the exam creator.</div>
        }

        <!-- Question Review -->
        @if (!hidden() && questions().length) {
          <h2 class="text-lg font-semibold text-slate-800">Question Review</h2>
          <div class="space-y-4">
            @for (q of questions(); track q.id; let i = $index) {
              <div class="card p-5">
                <div class="flex items-start justify-between mb-3">
                  <span class="text-sm font-medium text-slate-400">Q{{ i + 1 }}</span>
                  @if (isCorrect(q)) {
                    <span class="badge badge-green">Correct</span>
                  } @else {
                    <span class="badge badge-red">Incorrect</span>
                  }
                </div>
                <div class="prose prose-sm prose-slate max-w-none mb-4" [innerHTML]="q.question_text"></div>

                <div class="space-y-2">
                  @for (opt of q.options; track opt.id) {
                    <div class="flex items-center gap-3 p-3 rounded-lg text-sm border"
                         [class.bg-green-50]="opt.isCorrect"
                         [class.border-green-300]="opt.isCorrect"
                         [class.bg-red-50]="!opt.isCorrect && opt.id === q.selected_option_id"
                         [class.border-red-300]="!opt.isCorrect && opt.id === q.selected_option_id"
                         [class.bg-slate-50]="!opt.isCorrect && opt.id !== q.selected_option_id"
                         [class.border-slate-200]="!opt.isCorrect && opt.id !== q.selected_option_id">
                      <span class="font-bold text-xs w-6 text-center">{{ optLabel($index) }}</span>
                      <span class="flex-1" [innerHTML]="opt.text"></span>
                      @if (opt.isCorrect) {
                        <span class="text-green-600 text-xs font-medium">✓ Correct</span>
                      }
                      @if (!opt.isCorrect && opt.id === q.selected_option_id) {
                        <span class="text-red-500 text-xs font-medium">✗ Your answer</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      } @else {
        <div class="card p-12 text-center text-slate-400">Result not available.</div>
      }
    </div>
  `
})
export class ExamResultComponent implements OnInit {
  private api   = inject(ApiService);
  private route = inject(ActivatedRoute);

  exam      = signal<any>(null);
  questions = signal<any[]>([]);
  hidden    = signal(false);
  loading   = signal(true);

  ngOnInit() {
    const id = +(this.route.snapshot.paramMap.get('id') ?? 0);
    this.api.getExamResult(id).subscribe({
      next: (r: any) => {
        this.exam.set(r.exam);
        this.questions.set(r.questions ?? []);
        this.hidden.set(r.hidden === true);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  percentage(): number {
    const e = this.exam();
    if (!e || !e.total_marks) return 0;
    return (e.score / e.total_marks) * 100;
  }

  correctCount(): number {
    return this.questions().filter(q => this.isCorrect(q)).length;
  }

  isCorrect(q: any): boolean {
    if (!q.selected_option_id || !q.options) return false;
    const selected = q.options.find((o: any) => o.id === q.selected_option_id);
    return selected?.isCorrect === true;
  }

  optLabel(i: number) { return String.fromCharCode(65 + i); }
}
