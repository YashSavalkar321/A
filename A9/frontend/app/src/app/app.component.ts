import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentService, Student, DbType } from './student.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  activeDb: DbType = 'mongo';

  mongoStudents: Student[] = [];
  cassandraStudents: Student[] = [];
  loading = false;

  form = { name: '', email: '', course: '' };
  editingId: string | null = null;

  toast = { show: false, message: '', type: 'success' as 'success' | 'error' };
  private toastTimer: any;

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  /* ── helpers ── */

  get students(): Student[] {
    return this.activeDb === 'mongo' ? this.mongoStudents : this.cassandraStudents;
  }

  switchDb(db: DbType): void {
    if (db === this.activeDb) return;
    this.cancelEdit();
    this.activeDb = db;
  }

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, message, type };
    this.toastTimer = setTimeout(() => (this.toast.show = false), 3500);
  }

  /* ── data ── */

  loadAll(): void {
    this.loading = true;
    this.studentService.getStudents('mongo').subscribe({
      next: d => (this.mongoStudents = d),
      error: () => this.showToast('Failed to load MongoDB students', 'error')
    });
    this.studentService.getStudents('cassandra').subscribe({
      next: d => {
        this.cassandraStudents = d;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load Cassandra students', 'error');
      }
    });
  }

  fetchActive(): void {
    this.loading = true;
    this.studentService.getStudents(this.activeDb).subscribe({
      next: d => {
        if (this.activeDb === 'mongo') this.mongoStudents = d;
        else this.cassandraStudents = d;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to fetch students', 'error');
      }
    });
  }

  /* ── CRUD ── */

  saveStudent(): void {
    const payload = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      course: this.form.course.trim()
    };
    if (!payload.name || !payload.email || !payload.course) {
      this.showToast('All fields are required', 'error');
      return;
    }

    if (this.editingId) {
      this.studentService.updateStudent(this.activeDb, this.editingId, payload).subscribe({
        next: () => {
          this.showToast('Student updated');
          this.cancelEdit();
          this.fetchActive();
        },
        error: e => this.showToast(e?.error?.error || 'Update failed', 'error')
      });
    } else {
      this.studentService.createStudent(this.activeDb, payload).subscribe({
        next: () => {
          this.showToast('Student created');
          this.form = { name: '', email: '', course: '' };
          this.fetchActive();
        },
        error: e => this.showToast(e?.error?.error || 'Create failed', 'error')
      });
    }
  }

  startEdit(s: Student): void {
    this.editingId = s.id;
    this.form = { name: s.name, email: s.email, course: s.course };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form = { name: '', email: '', course: '' };
  }

  deleteStudent(s: Student): void {
    this.studentService.deleteStudent(this.activeDb, s.id).subscribe({
      next: () => {
        this.showToast('Student deleted');
        this.fetchActive();
      },
      error: e => this.showToast(e?.error?.error || 'Delete failed', 'error')
    });
  }
}
