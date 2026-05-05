import { Component, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-exam-interface',
  standalone: true,
  template: `
    @if (submitted()) {
      <!-- Post-submit -->
      <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div class="card p-10 text-center max-w-md">
          <div class="text-5xl mb-4">✅</div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Exam Submitted</h2>
          <p class="text-slate-500 mb-6">Your answers have been recorded.</p>
          <div class="flex gap-3 justify-center">
            <button (click)="goResult()" class="btn-primary">View Result</button>
            <button (click)="goDashboard()" class="btn-secondary">Dashboard</button>
          </div>
        </div>
      </div>
    } @else {
      <!-- Exam UI -->
      <div class="min-h-screen bg-slate-50 flex flex-col">
        <!-- Top Bar -->
        <header class="bg-navy-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div class="flex items-center gap-4">
            <h1 class="font-bold text-lg truncate max-w-xs">{{ examTitle() }}</h1>
            <span class="text-xs bg-navy-700 px-3 py-1 rounded-full">
              Q {{ currentIdx() + 1 }}/{{ questions().length }}
            </span>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-sm font-mono" [class.text-red-400]="timeLeft() < 60">
              ⏱ {{ formatTime(timeLeft()) }}
            </div>
            <button (click)="confirmSubmit()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Submit Exam
            </button>
          </div>
        </header>

        <div class="flex flex-1 overflow-hidden">
          <!-- Question Panel -->
          <main class="flex-1 overflow-y-auto p-6">
            @if (loading()) {
              <div class="flex justify-center py-12"><div class="spinner"></div></div>
            } @else if (questions().length) {
              @let q = questions()[currentIdx()];
              <div class="max-w-3xl mx-auto">
                <div class="card p-8">
                  <!-- Question header -->
                  <div class="flex items-start justify-between mb-4">
                    <span class="text-sm font-medium text-slate-400">Question {{ currentIdx() + 1 }}</span>
                    <div class="flex gap-2">
                      @if (q.marks) {
                        <span class="badge badge-navy">{{ q.marks }} marks</span>
                      }
                      @if (markedForReview().has(q.id)) {
                        <span class="badge badge-red">Marked for Review</span>
                      }
                    </div>
                  </div>

                  <!-- Question text -->
                  <div class="prose prose-slate max-w-none mb-6" [innerHTML]="q.question_text"></div>

                  @if (q.question_image_path) {
                    <img [src]="'http://localhost:3000' + q.question_image_path" alt="Question image"
                         class="max-w-full rounded-xl border border-slate-200 mb-6">
                  }

                  <!-- Options -->
                  <div class="space-y-3">
                    @for (opt of q.options; track opt.id) {
                      <button (click)="selectOption(q.id, opt.id)"
                              class="w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3"
                              [class.border-navy-600]="answers()[q.id] === opt.id"
                              [class.bg-navy-50]="answers()[q.id] === opt.id"
                              [class.border-slate-200]="answers()[q.id] !== opt.id"
                              [class.hover:border-slate-300]="answers()[q.id] !== opt.id">
                        <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                              [class.bg-navy-600]="answers()[q.id] === opt.id"
                              [class.text-white]="answers()[q.id] === opt.id"
                              [class.bg-slate-100]="answers()[q.id] !== opt.id"
                              [class.text-slate-600]="answers()[q.id] !== opt.id">
                          {{ optionLabel($index) }}
                        </span>
                        <span class="text-sm text-slate-800" [innerHTML]="opt.text"></span>
                      </button>
                    }
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                    <button (click)="toggleReview(q.id)"
                            class="btn-ghost text-sm"
                            [class.text-red-500]="markedForReview().has(q.id)">
                      {{ markedForReview().has(q.id) ? '★ Unmark Review' : '☆ Mark for Review' }}
                    </button>
                    <div class="flex gap-3">
                      @if (currentIdx() > 0) {
                        <button (click)="navigate(-1)" class="btn-secondary">← Previous</button>
                      }
                      @if (currentIdx() < questions().length - 1) {
                        <button (click)="navigate(1)" class="btn-primary">Next →</button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </main>

          <!-- Question Palette sidebar -->
          <aside class="hidden md:flex w-64 bg-white border-l border-slate-200 flex-col p-4 overflow-y-auto">
            <h3 class="text-sm font-semibold text-slate-700 mb-3">Question Palette</h3>
            <div class="grid grid-cols-5 gap-2">
              @for (q of questions(); track q.id; let i = $index) {
                <button (click)="goTo(i)"
                        class="w-9 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                        [class.bg-navy-600]="answers()[q.id] !== undefined && !markedForReview().has(q.id)"
                        [class.text-white]="answers()[q.id] !== undefined && !markedForReview().has(q.id)"
                        [class.bg-red-100]="markedForReview().has(q.id)"
                        [class.text-red-700]="markedForReview().has(q.id)"
                        [class.bg-slate-100]="answers()[q.id] === undefined && !markedForReview().has(q.id)"
                        [class.text-slate-600]="answers()[q.id] === undefined && !markedForReview().has(q.id)"
                        [class.ring-2]="i === currentIdx()"
                        [class.ring-navy-400]="i === currentIdx()">
                  {{ i + 1 }}
                </button>
              }
            </div>

            <!-- Legend -->
            <div class="mt-6 space-y-2 text-xs text-slate-500">
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded bg-navy-600"></span> Answered
              </div>
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded bg-slate-100 border border-slate-300"></span> Not Answered
              </div>
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded bg-red-100"></span> Marked for Review
              </div>
            </div>

            <!-- Stats -->
            <div class="mt-auto pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
              <p>Answered: {{ answeredCount() }}/{{ questions().length }}</p>
              <p>Marked: {{ markedForReview().size }}</p>
            </div>
          </aside>
        </div>
      </div>
    }
  `
})
export class ExamInterfaceComponent implements OnInit, OnDestroy {
  private api    = inject(ApiService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  studentExamId = 0;
  examTitle     = signal('Exam');
  questions     = signal<any[]>([]);
  currentIdx    = signal(0);
  answers       = signal<Record<number, number>>({});
  markedForReview = signal(new Set<number>());
  timeLeft      = signal(0);
  loading       = signal(true);
  submitted     = signal(false);

  private timerId: any;

  ngOnInit() {
    this.studentExamId = +(this.route.snapshot.paramMap.get('id') ?? 0);
    this.api.getExamQuestions(this.studentExamId).subscribe({
      next: (data: any) => {
        const exam = data.exam;
        this.examTitle.set(exam?.title ?? 'Exam');
        this.questions.set(data.questions ?? []);

        // Calculate remaining seconds from start_time + duration_minutes
        if (exam?.start_time && exam?.duration_minutes) {
          const endTime = new Date(exam.start_time).getTime() + exam.duration_minutes * 60000;
          const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
          this.timeLeft.set(remaining);
        } else if (exam?.duration_minutes) {
          // Fallback: use full duration
          this.timeLeft.set(exam.duration_minutes * 60);
        }

        // Restore previously saved answers from question data
        const saved: Record<number, number> = {};
        (data.questions ?? []).forEach((q: any) => {
          if (q.selected_option_id) saved[q.id] = q.selected_option_id;
        });
        this.answers.set(saved);

        this.loading.set(false);
        this.startTimer();
      },
      error: () => { this.loading.set(false); alert('Cannot load exam questions'); }
    });
  }

  ngOnDestroy() { clearInterval(this.timerId); }

  private startTimer() {
    this.timerId = setInterval(() => {
      const t = this.timeLeft() - 1;
      if (t <= 0) { clearInterval(this.timerId); this.doSubmit(); return; }
      this.timeLeft.set(t);
    }, 1000);
  }

  formatTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  optionLabel(i: number) { return String.fromCharCode(65 + i); }

  selectOption(qId: number, optId: number) {
    this.answers.set({ ...this.answers(), [qId]: optId });
    // Save to server
    this.api.saveAnswer(this.studentExamId, qId, optId).subscribe({ error: () => {} });
  }

  toggleReview(qId: number) {
    const s = new Set(this.markedForReview());
    if (s.has(qId)) s.delete(qId); else s.add(qId);
    this.markedForReview.set(s);
  }

  navigate(delta: number) {
    const next = this.currentIdx() + delta;
    if (next >= 0 && next < this.questions().length) this.currentIdx.set(next);
  }

  goTo(i: number) { this.currentIdx.set(i); }

  answeredCount() { return Object.keys(this.answers()).length; }

  confirmSubmit() {
    const unanswered = this.questions().length - this.answeredCount();
    const msg = unanswered > 0
      ? `You have ${unanswered} unanswered question(s). Submit anyway?`
      : 'Submit your exam? This cannot be undone.';
    if (confirm(msg)) this.doSubmit();
  }

  private doSubmit() {
    clearInterval(this.timerId);
    this.api.submitExam(this.studentExamId).subscribe({
      next: () => this.submitted.set(true),
      error: () => { this.submitted.set(true); } // Still show as submitted
    });
  }

  goResult() { this.router.navigate(['/my-exams', this.studentExamId, 'result']); }
  goDashboard() { this.router.navigate(['/dashboard']); }

  @HostListener('window:beforeunload', ['$event'])
  handleUnload(e: BeforeUnloadEvent) {
    if (!this.submitted()) { e.preventDefault(); e.returnValue = ''; }
  }
}
