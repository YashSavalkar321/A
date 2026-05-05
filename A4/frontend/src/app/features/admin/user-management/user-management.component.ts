import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">User Management</h1>
        <p class="text-slate-500 text-sm mt-1">{{ users().length }} registered user(s)</p>
      </div>

      <!-- Search -->
      <div class="card p-4">
        <input [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" class="input max-w-sm"
               placeholder="Search users by name or email…" type="text">
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12"><div class="spinner"></div></div>
      } @else if (filtered().length === 0) {
        <div class="card p-12 text-center text-slate-400">No users found.</div>
      } @else {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of filtered(); track u.id) {
                  <tr>
                    <td class="font-medium text-slate-800">{{ u.full_name }}</td>
                    <td class="text-slate-500">{{ u.email }}</td>
                    <td>
                      <div class="flex flex-wrap gap-1">
                        <span class="badge"
                              [class.badge-red]="u.role === 'ADMIN'"
                              [class.badge-navy]="u.role === 'FACULTY'"
                              [class.badge-blue]="u.role === 'STUDENT'">{{ u.role }}</span>
                      </div>
                    </td>
                    <td>
                      @if (u.is_active) {
                        <span class="badge badge-green">Active</span>
                      } @else {
                        <span class="badge badge-red">Blocked</span>
                      }
                    </td>
                    <td class="text-right">
                      <button (click)="toggleActive(u)"
                              class="btn-ghost text-xs"
                              [class.text-red-500]="u.is_active"
                              [class.text-green-600]="!u.is_active">
                        {{ u.is_active ? 'Block' : 'Unblock' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  private api = inject(ApiService);

  users    = signal<any[]>([]);
  filtered = signal<any[]>([]);
  loading  = signal(true);
  searchTerm = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: (u: any[]) => { this.users.set(u); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    if (!term) { this.filtered.set(this.users()); return; }
    this.filtered.set(this.users().filter(u =>
      u.full_name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
    ));
  }

  toggleActive(u: any) {
    const action = u.is_active ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${action} ${u.full_name}?`)) return;
    this.api.toggleUserStatus(u.id).subscribe({
      next: () => this.load(),
      error: () => alert('Failed to update user status')
    });
  }
}
