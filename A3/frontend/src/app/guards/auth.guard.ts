import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  const role = auth.getUser()?.role;
  const fallback = role === 'faculty' ? '/dashboard/faculty' : role === 'student' ? '/dashboard/student' : '/dashboard/generic';
  router.navigate([fallback]);
  return false;
};

export const facultyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isFaculty() || auth.isAdmin()) return true;
  const role = auth.getUser()?.role;
  const fallback = role === 'student' ? '/dashboard/student' : '/dashboard/generic';
  router.navigate([fallback]);
  return false;
};

export const studentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isStudent() || auth.isAdmin()) return true;
  const role = auth.getUser()?.role;
  const fallback = role === 'faculty' ? '/dashboard/faculty' : '/dashboard/generic';
  router.navigate([fallback]);
  return false;
};

/** Factory: creates a guard that checks if current user can read the given resource */
export function permissionGuard(resource: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.canRead(resource)) return true;
    router.navigate(['/dashboard/generic']);
    return false;
  };
}

/** Resolves the dashboard redirect path based on user role */
export const dashboardRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.getUser()?.role;
  switch (role) {
    case 'admin':   router.navigate(['/dashboard/admin']);   break;
    case 'faculty': router.navigate(['/dashboard/faculty']); break;
    case 'student': router.navigate(['/dashboard/student']); break;
    default:        router.navigate(['/dashboard/generic']); break;
  }
  return false; // always redirect, never render the placeholder route
};
