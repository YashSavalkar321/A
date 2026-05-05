import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AppUser } from '../../models';
import { FormDialogComponent } from '../../shared/form-dialog/form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatTableModule,
    MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDialogModule, MatSnackBarModule, MatTooltipModule,
    MatProgressBarModule, MatChipsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<AppUser>([]);
  displayedColumns = ['id', 'username', 'role', 'created_at', 'actions'];
  loading = false;
  searchText = '';
  roleNames: string[] = ['admin', 'faculty', 'student'];

  userFields: any[] = this.buildUserFields();
  editFields: any[] = this.buildEditFields();

  constructor(private api: ApiService, private authService: AuthService,
    private dialog: MatDialog, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadRoleNames();
    this.load();
  }

  ngAfterViewInit() { this.dataSource.sort = this.sort; this.dataSource.paginator = this.paginator; }

  private loadRoleNames() {
    this.authService.getRoleNames().subscribe({
      next: names => {
        this.roleNames = names;
        this.userFields = this.buildUserFields();
        this.editFields = this.buildEditFields();
      },
      error: () => {} // keep default role names
    });
  }

  private buildUserFields() {
    return [
      { key: 'username', label: 'Username',    type: 'text' as const,   required: true },
      { key: 'password', label: 'Password',    type: 'text' as const,   required: true },
      { key: 'role',     label: 'Role',        type: 'select' as const, required: true,
        options: this.roleNames }
    ];
  }

  private buildEditFields() {
    return [
      { key: 'username', label: 'Username',         type: 'text' as const,   required: true },
      { key: 'password', label: 'New Password (optional)', type: 'text' as const, required: false },
      { key: 'role',     label: 'Role',             type: 'select' as const, required: true,
        options: this.roleNames }
    ];
  }

  load() {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: data => { this.dataSource.data = data; this.loading = false; },
      error: e => { this.snack.open(e.error?.message || 'Load failed', 'X', { duration: 3000 }); this.loading = false; }
    });
  }

  applyFilter() { this.dataSource.filter = this.searchText.trim().toLowerCase(); }

  openAdd() {
    this.dialog.open(FormDialogComponent, {
      data: { title: 'Add User', icon: 'person_add', fields: this.userFields }
    }).afterClosed().subscribe(val => {
      if (!val) return;
      this.api.createUser(val).subscribe({
        next: () => { this.snack.open('User created', '✓', { duration: 2500 }); this.load(); },
        error: e => this.snack.open(e.error?.message || 'Create failed', 'X', { duration: 3500 })
      });
    });
  }

  openEdit(user: AppUser) {
    this.dialog.open(FormDialogComponent, {
      data: { title: 'Edit User', icon: 'edit', fields: this.editFields, record: user }
    }).afterClosed().subscribe(val => {
      if (!val) return;
      if (!val.password) delete val.password;
      this.api.updateUser(user.id, val).subscribe({
        next: () => { this.snack.open('User updated', '✓', { duration: 2500 }); this.load(); },
        error: e => this.snack.open(e.error?.message || 'Update failed', 'X', { duration: 3500 })
      });
    });
  }

  openDelete(user: AppUser) {
    this.dialog.open(ConfirmDialogComponent).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteUser(user.id).subscribe({
        next: () => { this.snack.open('User deleted', '✓', { duration: 2500 }); this.load(); },
        error: e => this.snack.open(e.error?.message || 'Delete failed', 'X', { duration: 3500 })
      });
    });
  }

  roleColor(role: string) {
    return role === 'admin' ? 'warn' : role === 'faculty' ? 'accent' : 'primary';
  }
}
