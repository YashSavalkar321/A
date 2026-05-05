import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../services/api.service';
import { DashboardStats } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = { students: 0, instructors: 0, courses: 0, departments: 0 };
  loading = true;

  cards = [
    { key: 'students',    label: 'Students',     icon: 'school',          color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)', route: '/students' },
    { key: 'instructors', label: 'Instructors',  icon: 'person',          color: '#0891b2', gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)', route: '/instructors' },
    { key: 'courses',     label: 'Courses',      icon: 'menu_book',       color: '#7c3aed', gradient: 'linear-gradient(135deg,#5b21b6,#7c3aed)', route: '/courses' },
    { key: 'departments', label: 'Departments',  icon: 'business',        color: '#a855f7', gradient: 'linear-gradient(135deg,#a855f7,#d946ef)', route: '/departments' },
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
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getDashboardStats().subscribe({
      next: s => { this.stats = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getStatValue(key: string): number {
    return (this.stats as any)[key] ?? 0;
  }
}
