import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthResponse, AppUser, RolePermissions } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private userSubject = new BehaviorSubject<AppUser | null>(this.loadUser());
  private permissionsSubject = new BehaviorSubject<RolePermissions>(this.loadPermissions());
  user$ = this.userSubject.asObservable();
  permissions$ = this.permissionsSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private loadUser(): AppUser | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  private loadPermissions(): RolePermissions {
    const p = localStorage.getItem('permissions');
    return p ? JSON.parse(p) : {};
  }

  private storePermissions(permissions: RolePermissions) {
    localStorage.setItem('permissions', JSON.stringify(permissions));
    this.permissionsSubject.next(permissions);
  }

  login(username: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.userSubject.next(res.user);
        this.storePermissions(res.permissions || {});
      })
    );
  }

  signup(username: string, password: string, role: 'student' | 'faculty', profile: any) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, { username, password, role, profile }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.userSubject.next(res.user);
        this.storePermissions(res.permissions || {});
      })
    );
  }

  /** Refresh permissions from server (e.g. after admin edits role permissions) */
  refreshPermissions() {
    return this.http.get<RolePermissions>(`${this.apiUrl}/permissions`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    }).pipe(
      tap(perms => this.storePermissions(perms))
    );
  }

  getDepartments() {
    return this.http.get<string[]>(`${this.apiUrl}/departments`);
  }

  getRoleNames() {
    return this.http.get<string[]>(`${this.apiUrl}/roles`);
  }

  logout() {
    localStorage.clear();
    this.userSubject.next(null);
    this.permissionsSubject.next({});
    this.router.navigate(['/login']);
  }

  getToken() { return localStorage.getItem('token'); }
  getUser() { return this.userSubject.value; }
  getProfileId() { return this.getUser()?.profile_id || null; }
  getPermissions() { return this.permissionsSubject.value; }
  isLoggedIn() { return !!this.getToken(); }
  isAdmin()   { return this.getUser()?.role === 'admin'; }
  isFaculty() { return this.getUser()?.role === 'faculty'; }
  isStudent() { return this.getUser()?.role === 'student'; }

  // RBAC permission checks
  hasPermission(resource: string, action: 'read' | 'create' | 'update' | 'delete'): boolean {
    const perms = this.getPermissions();
    return perms?.[resource]?.[action] === true;
  }

  canRead(resource: string): boolean { return this.hasPermission(resource, 'read'); }
  canCreate(resource: string): boolean { return this.hasPermission(resource, 'create'); }
  canUpdate(resource: string): boolean { return this.hasPermission(resource, 'update'); }
  canDelete(resource: string): boolean { return this.hasPermission(resource, 'delete'); }

  canWrite(table: string): boolean {
    return this.canCreate(table) || this.canUpdate(table) || this.canDelete(table);
  }
}
