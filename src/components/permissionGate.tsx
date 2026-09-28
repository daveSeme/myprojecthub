'use client';

import type { ReactNode } from 'react';
import type { Role } from '@/lib/types';
import {
  can,
  canAccess,
  type AppArea,
  type Permission,
} from '@/lib/permissions';

interface PermissionGateProps {
  role?: Role | null;
  area?: AppArea;
  permission?: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({
  role,
  area,
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  if (area && !canAccess(role, area)) {
    return <>{fallback}</>;
  }

  if (permission && !can(role, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}