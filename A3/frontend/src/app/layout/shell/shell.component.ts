import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';

export interface NavItem {
  label: string; icon: string; route: string;
  adminOnly?: boolean;
  resource?: string; // RBAC resource – nav item hidden if user lacks read permission
}

export interface NavGroup {
  groupLabel: string;
  items: NavItem[];
  adminGroupOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatMenuModule, MatDividerModule, MatTooltipModule],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent {
  auth = inject(AuthService);
  user$ = this.auth.user$;
  sidenavOpen = true;

  get dashboardRoute(): string {
    const role = this.auth.getUser()?.role;
    if (role === 'admin') return '/dashboard/admin';
    if (role === 'faculty') return '/dashboard/faculty';
    if (role === 'student') return '/dashboard/student';
    return '/dashboard/generic';
  }

  navGroups: NavGroup[] = [
    {
      groupLabel: 'OVERVIEW',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '##dashboard##', resource: 'dashboard' },
      ]
    },
    {
      groupLabel: 'ACADEMICS',
      items: [
        { label: 'Departments',  icon: 'business',     route: '/departments',  resource: 'department' },
        { label: 'Courses',      icon: 'menu_book',    route: '/courses',      resource: 'course' },
        { label: 'Prerequisites',icon: 'account_tree', route: '/prereqs',      resource: 'prereq' },
        { label: 'Classrooms',   icon: 'meeting_room', route: '/classrooms',   resource: 'classroom' },
        { label: 'Time Slots',   icon: 'schedule',     route: '/timeslots',    resource: 'timeslot' },
      ]
    },
    {
      groupLabel: 'PEOPLE',
      items: [
        { label: 'Instructors',  icon: 'person',       route: '/instructors',  resource: 'instructor' },
        { label: 'Students',     icon: 'school',       route: '/students',     resource: 'student' },
        { label: 'Advisors',     icon: 'supervisor_account', route: '/advisors', resource: 'advisor' },
      ]
    },
    {
      groupLabel: 'MANAGEMENT',
      items: [
        { label: 'Sections',     icon: 'layers',           route: '/sections',  resource: 'section' },
        { label: 'Teaches',      icon: 'cast_for_education', route: '/teaches', resource: 'teaches' },
        { label: 'Takes',        icon: 'assignment',       route: '/takes',     resource: 'takes' },
        { label: 'Reports',      icon: 'bar_chart',        route: '/reports',   resource: 'report' },
      ]
    },
    {
      groupLabel: 'ADMINISTRATION',
      adminGroupOnly: true,
      items: [
        { label: 'Users',        icon: 'manage_accounts', route: '/users',  adminOnly: true, resource: 'users' },
        { label: 'Roles',        icon: 'admin_panel_settings', route: '/roles', adminOnly: true, resource: 'roles' },
      ]
    },
  ];

  /** Check if a nav item should be visible based on RBAC permissions */
  canShowItem(item: NavItem): boolean {
    if (item.adminOnly && !this.auth.isAdmin()) return false;
    if (item.resource) return this.auth.canRead(item.resource);
    return true;
  }

  /** Check if a nav group has any visible items */
  canShowGroup(group: NavGroup): boolean {
    if (group.adminGroupOnly && !this.auth.isAdmin()) return false;
    return group.items.some(item => this.canShowItem(item));
  }

  /** Resolve the actual route for a nav item (handles dynamic dashboard route) */
  resolveRoute(item: NavItem): string {
    return item.route === '##dashboard##' ? this.dashboardRoute : item.route;
  }

  logout() { this.auth.logout(); }
}
