import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

function passwordMatch(): ValidatorFn {
  return (g: AbstractControl) => {
    const pw  = g.get('password')?.value;
    const cpw = g.get('confirmPassword')?.value;
    return pw === cpw ? null : { mismatch: true };
  };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  // ── Steps: 1 = role, 2 = account, 3 = profile ──
  step = signal(1);
  selectedRole = signal<'student' | 'faculty' | null>(null);
  departments: string[] = [];
  loading = false;

  // Step 2 — account
  hidePassword = true;
  hideConfirm  = true;
  accountForm;

  // Step 3 — profile
  profileForm;

  // Focus state map
  focus: Record<string, boolean> = {};

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.accountForm = this.fb.group({
      username:        ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^\S+$/)]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordMatch() });

    this.profileForm = this.fb.group({
      id:       ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      name:     ['', [Validators.required, Validators.minLength(2)]],
      dept_name:['', Validators.required],
      // student-only
      tot_cred: [0, [Validators.min(0), Validators.max(999)]],
      // faculty-only
      salary:   [30000, [Validators.min(29001)]],
    });
  }

  ngOnInit() {
    this.auth.getDepartments().subscribe({ next: d => this.departments = d, error: () => {} });
  }

  selectRole(role: 'student' | 'faculty') {
    this.selectedRole.set(role);
  }

  nextFromStep1() {
    if (!this.selectedRole()) {
      this.toast.warning('Please select your role first', 'Required');
      return;
    }
    this.step.set(2);
  }

  nextFromStep2() {
    this.accountForm.markAllAsTouched();
    if (this.accountForm.invalid) return;
    this.step.set(3);
  }

  back() { this.step.update(s => s - 1); }

  submit() {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) return;

    const { username, password } = this.accountForm.value;
    const pv = this.profileForm.value;
    const profile: any = { id: pv.id, name: pv.name, dept_name: pv.dept_name };
    if (this.selectedRole() === 'student') profile.tot_cred = pv.tot_cred ?? 0;
    else                                   profile.salary   = pv.salary ?? 30000;

    this.loading = true;
    this.auth.signup(username!, password!, this.selectedRole()!, profile).subscribe({
      next: () => {
        this.toast.success(`Welcome, ${username}! Account created successfully.`, 'Registration Complete');
        const role = this.selectedRole();
        const dashRoute = role === 'faculty' ? '/dashboard/faculty' : '/dashboard/student';
        this.router.navigate([dashRoute]);
      },
      error: err => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Registration failed. Please try again.', 'Error');
      }
    });
  }

  f(name: string) { return this.accountForm.get(name); }
  p(name: string) { return this.profileForm.get(name); }
}
