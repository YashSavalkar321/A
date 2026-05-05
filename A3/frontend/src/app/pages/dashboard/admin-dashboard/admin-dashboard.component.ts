import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { AdminDashboardData } from '../../../models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressBarModule, MatTableModule, MatMenuModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  data: AdminDashboardData | null = null;
  loading = true;
  error = '';
  exporting = false;

  kpiCards = [
    { key: 'total_students',    label: 'Students',    icon: 'school',          gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)', route: '/students' },
    { key: 'total_instructors', label: 'Instructors', icon: 'person',          gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)', route: '/instructors' },
    { key: 'total_courses',     label: 'Courses',     icon: 'menu_book',       gradient: 'linear-gradient(135deg,#5b21b6,#7c3aed)', route: '/courses' },
    { key: 'total_departments', label: 'Departments', icon: 'business',        gradient: 'linear-gradient(135deg,#a855f7,#d946ef)', route: '/departments' },
    { key: 'total_sections',    label: 'Sections',    icon: 'layers',          gradient: 'linear-gradient(135deg,#059669,#10b981)', route: '/sections' },
    { key: 'total_users',       label: 'Users',       icon: 'manage_accounts', gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', route: '/users' },
  ];

  quickLinks = [
    { label: 'Manage Sections',    icon: 'layers',              route: '/sections' },
    { label: 'Manage Time Slots',  icon: 'schedule',            route: '/timeslots' },
    { label: 'Enrollment (Takes)', icon: 'assignment',          route: '/takes' },
    { label: 'Teaching Assigns.',  icon: 'cast_for_education',  route: '/teaches' },
    { label: 'Advisors',           icon: 'supervisor_account',  route: '/advisors' },
    { label: 'Prerequisites',      icon: 'account_tree',        route: '/prereqs' },
    { label: 'Classrooms',         icon: 'meeting_room',        route: '/classrooms' },
    { label: 'Reports',            icon: 'bar_chart',           route: '/reports' },
    { label: 'User Management',    icon: 'manage_accounts',     route: '/users' },
  ];

  enrollmentCols = ['student_name', 'course_title', 'semester', 'year', 'grade'];

  constructor(private api: ApiService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getAdminDashboard().subscribe({
      next: d => { this.data = d; this.loading = false; this.cdr.markForCheck(); },
      error: e => { this.error = e.error?.message || 'Failed to load dashboard'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  kpiValue(key: string): number {
    return (this.data?.kpis as any)?.[key] ?? 0;
  }

  maxDeptStudents(): number {
    if (!this.data?.deptStudentDistribution?.length) return 1;
    return Math.max(...this.data.deptStudentDistribution.map(d => +d.student_count));
  }

  maxCourseEnrollment(): number {
    if (!this.data?.coursePopularity?.length) return 1;
    return Math.max(...this.data.coursePopularity.map(d => +d.enrollment_count));
  }

  exportReport(format: 'csv' | 'pdf') {
    this.exporting = true;
    this.api.exportDashboard('admin', format).subscribe({
      next: resp => {
        const blob = resp.body!;
        const ext = format === 'pdf' ? 'pdf' : 'csv';
        this.api.downloadBlob(blob, `Admin_Dashboard_Report.${ext}`);
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
