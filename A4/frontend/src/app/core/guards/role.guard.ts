import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/models';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const allowedRoles: Role[] = route.data['roles'] ?? [];
  if (!allowedRoles.length) return true;

  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth']);

  const userRole = auth.role();
  if (userRole && allowedRoles.includes(userRole)) return true;

  return router.createUrlTree(['/unauthorized']);
};
