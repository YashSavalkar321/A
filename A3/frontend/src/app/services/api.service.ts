import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AdminDashboardData, FacultyDashboardData, StudentDashboardData, Role, RolePermissionRow } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` }) };
  }

  // Generic CRUD
  getAll(entity: string) { return this.http.get<any[]>(`${this.base}/${entity}`, this.headers()); }
  create(entity: string, body: any) { return this.http.post<any>(`${this.base}/${entity}`, body, this.headers()); }
  update(entity: string, id: string, body: any) { return this.http.put<any>(`${this.base}/${entity}/${id}`, body, this.headers()); }
  delete(entity: string, id: string) { return this.http.delete<any>(`${this.base}/${entity}/${id}`, this.headers()); }

  // Report
  getReport(table: string) { return this.http.get<any>(`${this.base}/report/${table}`, this.headers()); }
  customReport(sql: string) { return this.http.post<any>(`${this.base}/report/custom`, { sql }, this.headers()); }
  getDashboardStats() { return this.http.get<any>(`${this.base}/report/stats/summary`, this.headers()); }

  // ── Role-Based Dashboard APIs ──────────────────────────────────────────
  getAdminDashboard() {
    return this.http.get<AdminDashboardData>(`${this.base}/dashboard/admin`, this.headers());
  }
  getFacultyDashboard() {
    return this.http.get<FacultyDashboardData>(`${this.base}/dashboard/faculty`, this.headers());
  }
  getStudentDashboard() {
    return this.http.get<StudentDashboardData>(`${this.base}/dashboard/student`, this.headers());
  }
  updateGrade(body: { student_id: string; course_id: string; sec_id: string; semester: string; year: number; grade: string }) {
    return this.http.put<any>(`${this.base}/dashboard/faculty/grade`, body, this.headers());
  }

  // ── Export / Download ─────────────────────────────────────────────────
  exportDashboard(role: 'admin' | 'faculty' | 'student', format: 'csv' | 'pdf') {
    return this.http.get(`${this.base}/export/${role}?format=${format}`, {
      ...this.headers(),
      responseType: 'blob',
      observe: 'response'
    });
  }

  /** Trigger browser download from a Blob response */
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Users
  getUsers() { return this.http.get<any[]>(`${this.base}/auth`, this.headers()); }
  createUser(body: any) { return this.http.post<any>(`${this.base}/auth`, body, this.headers()); }
  updateUser(id: number, body: any) { return this.http.put<any>(`${this.base}/auth/${id}`, body, this.headers()); }
  deleteUser(id: number) { return this.http.delete<any>(`${this.base}/auth/${id}`, this.headers()); }

  // ── Role Management (RBAC) ────────────────────────────────────────────
  getRoles() { return this.http.get<Role[]>(`${this.base}/role`, this.headers()); }
  createRole(body: { name: string; description?: string }) { return this.http.post<Role>(`${this.base}/role`, body, this.headers()); }
  updateRole(id: number, body: { name?: string; description?: string }) { return this.http.put<any>(`${this.base}/role/${id}`, body, this.headers()); }
  deleteRole(id: number) { return this.http.delete<any>(`${this.base}/role/${id}`, this.headers()); }
  getRolePermissions(id: number) { return this.http.get<RolePermissionRow[]>(`${this.base}/role/${id}/permissions`, this.headers()); }
  updateRolePermissions(id: number, permissions: RolePermissionRow[]) {
    // Backend expects { resource: { read, create, update, delete } } — convert from array of rows
    const permObj: Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }> = {};
    for (const p of permissions) {
      permObj[p.resource] = { read: !!p.can_read, create: !!p.can_create, update: !!p.can_update, delete: !!p.can_delete };
    }
    return this.http.put<any>(`${this.base}/role/${id}/permissions`, { permissions: permObj }, this.headers());
  }
  getAvailableResources() { return this.http.get<string[]>(`${this.base}/role/resources`, this.headers()); }
}
