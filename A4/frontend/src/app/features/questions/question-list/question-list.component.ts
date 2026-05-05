import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Question Bank</h1>
          <p class="text-slate-500 text-sm mt-1">{{ questions().length }} question(s) total</p>
        </div>
        <a routerLink="/questions/new" class="btn-primary">
          <span class="mr-1">＋</span> New Question
        </a>
      </div>

      <!-- Filters -->
      <div class="card p-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="input-label">Search</label>
            <input [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" class="input"
                   placeholder="Search questions…" type="text">
          </div>
          <div>
            <label class="input-label">Course</label>
            <select [(ngModel)]="selectedCourse" (ngModelChange)="applyFilter()" class="input">
              <option value="">All courses</option>
              @for (c of courses(); track c.id) {
                <option [value]="c.id">{{ c.course_name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="input-label">Difficulty</label>
            <select [(ngModel)]="selectedDifficulty" (ngModelChange)="applyFilter()" class="input">
              <option value="">All levels</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Question List -->
      @if (loading()) {
        <div class="flex justify-center py-12"><div class="spinner"></div></div>
      } @else if (filtered().length === 0) {
        <div class="card p-12 text-center">
          <p class="text-slate-400 text-lg">No questions found</p>
          <a routerLink="/questions/new" class="btn-primary mt-4 inline-flex">Create your first question</a>
        </div>
      } @else {
        <div class="space-y-3">
          @for (q of filtered(); track q.id) {
            <div class="card p-5 hover:border-navy-300 transition-all group">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-800 line-clamp-2" [innerHTML]="q.question_text"></p>
                  <div class="flex flex-wrap items-center gap-2 mt-3">
                    <span class="badge badge-navy">{{ q.course_name }}</span>
                    <span class="badge"
                          [class.badge-green]="q.difficulty === 'EASY'"
                          [class.badge-blue]="q.difficulty === 'MEDIUM'"
                          [class.badge-red]="q.difficulty === 'HARD'">{{ q.difficulty }}</span>
                    @if (q.subject) {
                      <span class="badge badge-slate">{{ q.subject }}</span>
                    }
                    @if (q.topic) {
                      <span class="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{{ q.topic }}</span>
                    }
                  </div>
                </div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <a [routerLink]="['/questions', q.id, 'edit']"
                     class="btn-ghost text-xs !px-3 !py-1.5">Edit</a>
                  <button (click)="deleteQuestion(q.id)" class="btn-ghost text-xs !px-3 !py-1.5 text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class QuestionListComponent implements OnInit {
  private api = inject(ApiService);

  questions = signal<any[]>([]);
  filtered  = signal<any[]>([]);
  courses   = signal<any[]>([]);
  loading   = signal(true);

  searchTerm = '';
  selectedCourse = '';
  selectedDifficulty = '';

  ngOnInit() {
    this.api.getCourses().subscribe({ next: (c: any) => this.courses.set(c), error: () => {} });
    this.loadQuestions();
  }

  loadQuestions() {
    this.loading.set(true);
    this.api.getQuestions().subscribe({
      next: (q: any[]) => { this.questions.set(q); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    let list = this.questions();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter((q: any) => q.question_text?.toLowerCase().includes(term));
    }
    if (this.selectedCourse) list = list.filter((q: any) => String(q.course_id) === this.selectedCourse);
    if (this.selectedDifficulty) list = list.filter((q: any) => q.difficulty === this.selectedDifficulty);
    this.filtered.set(list);
  }

  deleteQuestion(id: number) {
    if (!confirm('Delete this question permanently?')) return;
    this.api.deleteQuestion(id).subscribe({
      next: () => this.loadQuestions(),
      error: () => alert('Failed to delete question')
    });
  }
}
