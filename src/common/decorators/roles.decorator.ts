import { SetMetadata } from '@nestjs/common';
export type Role = 'customer' | 'host' | 'admin' | 'super_admin';

export const Role = {
  CUSTOMER: 'customer' as Role,
  HOST: 'host' as Role,
  ADMIN: 'admin' as Role,
  SUPER_ADMIN: 'super_admin' as Role,
};
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
