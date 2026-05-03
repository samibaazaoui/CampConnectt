import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('camp_token');
  const userStr = localStorage.getItem('camp_user');

  if (!token || !userStr) {
    router.navigate(['/login']);
    return false;
  }

  const user = JSON.parse(userStr);
  const backofficeRoles = ['ADMIN', 'CAMPSITE_OWNER', 'EQUIPMENT_OWNER'];
  
  if (!backofficeRoles.includes(user.role)) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
