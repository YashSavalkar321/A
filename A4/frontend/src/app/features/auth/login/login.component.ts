import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex">

      <!-- ═══ LEFT: Branding Panel ═══ -->
      <div class="hidden lg:flex lg:w-1/2 bg-auth-gradient relative overflow-hidden
                  flex-col justify-between p-12 text-white">
        <!-- Decorative shapes -->
        <div class="absolute top-0 right-0 w-96 h-96 bg-navy-700/20 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div class="absolute bottom-0 left-0 w-72 h-72 bg-sky-500/10 rounded-full translate-y-1/3 -translate-x-1/4"></div>

        <div class="relative z-10">
          <h1 class="text-4xl font-bold tracking-tight mb-2">ExamPortal</h1>
          <p class="text-navy-300 text-lg">Enterprise MCQ Examination System</p>
        </div>

        <div class="relative z-10 space-y-8">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-sky-600/30 flex items-center justify-center text-xl flex-shrink-0">📋</div>
            <div>
              <h3 class="font-semibold text-white">Comprehensive Exam Builder</h3>
              <p class="text-sm text-navy-300 mt-1">Create tests with configurable time windows, difficulty tagging, and automated scoring.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-sky-600/30 flex items-center justify-center text-xl flex-shrink-0">📊</div>
            <div>
              <h3 class="font-semibold text-white">Real-Time Analytics</h3>
              <p class="text-sm text-navy-300 mt-1">Monitor live exams, track student progress, and generate detailed reports.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-sky-600/30 flex items-center justify-center text-xl flex-shrink-0">🔒</div>
            <div>
              <h3 class="font-semibold text-white">Role-Based Access</h3>
              <p class="text-sm text-navy-300 mt-1">Separate dashboards for Admins, Faculty, and Students with granular permissions.</p>
            </div>
          </div>
        </div>

        <p class="relative z-10 text-xs text-navy-400">© 2026 ExamPortal — University Examination Platform</p>
      </div>

      <!-- ═══ RIGHT: Auth Forms ═══ -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div class="w-full max-w-md">

          <!-- Mobile brand -->
          <div class="lg:hidden text-center mb-8">
            <h1 class="text-3xl font-bold text-navy-900">ExamPortal</h1>
            <p class="text-slate-500 text-sm mt-1">Enterprise MCQ Examination System</p>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-slate-200 mb-8">
            <button (click)="activeTab.set('login')"
                    class="flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors"
                    [class.border-navy-800]="activeTab() === 'login'"
                    [class.text-navy-900]="activeTab() === 'login'"
                    [class.border-transparent]="activeTab() !== 'login'"
                    [class.text-slate-400]="activeTab() !== 'login'">
              Login
            </button>
            <button (click)="activeTab.set('register')"
                    class="flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors"
                    [class.border-navy-800]="activeTab() === 'register'"
                    [class.text-navy-900]="activeTab() === 'register'"
                    [class.border-transparent]="activeTab() !== 'register'"
                    [class.text-slate-400]="activeTab() !== 'register'">
              Sign Up
            </button>
          </div>

          @if (error()) {
            <div class="alert-error mb-6"><span>⚠️</span><span>{{ error() }}</span></div>
          }
          @if (success()) {
            <div class="alert-success mb-6"><span>✅</span><span>{{ success() }}</span></div>
          }

          <!-- ─── LOGIN TAB ───────────────────────────────── -->
          @if (activeTab() === 'login') {
            <h2 class="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p class="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>

            <form [formGroup]="loginForm" (ngSubmit)="submitLogin()" class="space-y-5">
              <div>
                <label class="input-label">Email address</label>
                <input formControlName="email" type="email" class="input"
                       [class.input-error]="loginInvalid('email')"
                       placeholder="you&#64;university.edu" autocomplete="email">
                @if (loginInvalid('email')) { <p class="error-msg">Valid email required</p> }
              </div>

              <div>
                <label class="input-label">Password</label>
                <input formControlName="password" [type]="showPwd() ? 'text' : 'password'"
                       class="input" [class.input-error]="loginInvalid('password')"
                       placeholder="••••••••" autocomplete="current-password">
                <button type="button" (click)="showPwd.set(!showPwd())"
                        class="text-xs text-slate-500 hover:text-slate-700 mt-1">
                  {{ showPwd() ? 'Hide' : 'Show' }} password
                </button>
                @if (loginInvalid('password')) { <p class="error-msg">Password required</p> }
              </div>

              <button type="submit" class="btn-primary w-full justify-center py-3"
                      [disabled]="loading()">
                @if (loading()) {
                  <span class="spinner h-4 w-4 border-2"></span> Signing in…
                } @else { Sign In }
              </button>
            </form>

            <!-- Demo Credentials -->
            <details class="mt-6 text-xs text-slate-400 border-t border-slate-100 pt-4">
              <summary class="cursor-pointer hover:text-slate-600 font-medium">Demo credentials</summary>
              <div class="mt-2 space-y-1 font-mono bg-slate-50 p-3 rounded-xl">
                <p>admin&#64;university.edu / password123</p>
                <p>faculty1&#64;university.edu / password123</p>
                <p>student1&#64;university.edu / password123</p>
              </div>
            </details>
          }

          <!-- ─── REGISTER TAB ────────────────────────────── -->
          @if (activeTab() === 'register') {
            <h2 class="text-xl font-bold text-slate-900 mb-1">Create your account</h2>
            <p class="text-sm text-slate-500 mb-6">Join as a Student or Faculty member</p>

            <form [formGroup]="registerForm" (ngSubmit)="submitRegister()" class="space-y-5">
              <div>
                <label class="input-label">Full Name</label>
                <input formControlName="fullName" type="text" class="input"
                       [class.input-error]="regInvalid('fullName')" placeholder="John Doe">
                @if (regInvalid('fullName')) { <p class="error-msg">Full name required</p> }
              </div>

              <div>
                <label class="input-label">Email address</label>
                <input formControlName="email" type="email" class="input"
                       [class.input-error]="regInvalid('email')" placeholder="you&#64;university.edu">
                @if (regInvalid('email')) { <p class="error-msg">Valid email required</p> }
              </div>

              <div>
                <label class="input-label">Password</label>
                <input formControlName="password" type="password" class="input"
                       [class.input-error]="regInvalid('password')" placeholder="Min. 6 characters">
                @if (regInvalid('password')) { <p class="error-msg">Min. 6 characters required</p> }
              </div>

              <div>
                <label class="input-label">Role</label>
                <div class="grid grid-cols-2 gap-3 mt-1">
                  <label class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                         [class.border-navy-600]="registerForm.get('role')?.value === 'STUDENT'"
                         [class.bg-navy-50]="registerForm.get('role')?.value === 'STUDENT'"
                         [class.border-slate-200]="registerForm.get('role')?.value !== 'STUDENT'">
                    <input type="radio" formControlName="role" value="STUDENT"
                           class="accent-navy-700 w-4 h-4">
                    <div>
                      <span class="text-sm font-medium text-slate-800">Student</span>
                      <p class="text-xs text-slate-500">Take exams & view results</p>
                    </div>
                  </label>
                  <label class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                         [class.border-navy-600]="registerForm.get('role')?.value === 'FACULTY'"
                         [class.bg-navy-50]="registerForm.get('role')?.value === 'FACULTY'"
                         [class.border-slate-200]="registerForm.get('role')?.value !== 'FACULTY'">
                    <input type="radio" formControlName="role" value="FACULTY"
                           class="accent-navy-700 w-4 h-4">
                    <div>
                      <span class="text-sm font-medium text-slate-800">Faculty</span>
                      <p class="text-xs text-slate-500">Create exams & manage questions</p>
                    </div>
                  </label>
                </div>
              </div>

              <button type="submit" class="btn-primary w-full justify-center py-3"
                      [disabled]="loading()">
                @if (loading()) {
                  <span class="spinner h-4 w-4 border-2"></span> Creating…
                } @else { Create Account }
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private fb     = inject(FormBuilder);
  private router = inject(Router);

  activeTab = signal<'login' | 'register'>('login');
  loading   = signal(false);
  error     = signal('');
  success   = signal('');
  showPwd   = signal(false);

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  registerForm = this.fb.group({
    fullName: ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role:     ['STUDENT']
  });

  loginInvalid(f: string) { const c = this.loginForm.get(f); return c?.invalid && c.touched; }
  regInvalid(f: string)   { const c = this.registerForm.get(f); return c?.invalid && c.touched; }

  submitLogin() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.error.set(''); this.success.set('');
    const { email, password } = this.loginForm.value as { email: string; password: string };

    this.auth.login({ email, password }).subscribe({
      next: () => this.router.navigate([this.auth.dashboardRoute]),
      error: (err: any) => {
        this.error.set(err.error?.message ?? 'Login failed. Please try again.');
        this.loading.set(false);
      }
    });
  }

  submitRegister() {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid) return;
    this.loading.set(true);
    this.error.set(''); this.success.set('');
    const v = this.registerForm.value as any;

    this.auth.register(v).subscribe({
      next: () => {
        this.success.set('Account created! Switch to the Login tab to sign in.');
        this.loading.set(false);
        setTimeout(() => this.activeTab.set('login'), 2000);
      },
      error: (err: any) => {
        this.error.set(err.error?.message ?? 'Registration failed');
        this.loading.set(false);
      }
    });
  }
}
