'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import {
  listProjects,
  listUsers,
  saveProfile,
} from '@/lib/firestore';
import { useAuth } from '@/components/AuthProvider';
import type {
  Profile,
  Project,
  Role,
} from '@/lib/types';

const roles: Role[] = [
  'admin',
  'developer',
  'tester',
];

type RoleFilter = 'all' | Role;

function formatStatus(status: Project['status']) {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatPriority(priority: Project['priority']) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function getRoleIcon(role: Role) {
  switch (role) {
    case 'admin':
      return 'bi-shield-check';
    case 'developer':
      return 'bi-code-slash';
    case 'tester':
      return 'bi-bug';
    default:
      return 'bi-person';
  }
}

function getRoleLabel(role: Role) {
  switch (role) {
    case 'admin':
      return 'Administrators';
    case 'developer':
      return 'Developers';
    case 'tester':
      return 'Testers';
    default:
      return role;
  }
}

function getInitials(name?: string) {
  if (!name?.trim()) return 'U';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getProjectOwner(
  project: Project,
  users: Profile[],
) {
  if (project.ownerId) {
    return users.find((user) => user.uid === project.ownerId);
  }

  return undefined;
}

export default function Team() {
  const { profile } = useAuth();

  const [users, setUsers] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const [selectedMember, setSelectedMember] =
    useState<Profile | null>(null);

  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');

      const [userData, projectData] = await Promise.all([
        listUsers(),
        listProjects(),
      ]);

      setUsers(userData);
      setProjects(projectData);
    } catch (err) {
      console.error(err);
      setError('Unable to load the team workspace.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(
    user: Profile,
    role: Role,
  ) {
    try {
      setChangingRole(user.uid);
      setError('');

      await saveProfile({
        ...user,
        role,
      });

      const refreshedUsers = await listUsers();

      setUsers(refreshedUsers);

      setSelectedMember((current) => {
        if (!current || current.uid !== user.uid) {
          return current;
        }

        return {
          ...current,
          role,
        };
      });
    } catch (err) {
      console.error(err);
      setError('Unable to update the team member role.');
    } finally {
      setChangingRole(null);
    }
  }

  const roleCounts = useMemo(() => {
    return {
      all: users.length,
      admin: users.filter((user) => user.role === 'admin').length,
      developer: users.filter(
        (user) => user.role === 'developer',
      ).length,
      tester: users.filter(
        (user) => user.role === 'tester',
      ).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'all' ||
        user.role === roleFilter;

      const matchesSearch =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const groupedUsers = useMemo(() => {
    return roles.map((role) => ({
      role,
      users: filteredUsers.filter(
        (user) => user.role === role,
      ),
    }));
  }, [filteredUsers]);

  const activeProjects = useMemo(
    () =>
      projects
        .filter((project) => project.status !== 'completed')
        .sort((a, b) => {
          const progressA = Number(a.progress ?? 0);
          const progressB = Number(b.progress ?? 0);

          return progressB - progressA;
        }),
    [projects],
  );

  const averageProgress = useMemo(() => {
    if (!projects.length) return 0;

    return Math.round(
      projects.reduce(
        (total, project) =>
          total + Number(project.progress ?? 0),
        0,
      ) / projects.length,
    );
  }, [projects]);

  if (profile?.role !== 'admin') {
    return (
      <AppShell>
        <div className="team-access">
          <div className="team-access-icon">
            <i className="bi bi-shield-lock" />
          </div>

          <div>
            <h3>Admin access required</h3>
            <p className="muted mb-0">
              Team management is restricted to workspace
              administrators.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="team-page">

        {/* HERO */}
        <section className="team-hero">
          <div className="team-hero-content">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              WORKSPACE ORGANIZATION
            </div>

            <h1>
              Your team,
              <span> in motion.</span>
            </h1>

            <p>
              See who is building, testing and managing your
              projects — all from one connected workspace.
            </p>

            <div className="hero-meta">
              <div className="hero-meta-item">
                <i className="bi bi-people" />
                <span>{users.length} members</span>
              </div>

              <div className="hero-meta-divider" />

              <div className="hero-meta-item">
                <i className="bi bi-kanban" />
                <span>{projects.length} projects</span>
              </div>

              <div className="hero-meta-divider" />

              <div className="hero-meta-item">
                <i className="bi bi-activity" />
                <span>{averageProgress}% workspace progress</span>
              </div>
            </div>
          </div>

          <div className="team-orbit">
            <div className="orbit-ring orbit-ring-one" />
            <div className="orbit-ring orbit-ring-two" />
            <div className="orbit-ring orbit-ring-three" />

            <div className="orbit-center">
              <i className="bi bi-people-fill" />
            </div>

            <div className="orbit-dot orbit-dot-one">
              <i className="bi bi-code-slash" />
            </div>

            <div className="orbit-dot orbit-dot-two">
              <i className="bi bi-bug" />
            </div>

            <div className="orbit-dot orbit-dot-three">
              <i className="bi bi-shield-check" />
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="team-alert">
            <i className="bi bi-exclamation-circle" />
            <span>{error}</span>

            <button
              type="button"
              className="btn btn-sm btn-outline-dark ms-auto"
              onClick={load}
            >
              Retry
            </button>
          </div>
        )}

        {/* METRICS */}
        <section className="team-metrics">

          <button
            type="button"
            className={`team-metric ${
              roleFilter === 'all'
                ? 'active'
                : ''
            }`}
            onClick={() => setRoleFilter('all')}
          >
            <div className="metric-icon">
              <i className="bi bi-people" />
            </div>

            <div className="metric-copy">
              <span>Total team</span>
              <strong>{roleCounts.all}</strong>
            </div>

            <i className="bi bi-arrow-up-right metric-arrow" />
          </button>

          <button
            type="button"
            className={`team-metric ${
              roleFilter === 'admin'
                ? 'active'
                : ''
            }`}
            onClick={() => setRoleFilter('admin')}
          >
            <div className="metric-icon">
              <i className="bi bi-shield-check" />
            </div>

            <div className="metric-copy">
              <span>Administrators</span>
              <strong>{roleCounts.admin}</strong>
            </div>

            <i className="bi bi-arrow-up-right metric-arrow" />
          </button>

          <button
            type="button"
            className={`team-metric ${
              roleFilter === 'developer'
                ? 'active'
                : ''
            }`}
            onClick={() => setRoleFilter('developer')}
          >
            <div className="metric-icon">
              <i className="bi bi-code-slash" />
            </div>

            <div className="metric-copy">
              <span>Developers</span>
              <strong>{roleCounts.developer}</strong>
            </div>

            <i className="bi bi-arrow-up-right metric-arrow" />
          </button>

          <button
            type="button"
            className={`team-metric ${
              roleFilter === 'tester'
                ? 'active'
                : ''
            }`}
            onClick={() => setRoleFilter('tester')}
          >
            <div className="metric-icon">
              <i className="bi bi-bug" />
            </div>

            <div className="metric-copy">
              <span>Testers</span>
              <strong>{roleCounts.tester}</strong>
            </div>

            <i className="bi bi-arrow-up-right metric-arrow" />
          </button>

        </section>

        {/* TEAM DIRECTORY */}
        <section className="team-directory">

          <div className="section-heading">
            <div>
              <div className="section-kicker">
                TEAM DIRECTORY
              </div>

              <h2>
                The people behind the work
              </h2>

              <p className="muted">
                Manage roles and explore everyone connected
                to this workspace.
              </p>
            </div>

            <div className="directory-count">
              <strong>{filteredUsers.length}</strong>
              <span>visible members</span>
            </div>
          </div>

          {/* SEARCH */}
          <div className="team-toolbar">

            <div className="team-search">
              <i className="bi bi-search" />

              <input
                type="search"
                className="form-control"
                placeholder="Search people by name or email..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearch('')}
                  title="Clear search"
                  data-bs-toggle="tooltip"
                >
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>

            <div className="role-filters">
              <button
                type="button"
                className={
                  roleFilter === 'all'
                    ? 'active'
                    : ''
                }
                onClick={() => setRoleFilter('all')}
              >
                All
              </button>

              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={
                    roleFilter === role
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setRoleFilter(role)
                  }
                >
                  <i
                    className={`bi ${getRoleIcon(
                      role,
                    )}`}
                  />
                  {role === 'admin'
                    ? 'Admins'
                    : role === 'developer'
                    ? 'Developers'
                    : 'Testers'}
                </button>
              ))}
            </div>

          </div>

          {/* TEAM GROUPS */}
          {loading ? (
            <div className="team-groups">
              {[1, 2, 3].map((group) => (
                <div
                  className="role-group"
                  key={group}
                >
                  <div className="skeleton-role-heading">
                    <div className="skeleton skeleton-icon" />
                    <div className="skeleton skeleton-title" />
                  </div>

                  <div className="member-grid">
                    {[1, 2, 3].map((item) => (
                      <div
                        className="member-card skeleton-card"
                        key={item}
                      >
                        <div className="skeleton skeleton-avatar" />

                        <div className="member-skeleton-content">
                          <div className="skeleton skeleton-name" />
                          <div className="skeleton skeleton-email" />
                          <div className="skeleton skeleton-role" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="team-empty">
              <div className="team-empty-icon">
                <i className="bi bi-person-x" />
              </div>

              <h3>No team members found</h3>

              <p className="muted">
                Try changing your search or role filter.
              </p>

              <button
                type="button"
                className="btn btn-dark"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-2" />
                Reset filters
              </button>
            </div>
          ) : (
            <div className="team-groups">
              {groupedUsers.map(
                ({ role, users: roleUsers }) => {
                  if (!roleUsers.length) return null;

                  return (
                    <div
                      className="role-group"
                      key={role}
                    >
                      <div className="role-group-heading">
                        <div className="role-heading-icon">
                          <i
                            className={`bi ${getRoleIcon(
                              role,
                            )}`}
                          />
                        </div>

                        <div>
                          <div className="section-kicker">
                            TEAM
                          </div>

                          <h3>
                            {getRoleLabel(role)}
                          </h3>
                        </div>

                        <span className="role-count">
                          {roleUsers.length}
                        </span>

                        <div className="role-heading-line" />
                      </div>

                      <div className="member-grid">
                        {roleUsers.map((user, index) => (
                          <article
                            className="member-card"
                            key={user.uid}
                            style={{
                              animationDelay: `${
                                index * 70
                              }ms`,
                            }}
                          >
                            <button
                              type="button"
                              className="member-main"
                              onClick={() =>
                                setSelectedMember(user)
                              }
                            >
                              <div
                                className={`member-avatar role-${user.role}`}
                              >
                                {user.photoURL ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={user.photoURL}
                                    alt={user.name}
                                  />
                                ) : (
                                  getInitials(user.name)
                                )}
                              </div>

                              <div className="member-info">
                                <h4>{user.name}</h4>

                                <p>
                                  {user.email}
                                </p>

                                <span
                                  className={`role-pill role-${user.role}`}
                                >
                                  <i
                                    className={`bi ${getRoleIcon(
                                      user.role,
                                    )}`}
                                  />
                                  {user.role}
                                </span>
                              </div>

                              <span
                                className="member-open"
                                title="View member"
                                data-bs-toggle="tooltip"
                              >
                                <i className="bi bi-arrow-up-right" />
                              </span>
                            </button>

                            <div className="member-footer">
                              <span>
                                <i className="bi bi-person-badge me-1" />
                                Workspace role
                              </span>

                              <div className="member-role-control">
                                <select
                                  className="form-select form-select-sm"
                                  value={user.role}
                                  disabled={
                                    changingRole ===
                                    user.uid
                                  }
                                  onChange={(e) =>
                                    changeRole(
                                      user,
                                      e.target.value as Role,
                                    )
                                  }
                                  aria-label={`Change role for ${user.name}`}
                                >
                                  <option value="admin">
                                    Admin
                                  </option>
                                  <option value="developer">
                                    Developer
                                  </option>
                                  <option value="tester">
                                    Tester
                                  </option>
                                </select>

                                {changingRole ===
                                  user.uid && (
                                  <span className="role-saving">
                                    <span className="spinner-border spinner-border-sm" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* PROJECT ROADMAP */}
        <section className="project-section">

          <div className="section-heading project-heading">
            <div>
              <div className="section-kicker">
                PROJECT ROADMAP
              </div>

              <h2>
                Where the team is building
              </h2>

              <p className="muted">
                Follow the active work across your workspace
                and see who owns each project.
              </p>
            </div>

            <div className="project-summary">
              <div>
                <strong>
                  {activeProjects.length}
                </strong>
                <span>active tracks</span>
              </div>

              <div className="project-summary-divider" />

              <div>
                <strong>
                  {averageProgress}%
                </strong>
                <span>overall progress</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="roadmap-loading">
              {[1, 2, 3].map((item) => (
                <div
                  className="roadmap-skeleton"
                  key={item}
                >
                  <div className="skeleton roadmap-node" />
                  <div className="skeleton roadmap-card" />
                </div>
              ))}
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="project-empty">
              <div className="project-empty-icon">
                <i className="bi bi-kanban" />
              </div>

              <h3>No active project tracks</h3>

              <p className="muted mb-0">
                Create a project to start building your
                workspace roadmap.
              </p>
            </div>
          ) : (
            <div className="team-roadmap">

              <div className="roadmap-track" />

              {activeProjects.map(
                (project, index) => {
                  const owner = getProjectOwner(
                    project,
                    users,
                  );

                  const progress = Math.max(
                    0,
                    Math.min(
                      100,
                      Number(project.progress ?? 0),
                    ),
                  );

                  return (
                    <article
                      className="roadmap-project"
                      key={project.id}
                      style={{
                        animationDelay: `${
                          index * 120
                        }ms`,
                      }}
                    >
                      <div className="roadmap-marker">
                        <span>
                          {String(index + 1).padStart(
                            2,
                            '0',
                          )}
                        </span>
                      </div>

                      <div className="roadmap-project-card">

                        <div className="roadmap-project-top">

                          <div className="roadmap-project-identity">
                            <div className="project-type-icon">
                              <i className="bi bi-folder2-open" />
                            </div>

                            <div>
                              <span className="project-index">
                                PROJECT {String(index + 1).padStart(2, '0')}
                              </span>

                              <h3>
                                {project.name}
                              </h3>

                              {project.client && (
                                <p>
                                  <i className="bi bi-building me-1" />
                                  {project.client}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="project-status-area">
                            <span
                              className={`status-pill status-${project.status}`}
                            >
                              <span className="status-dot" />
                              {formatStatus(
                                project.status,
                              )}
                            </span>

                            <span
                              className={`priority-label priority-${project.priority}`}
                            >
                              {formatPriority(
                                project.priority,
                              )}
                            </span>
                          </div>

                        </div>

                        <div className="roadmap-project-body">

                          <div className="roadmap-project-description">
                            {project.description ||
                              'No project description has been added yet.'}
                          </div>

                          <div className="project-progress-block">
                            <div className="progress-header">
                              <span>
                                Delivery progress
                              </span>

                              <strong>
                                {progress}%
                              </strong>
                            </div>

                            <div className="project-progress">
                              <div
                                className="project-progress-fill"
                                style={{
                                  width: `${progress}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="roadmap-project-meta">

                            <div className="roadmap-meta-item">
                              <span className="meta-icon">
                                <i className="bi bi-person" />
                              </span>

                              <div>
                                <small>Project owner</small>

                                <strong>
                                  {owner?.name ||
                                    project.ownerName ||
                                    'Unassigned'}
                                </strong>
                              </div>
                            </div>

                            <div className="roadmap-meta-item">
                              <span className="meta-icon">
                                <i className="bi bi-stack" />
                              </span>

                              <div>
                                <small>Project type</small>

                                <strong>
                                  {project.type ||
                                    'General'}
                                </strong>
                              </div>
                            </div>

                            <div className="roadmap-meta-item">
                              <span className="meta-icon">
                                <i className="bi bi-code-square" />
                              </span>

                              <div>
                                <small>Technology</small>

                                <strong>
                                  {project.technologies?.length
                                    ? project.technologies
                                        .slice(0, 2)
                                        .join(' · ')
                                    : 'Not specified'}
                                </strong>
                              </div>
                            </div>

                            {project.deadline && (
                              <div className="roadmap-meta-item">
                                <span className="meta-icon">
                                  <i className="bi bi-calendar3" />
                                </span>

                                <div>
                                  <small>Deadline</small>

                                  <strong>
                                    {project.deadline}
                                  </strong>
                                </div>
                              </div>
                            )}

                          </div>

                          {project.technologies &&
                            project.technologies.length >
                              2 && (
                              <div className="technology-row">
                                {project.technologies
                                  .slice(0, 5)
                                  .map((technology) => (
                                    <span
                                      key={technology}
                                      className="technology-chip"
                                    >
                                      {technology}
                                    </span>
                                  ))}
                              </div>
                            )}

                        </div>

                        <div className="roadmap-project-footer">

                          <div className="owner-stack">
                            {owner ? (
                              <>
                                <div className="mini-avatar">
                                  {owner.photoURL ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={
                                        owner.photoURL
                                      }
                                      alt={owner.name}
                                    />
                                  ) : (
                                    getInitials(
                                      owner.name,
                                    )
                                  )}
                                </div>

                                <span>
                                  Led by{' '}
                                  <strong>
                                    {owner.name}
                                  </strong>
                                </span>
                              </>
                            ) : (
                              <span>
                                No owner assigned
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className="project-action"
                            title={`Open ${project.name}`}
                            data-bs-toggle="tooltip"
                            onClick={() => {
                              window.location.href =
                                `/projects/${project.id}`;
                            }}
                          >
                            <span>
                              Open project
                            </span>

                            <i className="bi bi-arrow-right" />
                          </button>

                        </div>

                      </div>
                    </article>
                  );
                },
              )}

            </div>
          )}
        </section>

        {/* MEMBER DETAIL PANEL */}
        {selectedMember && (
          <div
            className="member-overlay"
            onClick={() =>
              setSelectedMember(null)
            }
          >
            <aside
              className="member-drawer"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="drawer-header">
                <div>
                  <span className="section-kicker">
                    TEAM MEMBER
                  </span>

                  <h2>Member profile</h2>
                </div>

                <button
                  type="button"
                  className="drawer-close"
                  onClick={() =>
                    setSelectedMember(null)
                  }
                  title="Close"
                  data-bs-toggle="tooltip"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div className="drawer-profile">
                <div
                  className={`drawer-avatar role-${selectedMember.role}`}
                >
                  {selectedMember.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedMember.photoURL}
                      alt={selectedMember.name}
                    />
                  ) : (
                    getInitials(
                      selectedMember.name,
                    )
                  )}
                </div>

                <h3>
                  {selectedMember.name}
                </h3>

                <p>
                  {selectedMember.email}
                </p>

                <span
                  className={`role-pill large role-${selectedMember.role}`}
                >
                  <i
                    className={`bi ${getRoleIcon(
                      selectedMember.role,
                    )}`}
                  />
                  {selectedMember.role}
                </span>
              </div>

              <div className="drawer-divider" />

              <div className="drawer-section">
                <span className="section-kicker">
                  RESPONSIBILITY
                </span>

                <h4>
                  Workspace access
                </h4>

                <p className="muted">
                  This role controls how this member
                  participates in the project workspace.
                </p>

                <div className="drawer-role-options">
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={
                        selectedMember.role === role
                          ? 'selected'
                          : ''
                      }
                      disabled={
                        changingRole ===
                        selectedMember.uid
                      }
                      onClick={() =>
                        changeRole(
                          selectedMember,
                          role,
                        )
                      }
                    >
                      <i
                        className={`bi ${getRoleIcon(
                          role,
                        )}`}
                      />

                      <span>
                        <strong>
                          {role === 'admin'
                            ? 'Administrator'
                            : role === 'developer'
                            ? 'Developer'
                            : 'Tester'}
                        </strong>

                        <small>
                          {role === 'admin'
                            ? 'Manage workspace'
                            : role === 'developer'
                            ? 'Build and deliver'
                            : 'Validate quality'}
                        </small>
                      </span>

                      {selectedMember.role ===
                        role && (
                        <i className="bi bi-check2-circle ms-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="drawer-divider" />

              <div className="drawer-section">
                <span className="section-kicker">
                  PROJECT CONNECTION
                </span>

                <h4>
                  Projects owned
                </h4>

                <div className="member-project-list">
                  {projects.filter(
                    (project) =>
                      project.ownerId ===
                      selectedMember.uid,
                  ).length === 0 ? (
                    <div className="no-member-projects">
                      <i className="bi bi-folder2" />

                      <span>
                        No projects currently assigned
                        as owner.
                      </span>
                    </div>
                  ) : (
                    projects
                      .filter(
                        (project) =>
                          project.ownerId ===
                          selectedMember.uid,
                      )
                      .map((project) => (
                        <button
                          type="button"
                          key={project.id}
                          className="drawer-project"
                          onClick={() => {
                            window.location.href =
                              `/projects/${project.id}`;
                          }}
                        >
                          <span className="drawer-project-icon">
                            <i className="bi bi-folder2-open" />
                          </span>

                          <span className="drawer-project-copy">
                            <strong>
                              {project.name}
                            </strong>

                            <small>
                              {formatStatus(
                                project.status,
                              )}{' '}
                              ·{' '}
                              {project.progress}%
                            </small>
                          </span>

                          <i className="bi bi-arrow-up-right" />
                        </button>
                      ))
                  )}
                </div>
              </div>

            </aside>
          </div>
        )}

      </div>

      <style jsx>{`
        .team-page {
          max-width: 1440px;
          margin: 0 auto;
          padding-bottom: 80px;
        }

        .team-hero {
          position: relative;
          min-height: 370px;
          overflow: hidden;
          border-radius: 30px;
          background:
            radial-gradient(
              circle at 80% 20%,
              rgba(200, 169, 110, 0.22),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #191919 0%,
              #242424 48%,
              #151515 100%
            );
          color: #fff;
          padding: 58px 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.12);
          animation: heroIn 700ms ease both;
        }

        .team-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(
              rgba(255,255,255,0.035) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.035) 1px,
              transparent 1px
            );
          background-size: 46px 46px;
          mask-image: linear-gradient(
            to right,
            black,
            transparent
          );
          pointer-events: none;
        }

        .team-hero-content {
          position: relative;
          z-index: 2;
          max-width: 760px;
        }

        .eyebrow,
        .section-kicker {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .eyebrow {
          color: #c8a96e;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .eyebrow-line {
          width: 32px;
          height: 1px;
          background: #c8a96e;
        }

        .team-hero h1 {
          margin: 0;
          font-size: clamp(42px, 5vw, 70px);
          line-height: 0.98;
          letter-spacing: -0.055em;
          font-weight: 700;
        }

        .team-hero h1 span {
          color: #c8a96e;
        }

        .team-hero p {
          max-width: 620px;
          margin: 22px 0 0;
          color: rgba(255,255,255,0.68);
          font-size: 16px;
          line-height: 1.7;
        }

        .hero-meta {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 32px;
        }

        .hero-meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.72);
          font-size: 12px;
          font-weight: 600;
        }

        .hero-meta-item i {
          color: #c8a96e;
        }

        .hero-meta-divider {
          width: 1px;
          height: 18px;
          background: rgba(255,255,255,0.15);
        }

        .team-orbit {
          position: relative;
          width: 280px;
          height: 280px;
          margin-right: 30px;
          flex: 0 0 auto;
        }

        .orbit-ring {
          position: absolute;
          inset: 50%;
          border: 1px solid rgba(200,169,110,0.22);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .orbit-ring-one {
          width: 110px;
          height: 110px;
        }

        .orbit-ring-two {
          width: 190px;
          height: 190px;
        }

        .orbit-ring-three {
          width: 270px;
          height: 270px;
          border-color: rgba(255,255,255,0.07);
        }

        .orbit-center {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 82px;
          height: 82px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #c8a96e;
          color: #171717;
          font-size: 28px;
          box-shadow: 0 0 50px rgba(200,169,110,0.28);
        }

        .orbit-dot {
          position: absolute;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #282828;
          border: 1px solid rgba(255,255,255,0.1);
          color: #c8a96e;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          animation: float 4s ease-in-out infinite;
        }

        .orbit-dot-one {
          top: 24px;
          right: 42px;
        }

        .orbit-dot-two {
          bottom: 26px;
          left: 28px;
          animation-delay: 700ms;
        }

        .orbit-dot-three {
          top: 108px;
          left: 4px;
          animation-delay: 1400ms;
        }

        .team-alert {
          margin-top: 20px;
          padding: 14px 18px;
          border: 1px solid rgba(180, 60, 60, 0.2);
          border-radius: 14px;
          background: rgba(180, 60, 60, 0.06);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: #633b3b;
        }

        .team-alert i {
          color: #a14d4d;
        }

        .team-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 20px;
        }

        .team-metric {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 18px;
          background: #fff;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          transition:
            transform 220ms ease,
            box-shadow 220ms ease,
            border-color 220ms ease;
        }

        .team-metric::after {
          content: '';
          position: absolute;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          right: -45px;
          top: -45px;
          background: rgba(200,169,110,0.08);
        }

        .team-metric:hover,
        .team-metric.active {
          transform: translateY(-4px);
          border-color: rgba(200,169,110,0.4);
          box-shadow: 0 16px 35px rgba(0,0,0,0.08);
        }

        .metric-icon {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #f5f0e8;
          color: #9d7c40;
          font-size: 18px;
        }

        .metric-copy {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .metric-copy span {
          font-size: 11px;
          color: #8c8c8c;
          font-weight: 600;
        }

        .metric-copy strong {
          font-size: 25px;
          line-height: 1;
          color: #1a1a1a;
        }

        .metric-arrow {
          margin-left: auto;
          color: #aaa;
          font-size: 14px;
        }

        .team-directory,
        .project-section {
          margin-top: 64px;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 24px;
        }

        .section-kicker {
          color: #a27d3c;
          margin-bottom: 8px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 30px;
          letter-spacing: -0.035em;
          font-weight: 700;
          color: #1a1a1a;
        }

        .section-heading p {
          margin: 8px 0 0;
          font-size: 14px;
        }

        .directory-count {
          display: flex;
          align-items: baseline;
          gap: 8px;
          white-space: nowrap;
        }

        .directory-count strong {
          font-size: 30px;
          color: #1a1a1a;
        }

        .directory-count span {
          font-size: 11px;
          color: #999;
        }

        .team-toolbar {
          display: flex;
          gap: 14px;
          align-items: center;
          margin-bottom: 34px;
          padding: 14px;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 18px;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(12px);
        }

        .team-search {
          position: relative;
          flex: 1;
          min-width: 240px;
        }

        .team-search > i {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          z-index: 2;
        }

        .team-search input {
          height: 46px;
          padding-left: 42px;
          padding-right: 40px;
          border-color: #e6e3de;
          background: #fff;
          border-radius: 12px;
          font-size: 13px;
          box-shadow: none;
        }

        .team-search input:focus {
          border-color: #c8a96e;
          box-shadow: 0 0 0 3px rgba(200,169,110,0.1);
        }

        .search-clear {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 8px;
          background: #f4f3f1;
          color: #777;
        }

        .role-filters {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .role-filters button {
          border: 0;
          background: transparent;
          border-radius: 10px;
          padding: 10px 13px;
          font-size: 12px;
          font-weight: 700;
          color: #777;
          transition: all 180ms ease;
        }

        .role-filters button i {
          margin-right: 6px;
        }

        .role-filters button:hover {
          background: #f5f0e8;
          color: #1a1a1a;
        }

        .role-filters button.active {
          background: #1a1a1a;
          color: #fff;
        }

        .role-group {
          margin-bottom: 48px;
        }

        .role-group-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 17px;
        }

        .role-heading-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f5f0e8;
          color: #9d7c40;
        }

        .role-group-heading h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .role-group-heading .section-kicker {
          margin-bottom: 3px;
          font-size: 8px;
        }

        .role-count {
          min-width: 27px;
          height: 27px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #1a1a1a;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
        }

        .role-heading-line {
          height: 1px;
          flex: 1;
          background: linear-gradient(
            to right,
            #dedbd4,
            transparent
          );
        }

        .member-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .member-card {
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 18px;
          background: #fff;
          opacity: 0;
          animation: cardIn 550ms ease forwards;
          transition:
            transform 220ms ease,
            box-shadow 220ms ease,
            border-color 220ms ease;
        }

        .member-card:hover {
          transform: translateY(-5px);
          border-color: rgba(200,169,110,0.35);
          box-shadow: 0 20px 45px rgba(0,0,0,0.08);
        }

        .member-main {
          position: relative;
          width: 100%;
          border: 0;
          background: transparent;
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 15px;
          text-align: left;
        }

        .member-avatar,
        .drawer-avatar {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 50%;
          background: #f5f0e8;
          color: #8e6c32;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .member-avatar {
          width: 58px;
          height: 58px;
          font-size: 16px;
        }

        .member-avatar img,
        .drawer-avatar img,
        .mini-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .member-avatar.role-admin,
        .drawer-avatar.role-admin {
          background: #ebe8f5;
          color: #65588f;
        }

        .member-avatar.role-developer,
        .drawer-avatar.role-developer {
          background: #e7f0ee;
          color: #46776d;
        }

        .member-avatar.role-tester,
        .drawer-avatar.role-tester {
          background: #f5eee2;
          color: #986f32;
        }

        .member-info {
          min-width: 0;
        }

        .member-info h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 750;
          color: #1a1a1a;
        }

        .member-info p {
          overflow: hidden;
          margin: 4px 0 9px;
          color: #999;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .role-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 7px;
          background: #f4f3f1;
          color: #777;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .role-pill.role-admin {
          background: #ebe8f5;
          color: #65588f;
        }

        .role-pill.role-developer {
          background: #e7f0ee;
          color: #46776d;
        }

        .role-pill.role-tester {
          background: #f5eee2;
          color: #986f32;
        }

        .role-pill.large {
          padding: 8px 12px;
          font-size: 10px;
        }

        .member-open {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          color: #aaa;
          transition: all 180ms ease;
        }

        .member-main:hover .member-open {
          background: #f5f0e8;
          color: #1a1a1a;
        }

        .member-footer {
          border-top: 1px solid #f0efec;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .member-footer > span {
          color: #999;
          font-size: 9px;
          font-weight: 600;
        }

        .member-role-control {
          position: relative;
          width: 105px;
        }

        .member-role-control select {
          border-color: #e6e3de;
          border-radius: 8px;
          font-size: 10px;
          box-shadow: none;
          padding: 5px 25px 5px 8px;
          height: 30px;
        }

        .member-role-control select:focus {
          border-color: #c8a96e;
          box-shadow: none;
        }

        .role-saving {
          position: absolute;
          right: 28px;
          top: 7px;
          display: flex;
          background: #fff;
        }

        .team-empty,
        .project-empty {
          text-align: center;
          padding: 65px 20px;
          border: 1px dashed #dcd8cf;
          border-radius: 20px;
          background: rgba(255,255,255,0.45);
        }

        .team-empty-icon,
        .project-empty-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #f5f0e8;
          color: #a17c3c;
          font-size: 22px;
        }

        .team-empty h3,
        .project-empty h3 {
          margin: 0 0 7px;
          font-size: 18px;
        }

        .team-empty p,
        .project-empty p {
          font-size: 13px;
        }

        .project-heading {
          align-items: flex-end;
        }

        .project-summary {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 14px 18px;
          border-radius: 14px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.06);
        }

        .project-summary > div:not(.project-summary-divider) {
          display: flex;
          align-items: baseline;
          gap: 7px;
        }

        .project-summary strong {
          font-size: 23px;
        }

        .project-summary span {
          color: #999;
          font-size: 10px;
        }

        .project-summary-divider {
          width: 1px;
          height: 26px;
          background: #e6e3de;
        }

        .team-roadmap {
          position: relative;
          padding: 10px 0 30px;
        }

        .roadmap-track {
          position: absolute;
          left: 31px;
          top: 35px;
          bottom: 35px;
          width: 1px;
          background: linear-gradient(
            to bottom,
            #c8a96e,
            #dedbd4 75%,
            transparent
          );
        }

        .roadmap-project {
          position: relative;
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr);
          gap: 20px;
          margin-bottom: 22px;
          opacity: 0;
          animation: cardIn 650ms ease forwards;
        }

        .roadmap-marker {
          position: relative;
          z-index: 2;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .roadmap-marker::before {
          content: '';
          position: absolute;
          inset: 7px;
          border-radius: 50%;
          background: #faf8f5;
          border: 1px solid #c8a96e;
        }

        .roadmap-marker span {
          position: relative;
          z-index: 2;
          font-size: 9px;
          font-weight: 900;
          color: #8f6e35;
          letter-spacing: 0.04em;
        }

        .roadmap-project-card {
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 20px;
          background: #fff;
          transition:
            transform 240ms ease,
            box-shadow 240ms ease,
            border-color 240ms ease;
        }

        .roadmap-project-card:hover {
          transform: translateX(5px);
          border-color: rgba(200,169,110,0.38);
          box-shadow: 0 20px 45px rgba(0,0,0,0.08);
        }

        .roadmap-project-top {
          padding: 22px 24px;
          border-bottom: 1px solid #f0efec;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .roadmap-project-identity {
          display: flex;
          gap: 14px;
          min-width: 0;
        }

        .project-type-icon {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #1a1a1a;
          color: #c8a96e;
          font-size: 18px;
        }

        .project-index {
          display: block;
          margin-bottom: 3px;
          color: #a17c3c;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        .roadmap-project-identity h3 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.025em;
        }

        .roadmap-project-identity p {
          margin: 5px 0 0;
          color: #999;
          font-size: 11px;
        }

        .project-status-area {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 9px;
          border-radius: 8px;
          background: #f2f2f0;
          color: #666;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .status-active {
          color: #46776d;
          background: #e7f0ee;
        }

        .status-planned {
          color: #786a9a;
          background: #eeeaf6;
        }

        .status-on-hold {
          color: #986f32;
          background: #f5eee2;
        }

        .priority-label {
          font-size: 9px;
          font-weight: 800;
          color: #999;
          text-transform: uppercase;
        }

        .priority-high,
        .priority-critical {
          color: #a25252;
        }

        .roadmap-project-body {
          padding: 22px 24px;
        }

        .roadmap-project-description {
          color: #696969;
          font-size: 13px;
          line-height: 1.65;
          margin-bottom: 22px;
        }

        .project-progress-block {
          margin-bottom: 24px;
        }

        .progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .progress-header span {
          color: #999;
          font-size: 10px;
          font-weight: 600;
        }

        .progress-header strong {
          color: #1a1a1a;
          font-size: 12px;
        }

        .project-progress {
          overflow: hidden;
          height: 7px;
          border-radius: 20px;
          background: #eeeae3;
        }

        .project-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #1a1a1a,
            #c8a96e
          );
          animation: progressIn 1s ease both;
          transform-origin: left;
        }

        .roadmap-project-meta {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .roadmap-meta-item {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .meta-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f7f5f1;
          color: #92733d;
          font-size: 12px;
        }

        .roadmap-meta-item > div {
          min-width: 0;
        }

        .roadmap-meta-item small,
        .roadmap-meta-item strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .roadmap-meta-item small {
          margin-bottom: 3px;
          color: #aaa;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .roadmap-meta-item strong {
          color: #3b3b3b;
          font-size: 10px;
        }

        .technology-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 18px;
        }

        .technology-chip {
          padding: 5px 8px;
          border-radius: 6px;
          background: #f5f3ef;
          color: #777;
          font-size: 9px;
          font-weight: 700;
        }

        .roadmap-project-footer {
          padding: 13px 24px;
          border-top: 1px solid #f0efec;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .owner-stack {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #999;
          font-size: 10px;
        }

        .owner-stack strong {
          color: #555;
        }

        .mini-avatar {
          width: 27px;
          height: 27px;
          overflow: hidden;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
          color: #c8a96e;
          font-size: 8px;
          font-weight: 800;
        }

        .project-action {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 0;
          background: transparent;
          color: #1a1a1a;
          font-size: 11px;
          font-weight: 800;
          transition: gap 180ms ease;
        }

        .project-action:hover {
          gap: 13px;
        }

        .roadmap-loading {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .roadmap-skeleton {
          display: grid;
          grid-template-columns: 64px 1fr;
          gap: 20px;
        }

        .roadmap-node {
          width: 64px;
          height: 64px;
          border-radius: 50%;
        }

        .roadmap-card {
          height: 230px;
          border-radius: 20px;
        }

        .skeleton {
          background: linear-gradient(
            90deg,
            #eeeae3 25%,
            #f7f5f1 37%,
            #eeeae3 63%
          );
          background-size: 400% 100%;
          animation: skeleton 1.4s ease infinite;
        }

        .skeleton-role-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .skeleton-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
        }

        .skeleton-title {
          width: 150px;
          height: 18px;
          border-radius: 5px;
        }

        .skeleton-card {
          height: 140px;
          opacity: 1;
          animation: none;
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .skeleton-avatar {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          border-radius: 50%;
        }

        .member-skeleton-content {
          flex: 1;
        }

        .skeleton-name {
          width: 45%;
          height: 13px;
          margin-bottom: 9px;
          border-radius: 5px;
        }

        .skeleton-email {
          width: 75%;
          height: 9px;
          margin-bottom: 12px;
          border-radius: 4px;
        }

        .skeleton-role {
          width: 65px;
          height: 18px;
          border-radius: 5px;
        }

        .member-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          justify-content: flex-end;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
          animation: fadeIn 200ms ease;
        }

        .member-drawer {
          width: min(440px, 100%);
          height: 100%;
          overflow-y: auto;
          background: #faf8f5;
          box-shadow: -20px 0 60px rgba(0,0,0,0.15);
          animation: drawerIn 300ms ease;
        }

        .drawer-header {
          padding: 28px 28px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .drawer-header h2 {
          margin: 0;
          font-size: 23px;
          letter-spacing: -0.03em;
        }

        .drawer-close {
          width: 36px;
          height: 36px;
          border: 1px solid #dfdcd5;
          border-radius: 10px;
          background: #fff;
          color: #777;
        }

        .drawer-profile {
          padding: 20px 28px 30px;
          text-align: center;
        }

        .drawer-avatar {
          width: 92px;
          height: 92px;
          margin: 0 auto 17px;
          font-size: 24px;
        }

        .drawer-profile h3 {
          margin: 0;
          font-size: 22px;
        }

        .drawer-profile p {
          margin: 5px 0 13px;
          color: #999;
          font-size: 12px;
        }

        .drawer-divider {
          height: 1px;
          background: #e5e1d9;
        }

        .drawer-section {
          padding: 27px 28px;
        }

        .drawer-section h4 {
          margin: 0 0 6px;
          font-size: 15px;
        }

        .drawer-section p {
          font-size: 11px;
          line-height: 1.6;
        }

        .drawer-role-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
        }

        .drawer-role-options button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #e2ded6;
          border-radius: 12px;
          background: #fff;
          text-align: left;
          transition: all 180ms ease;
        }

        .drawer-role-options button:hover {
          border-color: #c8a96e;
        }

        .drawer-role-options button.selected {
          border-color: #c8a96e;
          background: #f5f0e8;
        }

        .drawer-role-options button > i:first-child {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f5f3ef;
          color: #92733d;
        }

        .drawer-role-options span {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .drawer-role-options strong {
          font-size: 11px;
        }

        .drawer-role-options small {
          color: #999;
          font-size: 9px;
        }

        .member-project-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 14px;
        }

        .drawer-project {
          width: 100%;
          border: 1px solid #e4e0d8;
          border-radius: 12px;
          background: #fff;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          transition: all 180ms ease;
        }

        .drawer-project:hover {
          transform: translateX(3px);
          border-color: #c8a96e;
        }

        .drawer-project-icon {
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #1a1a1a;
          color: #c8a96e;
          font-size: 11px;
        }

        .drawer-project-copy {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .drawer-project-copy strong {
          overflow: hidden;
          color: #333;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .drawer-project-copy small {
          color: #999;
          font-size: 8px;
        }

        .drawer-project > i {
          color: #aaa;
          font-size: 11px;
        }

        .no-member-projects {
          padding: 18px;
          border: 1px dashed #dcd8cf;
          border-radius: 12px;
          color: #999;
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 10px;
        }

        @keyframes heroIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes drawerIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes progressIn {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes skeleton {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }

        @media (max-width: 1100px) {
          .team-hero {
            padding: 48px;
          }

          .team-orbit {
            width: 220px;
            height: 220px;
          }

          .orbit-ring-two {
            width: 150px;
            height: 150px;
          }

          .orbit-ring-three {
            width: 210px;
            height: 210px;
          }

          .member-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .roadmap-project-meta {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 800px) {
          .team-hero {
            min-height: auto;
            padding: 38px 28px;
          }

          .team-orbit {
            display: none;
          }

          .team-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .team-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .role-filters {
            overflow-x: auto;
            flex-wrap: nowrap;
          }

          .role-filters button {
            white-space: nowrap;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .project-summary {
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .team-hero {
            border-radius: 20px;
            padding: 34px 22px;
          }

          .team-hero h1 {
            font-size: 42px;
          }

          .hero-meta {
            flex-wrap: wrap;
            gap: 10px 14px;
          }

          .hero-meta-divider {
            display: none;
          }

          .team-metrics {
            grid-template-columns: 1fr 1fr;
            gap: 9px;
          }

          .team-metric {
            padding: 14px;
          }

          .metric-icon {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
          }

          .metric-copy strong {
            font-size: 20px;
          }

          .metric-copy span {
            font-size: 9px;
          }

          .member-grid {
            grid-template-columns: 1fr;
          }

          .roadmap-project {
            grid-template-columns: 40px minmax(0, 1fr);
            gap: 10px;
          }

          .roadmap-track {
            left: 19px;
          }

          .roadmap-marker {
            width: 40px;
            height: 52px;
          }

          .roadmap-marker::before {
            inset: 7px 4px;
          }

          .roadmap-project-top {
            flex-direction: column;
            padding: 18px;
          }

          .project-status-area {
            justify-content: flex-start;
          }

          .roadmap-project-body {
            padding: 18px;
          }

          .roadmap-project-meta {
            grid-template-columns: 1fr 1fr;
          }

          .roadmap-project-footer {
            padding: 12px 18px;
          }

          .owner-stack span {
            display: none;
          }

          .section-heading h2 {
            font-size: 25px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </AppShell>
  );
}