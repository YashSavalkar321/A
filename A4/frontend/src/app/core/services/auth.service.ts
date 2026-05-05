import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthUser, LoginRequest, RegisterRequest, AuthResponse, Role } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  // ── Signals ────────────────────────────────────────────────
  private _user = signal<AuthUser | null>(null);

  readonly user            = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly role            = computed<Role | null>(() => this._user()?.role ?? null);
  readonly primaryRole     = computed<string>(() => this._user()?.role ?? '');
  readonly isAdmin         = computed(() => this.role() === 'ADMIN');
  readonly isFaculty       = computed(() => this.role() === 'FACULTY');
  readonly isStudent       = computed(() => this.role() === 'STUDENT');
  readonly isStaff         = computed(() => this.isAdmin() || this.isFaculty());

  constructor() {
    // Rehydrate from localStorage (user info only — token is in httpOnly cookie)
    const stored = localStorage.getItem('exam_user');
    if (stored) {
      try { this._user.set(JSON.parse(stored)); } catch { /* ignore */ }
    }

    // Persist user info changes
    effect(() => {
      const u = this._user();
      if (u) localStorage.setItem('exam_user', JSON.stringify(u));
      else   localStorage.removeItem('exam_user');
    });
  }

  /** Redirect to dashboard after login */
  get dashboardRoute(): string {
    return '/dashboard';
  }

  login(credentials: LoginRequest) {
    return this.http.post<AuthResponse>('http://localhost:3000/api/auth/login', credentials).pipe(
      tap(res => this._user.set(res.user))
    );
  }

  register(data: RegisterRequest) {
    return this.http.post<{ message: string }>('http://localhost:3000/api/auth/register', data);
  }

  logout() {
    this.http.post('http://localhost:3000/api/auth/logout', {}).subscribe();
    this._user.set(null);
    this.router.navigate(['/auth']);
  }

  hasRole(role: Role): boolean {
    return this.role() === role;
  }
}
