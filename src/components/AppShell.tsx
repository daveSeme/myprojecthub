'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const developerNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { href: '/projects', label: 'My Projects', icon: 'bi-kanban' },
  { href: '/tasks', label: 'My Tasks', icon: 'bi-check2-square' },
  { href: '/tickets', label: 'My Tickets', icon: 'bi-ticket-perforated' },
  { href: '/activity', label: 'My Activity', icon: 'bi-activity' },
  { href: '/profile', label: 'My Profile', icon: 'bi-person' },
];

const testerNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { href: '/projects', label: 'My Projects', icon: 'bi-kanban' },
  { href: '/tasks', label: 'My Tasks', icon: 'bi-check2-square' },
  { href: '/tickets', label: 'My Tickets', icon: 'bi-ticket-perforated' },
  { href: '/activity', label: 'QA Activity', icon: 'bi-bug' },
  { href: '/profile', label: 'My Profile', icon: 'bi-person' },
];

const adminNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { href: '/projects', label: 'All Projects', icon: 'bi-kanban' },
  { href: '/tasks', label: 'All Tasks', icon: 'bi-check2-square' },
  { href: '/tickets', label: 'All Tickets', icon: 'bi-ticket-perforated' },
  { href: '/team', label: 'Team', icon: 'bi-people' },
  { href: '/updates', label: 'Updates', icon: 'bi-journal-text' },
  { href: '/activity', label: 'Activity', icon: 'bi-activity' },
  { href: '/settings', label: 'Settings', icon: 'bi-gear' },
];

function getNavigation(role?: string): NavItem[] {
  switch (role) {
    case 'admin':
      return adminNav;
    case 'tester':
      return testerNav;
    case 'developer':
    default:
      return developerNav;
  }
}

function roleLabel(role?: string) {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'tester':
      return 'QA Tester';
    case 'developer':
      return 'Developer';
    default:
      return 'Team Member';
  }
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, logout } = useAuth();

  const navigation = getNavigation(profile?.role);

  async function handleLogout() {
    try {
      await logout();
      router.replace('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner-border" role="status" />
        <span>Loading workspace...</span>
      </div>
    );
  }

  return (
    <>
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span>PROJECT</span> HUB
        </Link>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="sidebar-user-info">
            <strong>{profile?.name || 'User'}</strong>
            <small>{roleLabel(profile?.role)}</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">WORKSPACE</div>

          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon}`} />
                <span className="label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="nav-link logout-button"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right" />
            <span className="label">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <span className="topbar-title">
              {getPageTitle(pathname, profile?.role)}
            </span>
          </div>

          <div className="topbar-user">
            <div className="topbar-avatar">
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="topbar-user-info">
              <strong>{profile?.name || 'User'}</strong>
              <small>{roleLabel(profile?.role)}</small>
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </>
  );
}

function getPageTitle(pathname: string, role?: string) {
  if (pathname === '/dashboard') {
    if (role === 'admin') return 'Admin Dashboard';
    if (role === 'tester') return 'QA Dashboard';
    return 'My Dashboard';
  }

  if (pathname.startsWith('/projects')) {
    return role === 'admin' ? 'All Projects' : 'My Projects';
  }

  if (pathname.startsWith('/tasks')) {
    return role === 'admin' ? 'All Tasks' : 'My Tasks';
  }

  if (pathname.startsWith('/tickets')) {
    return role === 'admin' ? 'All Tickets' : 'My Tickets';
  }

  if (pathname.startsWith('/team')) return 'Team Management';
  if (pathname.startsWith('/updates')) return 'Project Updates';

  if (pathname.startsWith('/activity')) {
    return role === 'tester' ? 'QA Activity' : 'Activity';
  }

  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/profile')) return 'My Profile';

  return 'Project Hub';
}