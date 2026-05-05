import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form;
  loading = false;
  hidePassword = true;
  userFocus = false;
  passFocus = false;

  constructor(private fb: FormBuilder, private auth: AuthService,
    private router: Router, private toast: ToastService) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe({
      next: () => {
        this.toast.success(`Welcome back, ${username}!`, 'Signed In');
        // Redirect to role-specific dashboard
        const role = this.auth.getUser()?.role;
        const dashRoute = role === 'admin' ? '/dashboard/admin'
                        : role === 'faculty' ? '/dashboard/faculty'
                        : role === 'student' ? '/dashboard/student'
                        : '/dashboard/generic';
        this.router.navigate([dashRoute]);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Invalid credentials. Please try again.', 'Login Failed');
      }
    });
  }
}
