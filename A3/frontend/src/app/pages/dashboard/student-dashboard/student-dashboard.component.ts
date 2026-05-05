import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { StudentDashboardData } from '../../../models';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatProgressBarModule, MatTableModule, MatTabsModule,
    MatMenuModule
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  data: StudentDashboardData | null = null;
  loading = true;
  error = '';
  exporting = false;

  marksheetCols = ['course_id', 'course_title', 'credits', 'semester_year', 'grade'];
  timetableCols = ['day', 'time', 'course_id', 'course_title', 'room'];
  currentCols = ['course_id', 'course_title', 'day', 'time', 'room'];

  dayMap: Record<string, string> = { M: 'Monday', T: 'Tuesday', W: 'Wednesday', R: 'Thursday', F: 'Friday', S: 'Saturday', U: 'Sunday' };
  dayOrder: Record<string, number> = { M: 1, T: 2, W: 3, R: 4, F: 5, S: 6, U: 7 };

  constructor(private api: ApiService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getStudentDashboard().subscribe({
      next: d => { this.data = d; this.loading = false; this.cdr.markForCheck(); },
      error: e => { this.error = e.error?.message || 'Failed to load dashboard'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  dayName(d: string): string { return this.dayMap[d] || d; }

  get gpa(): string {
    if (!this.data?.marksheet?.length) return 'N/A';
    const gradePoints: Record<string, number> = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0
    };
    let totalPoints = 0, totalCredits = 0;
    for (const m of this.data.marksheet) {
      if (m.grade && gradePoints[m.grade] !== undefined) {
        totalPoints += gradePoints[m.grade] * m.credits;
        totalCredits += m.credits;
      }
    }
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 'N/A';
  }

  get sortedTimetable() {
    if (!this.data?.timetable) return [];
    return [...this.data.timetable].sort((a, b) =>
      (this.dayOrder[a.day] || 99) - (this.dayOrder[b.day] || 99) || (a.start_time || '').localeCompare(b.start_time || '')
    );
  }

  exportReport(format: 'csv' | 'pdf') {
    this.exporting = true;
    this.api.exportDashboard('student', format).subscribe({
      next: resp => {
        const blob = resp.body!;
        const ext = format === 'pdf' ? 'pdf' : 'csv';
        this.api.downloadBlob(blob, `Student_Transcript.${ext}`);
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
