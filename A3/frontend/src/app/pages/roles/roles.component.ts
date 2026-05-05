import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Role, RolePermissionRow } from '../../models';
import { FormDialogComponent } from '../../shared/form-dialog/form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatCheckboxModule, MatDialogModule, MatTooltipModule,
    MatProgressBarModule, MatChipsModule
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  roles: Role[] = [];
  loading = false;

  // Permission editor state
  selectedRole: Role | null = null;
  permissions: RolePermissionRow[] = [];
  permLoading = false;
  permDirty = false;

  readonly actions = ['can_read', 'can_create', 'can_update', 'can_delete'] as const;
  readonly actionLabels: Record<string, string> = {
    can_read: 'Read', can_create: 'Create', can_update: 'Update', can_delete: 'Delete'
  };

  ngOnInit() { this.loadRoles(); }

  loadRoles() {
    this.loading = true;
    this.api.getRoles().subscribe({
      next: data => { this.roles = data; this.loading = false; },
      error: e => { this.toast.error(e.error?.message || 'Failed to load roles'); this.loading = false; }
    });
  }

  openAdd() {
    const ref = this.dialog.open(FormDialogComponent, {
      data: {
        title: 'Create Role', icon: 'add_circle',
        fields: [
          { key: 'name', label: 'Role Name', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'text', required: false }
        ]
      }
    });
    ref.afterClosed().subscribe(val => {
      if (!val) return;
      this.api.createRole(val).subscribe({
        next: () => { this.toast.success('Role created'); this.loadRoles(); },
        error: e => this.toast.error(e.error?.message || 'Failed to create role')
      });
    });
  }

  openEdit(role: Role) {
    const ref = this.dialog.open(FormDialogComponent, {
      data: {
        title: 'Edit Role', icon: 'edit',
        fields: [
          { key: 'name', label: 'Role Name', type: 'text', required: true, readonlyOnEdit: role.is_system },
          { key: 'description', label: 'Description', type: 'text', required: false }
        ],
        record: role
      }
    });
    ref.afterClosed().subscribe(val => {
      if (!val) return;
      this.api.updateRole(role.id, val).subscribe({
        next: () => { this.toast.success('Role updated'); this.loadRoles(); },
        error: e => this.toast.error(e.error?.message || 'Failed to update role')
      });
    });
  }

  openDelete(role: Role) {
    if (role.is_system) {
      this.toast.error('System roles cannot be deleted');
      return;
    }
    this.dialog.open(ConfirmDialogComponent).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteRole(role.id).subscribe({
        next: () => {
          this.toast.success('Role deleted');
          if (this.selectedRole?.id === role.id) this.selectedRole = null;
          this.loadRoles();
        },
        error: e => this.toast.error(e.error?.message || 'Failed to delete role')
      });
    });
  }

  selectRole(role: Role) {
    this.selectedRole = role;
    this.permLoading = true;
    this.permDirty = false;
    this.api.getRolePermissions(role.id).subscribe({
      next: data => { this.permissions = data; this.permLoading = false; },
      error: e => { this.toast.error(e.error?.message || 'Failed to load permissions'); this.permLoading = false; }
    });
  }

  onPermChange() { this.permDirty = true; }

  toggleAll(action: string, event: any) {
    const val = event.checked;
    this.permissions.forEach(p => (p as any)[action] = val);
    this.permDirty = true;
  }

  isAllChecked(action: string): boolean {
    return this.permissions.every(p => (p as any)[action]);
  }

  isSomeChecked(action: string): boolean {
    const checked = this.permissions.filter(p => (p as any)[action]).length;
    return checked > 0 && checked < this.permissions.length;
  }

  savePermissions() {
    if (!this.selectedRole) return;
    this.permLoading = true;
    this.api.updateRolePermissions(this.selectedRole.id, this.permissions).subscribe({
      next: () => {
        this.toast.success('Permissions saved');
        this.permDirty = false;
        this.permLoading = false;
        // Refresh the current user's permissions if they belong to this role
        if (this.auth.getUser()?.role === this.selectedRole?.name) {
          this.auth.refreshPermissions().subscribe();
        }
      },
      error: e => { this.toast.error(e.error?.message || 'Failed to save permissions'); this.permLoading = false; }
    });
  }

  formatResource(resource: string): string {
    return resource.charAt(0).toUpperCase() + resource.slice(1).replace(/_/g, ' ');
  }

  private resourceIcons: Record<string, string> = {
    dashboard: 'dashboard', classroom: 'meeting_room', department: 'business',
    course: 'menu_book', instructor: 'person', student: 'school',
    section: 'layers', teaches: 'cast_for_education', takes: 'assignment',
    advisor: 'supervisor_account', timeslot: 'schedule', prereq: 'account_tree',
    report: 'bar_chart', users: 'manage_accounts', export: 'download',
    roles: 'admin_panel_settings'
  };

  getResourceIcon(resource: string): string {
    return this.resourceIcons[resource] || 'settings';
  }
}
