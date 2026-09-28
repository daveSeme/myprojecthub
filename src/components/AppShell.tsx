'use client';

import Link from 'next/link';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

import { useAuth } from './AuthProvider';
import {
  canAccessArea,
  type AppArea,
} from '@/lib/permissions';

interface NavigationItem {
  href: AppArea;
  label: string;
  icon: string;
}

const navigationItems: NavigationItem[] = [
  {
    href: 'dashboard',
    label: 'Dashboard',
    icon: 'bi-grid-1x2',
  },
  {
    href: 'projects',
    label: 'Projects',
    icon: 'bi-kanban',
  },
  {
    href: 'my-work',
    label: 'My Work',
    icon: 'bi-check2-square',
  },
  {
    href: 'tasks',
    label: 'Tasks',
    icon: 'bi-list-task',
  },
  {
    href: 'tickets',
    label: 'QA Tickets',
    icon: 'bi-bug',
  },
  {
    href: 'updates',
    label: 'Updates',
    icon: 'bi-journal-text',
  },
  {
    href: 'activity',
    label: 'Activity',
    icon: 'bi-activity',
  },
  {
    href: 'team',
    label: 'Team',
    icon: 'bi-people',
  },
  {
    href: 'settings',
    label: 'Settings',
    icon: 'bi-gear',
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    user,
    profile,
    loading,
    logout,
  } = useAuth();

  if (loading) {
    return (
      <div className="login-wrap">
        <div className="login-card text-center">
          <div
            className="spinner-border mb-3"
            role="status"
            aria-hidden="true"
          />

          <h5 className="mb-1">
            Loading Project Hub
          </h5>

          <p className="muted mb-0">
            Preparing your workspace…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h2>Project Hub</h2>

          <p className="muted">
            Please sign in to continue.
          </p>

          <Link
            className="btn btn-dark"
            href="/login"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="login-wrap">
        <div className="login-card text-center">
          <div className="mb-3">
            <i
              className="bi bi-person-circle"
              style={{ fontSize: '36px' }}
            />
          </div>

          <h5 className="mb-2">
            Setting up your workspace
          </h5>

          <p className="muted mb-3">
            Your account is authenticated, but your
            Project Hub profile could not be loaded.
          </p>

          <button
            type="button"
            className="btn btn-dark"
            onClick={() => {
              window.location.reload();
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /*
   * Only show navigation areas that the user's role
   * is actually allowed to access.
   */
  const visibleItems = navigationItems.filter(
    (item) =>
      canAccessArea(
        profile.role,
        item.href,
      ),
  );

  /*
   * Find the most specific matching route.
   * This prevents /projects/123 from losing
   * the Projects active state.
   */
  const currentItem = [...visibleItems]
    .sort(
      (a, b) =>
        b.href.length - a.href.length,
    )
    .find((item) =>
      pathname === `/${item.href}` ||
      pathname.startsWith(
        `/${item.href}/`,
      ),
    );

  const currentPage =
    currentItem?.label ?? 'Project Hub';

  const initials =
    profile.name
      ?.split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  async function handleLogout() {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error(
        'Sign out failed:',
        error,
      );
    }
  }

  return (
    <div className="project-shell">

      <aside className="sidebar">

        <div className="brand mb-4">
          <span>MY</span>
          <span className="brand-text">
            {' '}PROJECT HUB
          </span>
        </div>

        <nav>
          {visibleItems.map(
            ({
              href,
              label,
              icon,
            }) => {
              const active =
                pathname === `/${href}` ||
                pathname.startsWith(
                  `/${href}/`,
                );

              return (
                <Link
                  key={href}
                  href={`/${href}`}
                  className={
                    `nav-link ${
                      active
                        ? 'active'
                        : ''
                    }`
                  }
                >
                  <i
                    className={`bi ${icon}`}
                  />

                  <span className="label">
                    {label}
                  </span>
                </Link>
              );
            },
          )}
        </nav>

        <div className="sidebar-bottom">

          <Link
            href="/settings"
            className="sidebar-user"
          >
            <div className="sidebar-user-avatar">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.name}
                />
              ) : (
                initials
              )}
            </div>

            <div className="sidebar-user-info">
              <strong>
                {profile.name}
              </strong>

              <span className="text-capitalize">
                {profile.role}
              </span>
            </div>

            <i className="bi bi-chevron-right" />
          </Link>

          <button
            type="button"
            className="nav-link btn text-start w-100"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right" />

            <span className="label">
              Sign out
            </span>
          </button>

        </div>

      </aside>

      <main className="main">

        <header className="topbar">

          <div className="topbar-page">
            <span className="topbar-kicker">
              PROJECT HUB
            </span>

            <strong>
              {currentPage}
            </strong>
          </div>

          <div className="d-flex align-items-center gap-3">

            <span className="badge badge-soft text-capitalize">
              {profile.role}
            </span>

            <Link
              href="/settings"
              className="topbar-profile"
            >
              <div className="topbar-avatar">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                  />
                ) : (
                  initials
                )}
              </div>

              <span>
                {profile.name}
              </span>
            </Link>

          </div>

        </header>

        <div className="content">
          {children}
        </div>

      </main>

    </div>
  );
}