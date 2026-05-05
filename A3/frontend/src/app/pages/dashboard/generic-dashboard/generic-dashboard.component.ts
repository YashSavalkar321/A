import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../services/auth.service';

interface QuickLink {
  label: string;
  icon: string;
  route: string;
  resource: string;
}

@Component({
  selector: 'app-generic-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './generic-dashboard.component.html',
  styleUrls: ['./generic-dashboard.component.scss']
})
export class GenericDashboardComponent implements OnInit {
  auth = inject(AuthService);
  roleName = '';
  username = '';
  visibleLinks: QuickLink[] = [];

  private allLinks: QuickLink[] = [
    { label: 'Departments',     icon: 'business',            route: '/departments',  resource: 'department' },
    { label: 'Courses',         icon: 'menu_book',           route: '/courses',      resource: 'course' },
    { label: 'Prerequisites',   icon: 'account_tree',        route: '/prereqs',      resource: 'prereq' },
    { label: 'Classrooms',      icon: 'meeting_room',        route: '/classrooms',   resource: 'classroom' },
    { label: 'Time Slots',      icon: 'schedule',            route: '/timeslots',    resource: 'timeslot' },
    { label: 'Instructors',     icon: 'person',              route: '/instructors',  resource: 'instructor' },
    { label: 'Students',        icon: 'school',              route: '/students',     resource: 'student' },
    { label: 'Advisors',        icon: 'supervisor_account',  route: '/advisors',     resource: 'advisor' },
    { label: 'Sections',        icon: 'layers',              route: '/sections',     resource: 'section' },
    { label: 'Teaches',         icon: 'cast_for_education',  route: '/teaches',      resource: 'teaches' },
    { label: 'Takes',           icon: 'assignment',          route: '/takes',        resource: 'takes' },
    { label: 'Reports',         icon: 'bar_chart',           route: '/reports',      resource: 'report' },
  ];

  ngOnInit() {
    const user = this.auth.getUser();
    this.roleName = user?.role || 'User';
    this.username = user?.username || '';
    this.visibleLinks = this.allLinks.filter(l => this.auth.canRead(l.resource));
  }
}
