import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center gap-3">
        <a routerLink="/exams" class="btn-ghost text-sm">← Back</a>
        <h1 class="text-2xl font-bold text-slate-900">{{ isEdit() ? 'Edit' : 'New' }} Exam</h1>
      </div>

      @if (error()) {
        <div class="alert-error"><span>⚠️</span><span>{{ error() }}</span></div>
      }

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
        <!-- Basic Info -->
        <div class="card p-6 space-y-5">
          <h2 class="font-semibold text-slate-800 text-sm uppercase tracking-wider">Exam Details</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="input-label">Title *</label>
              <input formControlName="title" type="text" class="input" placeholder="e.g. Mid-Term Quiz — Data Structures">
            </div>
            <div>
              <label class="input-label">Course *</label>
              <select formControlName="course_id" class="input">
                <option value="">Select course</option>
                @for (c of courses(); track c.id) {
                  <option [value]="c.id">{{ c.course_name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="input-label">Duration (minutes) *</label>
              <input formControlName="duration_minutes" type="number" class="input" min="1" placeholder="30">
            </div>
            <div>
              <label class="input-label">Start Time *</label>
              <input formControlName="start_time" type="datetime-local" class="input">
            </div>
            <div>
              <label class="input-label">End Time *</label>
              <input formControlName="end_time" type="datetime-local" class="input">
            </div>
          </div>
          <div>
            <label class="input-label">Description</label>
            <textarea formControlName="description" rows="2" class="input" placeholder="Optional description…"></textarea>
          </div>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input formControlName="shuffle_questions" type="checkbox" class="accent-navy-700 w-4 h-4">
              <span class="text-sm text-slate-700">Shuffle question order</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input formControlName="show_result" type="checkbox" class="accent-navy-700 w-4 h-4">
              <span class="text-sm text-slate-700">Show result after submission</span>
            </label>
          </div>
        </div>

        <!-- Question Selector -->
        <div class="card p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-800 text-sm uppercase tracking-wider">
              Questions ({{ selectedIds().length }} selected)
            </h2>
            <input [(ngModel)]="qSearch" [ngModelOptions]="{standalone: true}"
                   class="input max-w-xs" placeholder="Filter questions…">
          </div>

          @if (allQuestions().length === 0) {
            <p class="text-sm text-slate-400 py-4 text-center">No questions in the bank. Create some first.</p>
          } @else {
            <div class="max-h-80 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              @for (q of filteredQuestions(); track q.id) {
                <label class="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input type="checkbox" class="mt-1 accent-navy-700 w-4 h-4"
                         [checked]="selectedIds().includes(q.id)"
                         (change)="toggleQuestion(q.id)">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-800 line-clamp-1" [innerHTML]="q.question_text"></p>
                    <div class="flex gap-2 mt-1">
                      <span class="text-xs text-slate-400">{{ q.course_name }}</span>
                      <span class="text-xs" [class.text-green-500]="q.difficulty === 'EASY'"
                            [class.text-yellow-600]="q.difficulty === 'MEDIUM'"
                            [class.text-red-500]="q.difficulty === 'HARD'">{{ q.difficulty }}</span>
                    </div>
                  </div>
                </label>
              }
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <a routerLink="/exams" class="btn-secondary">Cancel</a>
          <button type="submit" class="btn-primary" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner h-4 w-4 border-2"></span> Saving…
            } @else {
              {{ isEdit() ? 'Update' : 'Create' }} Exam
            }
          </button>
        </div>
      </form>
    </div>
  `
})
export class ExamFormComponent implements OnInit {
  private api    = inject(ApiService);
  private fb     = inject(FormBuilder);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit       = signal(false);
  saving       = signal(false);
  error        = signal('');
  courses      = signal<any[]>([]);
  allQuestions  = signal<any[]>([]);
  selectedIds  = signal<number[]>([]);
  examId       = 0;
  qSearch      = '';

  form = this.fb.group({
    title:             ['', Validators.required],
    course_id:         ['', Validators.required],
    duration_minutes:  [30, [Validators.required, Validators.min(1)]],
    start_time:        ['', Validators.required],
    end_time:          ['', Validators.required],
    description:       [''],
    shuffle_questions: [false],
    show_result:       [true]
  });

  ngOnInit() {
    this.api.getCourses().subscribe({ next: c => this.courses.set(c), error: () => {} });
    this.api.getQuestions().subscribe({ next: q => this.allQuestions.set(q), error: () => {} });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.examId = +id;
      this.api.getExam(+id).subscribe({
        next: (e: any) => this.patchForm(e),
        error: () => this.error.set('Exam not found')
      });
    }
  }

  private patchForm(e: any) {
    this.form.patchValue({
      title: e.title,
      course_id: e.course_id,
      duration_minutes: e.duration_minutes,
      start_time: this.toLocal(e.start_time),
      end_time: this.toLocal(e.end_time),
      description: e.description ?? '',
      shuffle_questions: e.shuffle_questions ?? false,
      show_result: e.show_result ?? true
    });
    if (e.questions) {
      this.selectedIds.set(e.questions.map((q: any) => q.question_id ?? q.id));
    }
  }

  private toLocal(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  filteredQuestions() {
    if (!this.qSearch) return this.allQuestions();
    const t = this.qSearch.toLowerCase();
    return this.allQuestions().filter(q => q.question_text?.toLowerCase().includes(t));
  }

  toggleQuestion(id: number) {
    const ids = [...this.selectedIds()];
    const i = ids.indexOf(id);
    if (i >= 0) ids.splice(i, 1); else ids.push(id);
    this.selectedIds.set(ids);
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.selectedIds().length === 0) { this.error.set('Select at least one question'); return; }
    this.saving.set(true);
    this.error.set('');

    const v = this.form.value as any;
    const payload: any = {
      title: v.title,
      description: v.description,
      courseName: this.courses().find(c => String(c.id) === String(v.course_id))?.course_name ?? '',
      durationMinutes: v.duration_minutes,
      startTime: v.start_time,
      endTime: v.end_time,
      shuffleQuestions: v.shuffle_questions,
      showResults: v.show_result,
      questionIds: this.selectedIds()
    };
    const req$ = this.isEdit()
      ? this.api.updateExam(this.examId, payload)
      : this.api.createExam(payload);

    (req$ as any).subscribe({
      next: () => this.router.navigate(['/exams']),
      error: (err: any) => { this.error.set(err.error?.message ?? 'Save failed'); this.saving.set(false); }
    });
  }
}
