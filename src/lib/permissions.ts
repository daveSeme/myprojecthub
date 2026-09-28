import type { Role } from './types';

export type AppArea =
  | 'dashboard'
  | 'projects'
  | 'my-work'
  | 'tasks'
  | 'tickets'
  | 'updates'
  | 'activity'
  | 'team'
  | 'settings';

export type Permission =
  | 'view_dashboard'
  | 'view_projects'
  | 'manage_projects'
  | 'view_tasks'
  | 'manage_tasks'
  | 'view_tickets'
  | 'create_tickets'
  | 'manage_tickets'
  | 'view_updates'
  | 'create_updates'
  | 'view_activity'
  | 'view_team'
  | 'manage_team'
  | 'view_settings'
  | 'manage_settings';

const areaRoles: Record<AppArea, Role[]> = {
  dashboard: [
    'admin',
    'developer',
    'tester',
  ],

  projects: [
    'admin',
    'developer',
    'tester',
  ],

  'my-work': [
    'admin',
    'developer',
    'tester',
  ],

  tasks: [
    'admin',
    'developer',
    'tester',
  ],

  tickets: [
    'admin',
    'developer',
    'tester',
  ],

  updates: [
    'admin',
    'developer',
    'tester',
  ],

  activity: [
    'admin',
    'developer',
    'tester',
  ],

  team: [
    'admin',
    'developer',
    'tester',
  ],

  settings: [
    'admin',
    'developer',
    'tester',
  ],
};

const rolePermissions: Record<
  Role,
  Permission[]
> = {
  admin: [
    'view_dashboard',

    'view_projects',
    'manage_projects',

    'view_tasks',
    'manage_tasks',

    'view_tickets',
    'create_tickets',
    'manage_tickets',

    'view_updates',
    'create_updates',

    'view_activity',

    'view_team',
    'manage_team',

    'view_settings',
    'manage_settings',
  ],

  developer: [
    'view_dashboard',

    'view_projects',

    'view_tasks',
    'manage_tasks',

    'view_tickets',

    'view_updates',
    'create_updates',

    'view_activity',

    'view_team',

    'view_settings',
  ],

  tester: [
    'view_dashboard',

    'view_projects',

    'view_tasks',

    'view_tickets',
    'create_tickets',

    'view_updates',
    'create_updates',

    'view_activity',

    'view_team',

    'view_settings',
  ],
};

/**
 * Check whether a role can access a top-level
 * application area.
 */
export function canAccess(
  role: Role | undefined | null,
  area: AppArea,
): boolean {
  if (!role) return false;

  return areaRoles[area].includes(role);
}

/**
 * Alias used by AppShell and other navigation
 * components.
 */
export function canAccessArea(
  role: Role | undefined | null,
  area: AppArea,
): boolean {
  return canAccess(role, area);
}

/**
 * Check whether a role has a specific permission.
 */
export function can(
  role: Role | undefined | null,
  permission: Permission,
): boolean {
  if (!role) return false;

  return rolePermissions[role].includes(
    permission,
  );
}

/**
 * Role helpers.
 */
export function isAdmin(
  role: Role | undefined | null,
): boolean {
  return role === 'admin';
}

export function isDeveloper(
  role: Role | undefined | null,
): boolean {
  return role === 'developer';
}

export function isTester(
  role: Role | undefined | null,
): boolean {
  return role === 'tester';
}