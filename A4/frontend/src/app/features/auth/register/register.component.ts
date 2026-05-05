import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div class="text-center max-w-md">
        <h2 class="text-xl font-bold text-slate-900 mb-4">Registration</h2>
        <p class="text-slate-600 mb-6">Please use the Sign Up tab on the main <a routerLink="/auth" class="text-navy-700 font-medium hover:underline">authentication page</a>.</p>
        <a routerLink="/auth" class="btn-primary">Go to Auth Portal</a>
      </div>
    </div>
  `
})
export class RegisterComponent {}
