import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { FacultyDashboardData } from '../../../models';

@Component({
  selector: 'app-faculty-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatIconModule, MatButtonModule, MatProgressBarModule,
    MatTableModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatTabsModule,
    MatMenuModule
  ],
  templateUrl: './faculty-dashboard.component.html',
  styleUrls: ['./faculty-dashboard.component.scss']
})
export class FacultyDashboardComponent implements OnInit {
  data: FacultyDashboardData | null = null;
  loading = true;
  error = '';
  exporting = false;

  scheduleCols = ['course_id', 'course_title', 'sec_id', 'semester_year', 'day', 'time', 'room'];
  rosterCols = ['student_id', 'student_name', 'dept_name', 'course_title', 'semester_year', 'grade', 'actions'];
  adviseeCols = ['student_id', 'student_name', 'dept_name', 'tot_cred', 'address', 'mobile_no'];

  gradeOptions = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

  // Track which roster row is being edited
  editingGrade: { [key: string]: string } = {};
  savingGrade: { [key: string]: boolean } = {};

  // Day mapping
  dayMap: Record<string, string> = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri', S: 'Sat', U: 'Sun' };

  constructor(private api: ApiService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getFacultyDashboard().subscribe({
      next: d => { this.data = d; this.loading = false; this.cdr.markForCheck(); },
      error: e => { this.error = e.error?.message || 'Failed to load dashboard'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  rosterKey(r: any): string {
    return `${r.student_id}_${r.course_id}_${r.sec_id}_${r.semester}_${r.year}`;
  }

  startEditGrade(r: any) {
    this.editingGrade[this.rosterKey(r)] = r.grade || '';
  }

  cancelEditGrade(r: any) {
    delete this.editingGrade[this.rosterKey(r)];
  }

  saveGrade(r: any) {
    const key = this.rosterKey(r);
    const grade = this.editingGrade[key];
    this.savingGrade[key] = true;
    this.api.updateGrade({
      student_id: r.student_id,
      course_id: r.course_id,
      sec_id: r.sec_id,
      semester: r.semester,
      year: r.year,
      grade
    }).subscribe({
      next: () => {
        r.grade = grade;
        delete this.editingGrade[key];
        this.savingGrade[key] = false;
        this.toast.success('Grade updated successfully');
        this.cdr.markForCheck();
      },
      error: e => {
        this.savingGrade[key] = false;
        this.toast.error(e.error?.message || 'Failed to update grade');
        this.cdr.markForCheck();
      }
    });
  }

  dayName(d: string): string { return this.dayMap[d] || d; }

  get uniqueSemesters(): string[] {
    if (!this.data?.schedule) return [];
    const set = new Set(this.data.schedule.map(s => `${s.semester} ${s.year}`));
    return Array.from(set);
  }

  exportReport(format: 'csv' | 'pdf') {
    this.exporting = true;
    this.api.exportDashboard('faculty', format).subscribe({
      next: resp => {
        const blob = resp.body!;
        const ext = format === 'pdf' ? 'pdf' : 'csv';
        this.api.downloadBlob(blob, `Faculty_Report.${ext}`);
        this.toast.success(`${format.toUpperCase()} report downloaded`);
        this.exporting = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to export report');
        this.exporting = false;
        this.cdr.markForCheck();
      }
    });
  }
}
