import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center gap-3">
        <a routerLink="/questions" class="btn-ghost text-sm">← Back</a>
        <h1 class="text-2xl font-bold text-slate-900">{{ isEdit() ? 'Edit' : 'New' }} Question</h1>
      </div>

      @if (error()) {
        <div class="alert-error"><span>⚠️</span><span>{{ error() }}</span></div>
      }

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
        <!-- Course & Difficulty -->
        <div class="card p-6 space-y-5">
          <h2 class="font-semibold text-slate-800 text-sm uppercase tracking-wider">Metadata</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label class="input-label">Difficulty *</label>
              <select formControlName="difficulty" class="input">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label class="input-label">Marks</label>
              <input formControlName="marks" type="number" class="input" min="1" placeholder="1">
            </div>
          </div>
          <div>
            <label class="input-label">Tags (comma‐separated)</label>
            <input formControlName="tags" type="text" class="input" placeholder="e.g. arrays, sorting, loops">
          </div>
        </div>

        <!-- Question Text -->
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold text-slate-800 text-sm uppercase tracking-wider">Question</h2>
          <div>
            <label class="input-label">Question Text *</label>
            <textarea formControlName="question_text" rows="4" class="input"
                      placeholder="Enter question text. Supports HTML and KaTeX math notation (e.g. $$x^2 + y^2 = z^2$$)"></textarea>
          </div>
          <div>
            <label class="input-label">Explanation (optional)</label>
            <textarea formControlName="explanation" rows="2" class="input"
                      placeholder="Explain the correct answer…"></textarea>
          </div>

          <!-- Image Upload -->
          <div>
            <label class="input-label">Question Image (optional)</label>
            <div class="mt-1 flex items-center gap-4">
              <label class="btn-ghost text-sm cursor-pointer">
                Choose file
                <input type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)">
              </label>
              @if (selectedFileName()) {
                <span class="text-sm text-slate-500">{{ selectedFileName() }}</span>
              }
              @if (imagePreview()) {
                <img [src]="imagePreview()" alt="Preview" class="h-16 rounded-lg border border-slate-200">
              }
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="card p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-800 text-sm uppercase tracking-wider">
              Answer Options ({{ options.length }})
            </h2>
            @if (options.length < 6) {
              <button type="button" (click)="addOption()" class="btn-ghost text-sm">＋ Add Option</button>
            }
          </div>

          <div formArrayName="options" class="space-y-3">
            @for (opt of options.controls; track $index; let i = $index) {
              <div [formGroupName]="i" class="flex items-start gap-3 p-4 rounded-xl border-2 transition-all"
                   [class.border-green-400]="opt.get('is_correct')?.value"
                   [class.bg-green-50]="opt.get('is_correct')?.value"
                   [class.border-slate-200]="!opt.get('is_correct')?.value">
                <label class="pt-2">
                  <input type="radio" [name]="'correctOption'" [value]="i"
                         [checked]="opt.get('is_correct')?.value"
                         (change)="setCorrect(i)"
                         class="accent-green-600 w-4 h-4">
                </label>
                <div class="flex-1">
                  <input formControlName="option_text" class="input" [placeholder]="'Option ' + (i + 1)">
                </div>
                @if (options.length > 2) {
                  <button type="button" (click)="removeOption(i)"
                          class="text-slate-400 hover:text-red-500 pt-2 text-xl leading-none">&times;</button>
                }
              </div>
            }
          </div>
          <p class="text-xs text-slate-400">Select the radio button to mark the correct answer. Minimum 2 options.</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <a routerLink="/questions" class="btn-secondary">Cancel</a>
          <button type="submit" class="btn-primary" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner h-4 w-4 border-2"></span> Saving…
            } @else {
              {{ isEdit() ? 'Update' : 'Create' }} Question
            }
          </button>
        </div>
      </form>
    </div>
  `
})
export class QuestionFormComponent implements OnInit {
  private api   = inject(ApiService);
  private fb    = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit   = signal(false);
  saving   = signal(false);
  error    = signal('');
  courses  = signal<any[]>([]);
  questionId = 0;
  selectedFile: File | null = null;
  selectedFileName = signal('');
  imagePreview = signal('');

  form = this.fb.group({
    course_id:     ['', Validators.required],
    difficulty:    ['MEDIUM'],
    marks:         [1],
    tags:          [''],
    question_text: ['', Validators.required],
    explanation:   [''],
    options:       this.fb.array([
      this.createOption('', true),
      this.createOption('', false),
      this.createOption('', false),
      this.createOption('', false)
    ])
  });

  get options() { return this.form.get('options') as FormArray; }

  ngOnInit() {
    this.api.getCourses().subscribe({ next: (c: any) => this.courses.set(c), error: () => {} });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.questionId = +id;
      this.api.getQuestion(+id).subscribe({
        next: (q: any) => this.patchForm(q),
        error: () => this.error.set('Question not found')
      });
    }
  }

  private patchForm(q: any) {
    this.form.patchValue({
      course_id: q.course_id,
      difficulty: q.difficulty,
      marks: q.marks,
      tags: q.tags ?? '',
      question_text: q.question_text,
      explanation: q.explanation ?? ''
    });
    this.options.clear();
    (q.options ?? []).forEach((o: any) =>
      this.options.push(this.createOption(o.text ?? o.option_text, o.isCorrect ?? o.is_correct))
    );
    if (q.question_image_path) this.imagePreview.set(q.question_image_path);
  }

  createOption(text: string, correct: boolean) {
    return this.fb.group({ option_text: [text, Validators.required], is_correct: [correct] });
  }

  addOption()    { this.options.push(this.createOption('', false)); }
  removeOption(i: number) { this.options.removeAt(i); }

  setCorrect(idx: number) {
    this.options.controls.forEach((c: any, i: number) => c.get('is_correct')?.setValue(i === idx));
  }

  onFileSelected(event: Event) {
    const f = (event.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.selectedFile = f;
    this.selectedFileName.set(f.name);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(f);
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const hasCorrect = this.options.controls.some((c: any) => c.get('is_correct')?.value);
    if (!hasCorrect) { this.error.set('Please mark one option as correct'); return; }

    this.saving.set(true);
    this.error.set('');
    const fd = new FormData();
    const v = this.form.value as any;
    fd.append('courseId', v.course_id);
    fd.append('difficulty', v.difficulty);
    fd.append('subject', v.tags); // tags as subject for backend
    fd.append('questionText', v.question_text);
    if (v.explanation) fd.append('explanation', v.explanation);
    // Map options to backend format: { text, isCorrect }
    const opts = (v.options ?? []).map((o: any) => ({ text: o.option_text, isCorrect: o.is_correct }));
    fd.append('options', JSON.stringify(opts));
    if (this.selectedFile) fd.append('image', this.selectedFile);

    const req$ = this.isEdit()
      ? this.api.updateQuestion(this.questionId, fd)
      : this.api.createQuestion(fd);

    (req$ as any).subscribe({
      next: () => this.router.navigate(['/questions']),
      error: (err: any) => { this.error.set(err.error?.message ?? 'Save failed'); this.saving.set(false); }
    });
  }
}
