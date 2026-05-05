import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex items-center justify-center py-24">
      <div class="text-center max-w-md">
        <div class="text-7xl mb-6">🚫</div>
        <h1 class="text-3xl font-bold text-slate-900 mb-3">Access Denied</h1>
        <p class="text-slate-500 mb-8">
          You don't have permission to view this page.
        </p>
        <a routerLink="/" class="btn-primary">Go to Dashboard</a>
      </div>
    </div>
  `
})
export class UnauthorizedComponent {}
