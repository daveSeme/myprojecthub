'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';

import {
  listProjectsForUser,
  listTasksForUser,
  listTicketsForUser,
  listUpdatesForUser,
} from '@/lib/firestore';

import type {
  Profile,
  Project,
  Task,
  Ticket,
  Update,
} from '@/lib/types';

type ActivityItem = {
  id: string;
  type: 'project' | 'task' | 'ticket' | 'update';
  title: string;
  description: string;
  projectName?: string;
  person?: string;
  createdAt?: unknown;
};

function getTimestamp(value: unknown): number {
  try {
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate().getTime();
    }

    const date = new Date(value as string | number | Date);

    return Number.isNaN(date.getTime())
      ? 0
      : date.getTime();
  } catch {
    return 0;
  }
}

function formatDate(value: unknown) {
  if (!value) return 'Recently';

  const timestamp = getTimestamp(value);

  if (!timestamp) return 'Recently';

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusLabel(status: Project['status']) {
  return status.replace('-', ' ');
}

function taskStatusLabel(status: Task['status']) {
  if (status === 'in-progress') return 'In Progress';
  if (status === 'todo') return 'To Do';
  if (status === 'review') return 'Review';

  return 'Done';
}

function ticketStatusLabel(status: Ticket['status']) {
  if (status === 'in-progress') return 'In Progress';

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function progressValue(value?: number) {
  return Math.min(100, Math.max(0, value || 0));
}

/* =========================================================
   MAIN
========================================================= */

export default function Dashboard() {
  const { profile } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = profile?.role === 'admin';
  const isDeveloper = profile?.role === 'developer';
  const isTester = profile?.role === 'tester';

  async function loadDashboard(showRefresh = false) {
    if (!profile) return;

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      /*
       * IMPORTANT:
       * These are now role-aware Firestore queries.
       *
       * Admin:
       *   gets workspace-wide data.
       *
       * Developer:
       *   gets owned projects, assigned tasks,
       *   assigned tickets and authored updates.
       *
       * Tester:
       *   gets ticket/project information connected
       *   to their QA work.
       */
      const [
        projectData,
        taskData,
        ticketData,
        updateData,
      ] = await Promise.all([
        listProjectsForUser(profile.uid, profile.role),
        listTasksForUser(profile.uid, profile.role),
        listTicketsForUser(profile.uid, profile.role),
        listUpdatesForUser(profile.uid, profile.role),
      ]);

      setProjects(projectData);
      setTasks(taskData);
      setTickets(ticketData);
      setUpdates(updateData);
    } catch (err) {
      console.error('Dashboard loading error:', err);

      setError(
        'Unable to load your workspace right now. Check your Firebase permissions and try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!profile) return;

    loadDashboard();
  }, [profile]);

  /* =========================================================
     TESTER PROJECTS
     
     Current Project schema does not have testerIds.
     Therefore tester project visibility is derived from
     tickets. We build lightweight project cards from the
     project information stored on those tickets.
  ========================================================= */

  const testerProjects = useMemo<Project[]>(() => {
    if (!isTester) return [];

    const map = new Map<string, Project>();

    tickets.forEach((ticket) => {
      if (!ticket.projectId) return;

      if (map.has(ticket.projectId)) return;

      map.set(ticket.projectId, {
        id: ticket.projectId,
        name: ticket.projectName || 'Project',
        description: '',
        type: 'QA',
        status: 'active',
        priority: ticket.priority,
        progress: 0,
        technologies: [],
        ownerId: ticket.developerId || '',
        ownerName: ticket.developerName,
      });
    });

    return Array.from(map.values());
  }, [isTester, tickets]);

  const visibleProjects = isTester
    ? testerProjects
    : projects;

  /* =========================================================
     PROJECT IDS
  ========================================================= */

  const visibleProjectIds = useMemo(
    () =>
      new Set(
        visibleProjects.map(
          (project) => project.id,
        ),
      ),
    [visibleProjects],
  );

  /* =========================================================
     ACTIVITY
  ========================================================= */

  const activity = useMemo<ActivityItem[]>(() => {
    const projectEvents = projects.map((project) => ({
      id: `project-${project.id}`,
      type: 'project' as const,
      title: `Project: ${project.name}`,
      description:
        project.description ||
        'Project workspace created.',
      projectName: project.name,
      person: project.ownerName,
      createdAt: project.createdAt,
    }));

    const taskEvents = tasks.map((task) => ({
      id: `task-${task.id}`,
      type: 'task' as const,
      title: task.title,
      description:
        `Task is currently ${taskStatusLabel(
          task.status,
        ).toLowerCase()}.`,
      projectName: task.projectName,
      person: task.assigneeName,
      createdAt: task.createdAt,
    }));

    const ticketEvents = tickets.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: 'ticket' as const,
      title: ticket.title,
      description:
        `QA ticket is ${ticketStatusLabel(
          ticket.status,
        ).toLowerCase()}.`,
      projectName: ticket.projectName,
      person:
        isTester
          ? ticket.developerName
          : ticket.testerName,
      createdAt: ticket.createdAt,
    }));

    const updateEvents = updates.map((update) => ({
      id: `update-${update.id}`,
      type: 'update' as const,
      title: 'Project update posted',
      description: update.text,
      projectName: update.projectName,
      person: update.authorName,
      createdAt: update.createdAt,
    }));

    return [
      ...projectEvents,
      ...taskEvents,
      ...ticketEvents,
      ...updateEvents,
    ]
      .sort(
        (a, b) =>
          getTimestamp(b.createdAt) -
          getTimestamp(a.createdAt),
      )
      .slice(0, 8);
  }, [
    projects,
    tasks,
    tickets,
    updates,
    isTester,
  ]);

  /* =========================================================
     PROJECT METRICS
  ========================================================= */

  const activeProjects = useMemo(
    () =>
      visibleProjects.filter(
        (project) =>
          project.status === 'active',
      ),
    [visibleProjects],
  );

  const completedProjects = useMemo(
    () =>
      visibleProjects.filter(
        (project) =>
          project.status === 'completed',
      ),
    [visibleProjects],
  );

  const overallProgress = useMemo(() => {
    if (!visibleProjects.length) return 0;

    return Math.round(
      visibleProjects.reduce(
        (total, project) =>
          total +
          progressValue(project.progress),
        0,
      ) / visibleProjects.length,
    );
  }, [visibleProjects]);

  /* =========================================================
     TASK METRICS
  ========================================================= */

  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status === 'done',
      ),
    [tasks],
  );

  const openTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status !== 'done',
      ),
    [tasks],
  );

  const taskCompletion = useMemo(() => {
    if (!tasks.length) return 0;

    return Math.round(
      (completedTasks.length / tasks.length) *
        100,
    );
  }, [
    tasks.length,
    completedTasks.length,
  ]);

  const taskDistribution = useMemo(
    () => ({
      todo: tasks.filter(
        (task) =>
          task.status === 'todo',
      ).length,

      inProgress: tasks.filter(
        (task) =>
          task.status === 'in-progress',
      ).length,

      review: tasks.filter(
        (task) =>
          task.status === 'review',
      ).length,

      done: completedTasks.length,
    }),
    [tasks, completedTasks.length],
  );

  /* =========================================================
     TICKET METRICS
  ========================================================= */

  const openTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.status !== 'closed' &&
          ticket.status !== 'verified',
      ),
    [tickets],
  );

  const criticalTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.priority === 'critical' &&
          ticket.status !== 'closed' &&
          ticket.status !== 'verified',
      ),
    [tickets],
  );

  const resolvedTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.status === 'resolved' ||
          ticket.status === 'closed' ||
          ticket.status === 'verified',
      ),
    [tickets],
  );

  const qaHealth = useMemo(() => {
    if (!tickets.length) return 100;

    return Math.round(
      (resolvedTickets.length / tickets.length) *
        100,
    );
  }, [
    tickets.length,
    resolvedTickets.length,
  ]);

  /* =========================================================
     ROLE STATS
  ========================================================= */

  const developerStats = useMemo(() => {
    const inProgress = tasks.filter(
      (task) =>
        task.status === 'in-progress',
    ).length;

    const review = tasks.filter(
      (task) =>
        task.status === 'review',
    ).length;

    return {
      completed: completedTasks.length,
      open: openTasks.length,
      review,
      inProgress,
      urgentTickets: criticalTickets.length,
      projectProgress: overallProgress,
    };
  }, [
    tasks,
    completedTasks.length,
    openTasks.length,
    criticalTickets.length,
    overallProgress,
  ]);

  const testerStats = useMemo(() => {
    const total = tickets.length;

    const open = tickets.filter(
      (ticket) =>
        ticket.status === 'open',
    ).length;

    const inProgress = tickets.filter(
      (ticket) =>
        ticket.status === 'in-progress',
    ).length;

    const resolved = tickets.filter(
      (ticket) =>
        ticket.status === 'resolved',
    ).length;

    const verified = tickets.filter(
      (ticket) =>
        ticket.status === 'verified' ||
        ticket.status === 'closed',
    ).length;

    return {
      total,
      open,
      inProgress,
      resolved,
      verified,
      testingRate: total
        ? Math.round(
            (verified / total) * 100,
          )
        : 0,
      projectProgress: overallProgress,
    };
  }, [
    tickets,
    overallProgress,
  ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <AppShell>
        <div className="page-enter">

          <div className="dashboard-skeleton-hero skeleton mb-4" />

          <div className="row g-3 mb-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                className="col-12 col-md-6 col-xl-3"
                key={item}
              >
                <div
                  className="cardx"
                  style={{ height: 150 }}
                >
                  <div
                    className="skeleton mb-3"
                    style={{
                      width: 42,
                      height: 42,
                    }}
                  />

                  <div
                    className="skeleton mb-2"
                    style={{
                      width: '45%',
                      height: 25,
                    }}
                  />

                  <div
                    className="skeleton"
                    style={{
                      width: '65%',
                      height: 12,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4">
            <div className="col-xl-8">
              <div
                className="cardx skeleton"
                style={{ height: 390 }}
              />
            </div>

            <div className="col-xl-4">
              <div
                className="cardx skeleton"
                style={{ height: 390 }}
              />
            </div>
          </div>

        </div>
      </AppShell>
    );
  }

  /* =========================================================
     DEVELOPER
  ========================================================= */

  if (isDeveloper) {
    return (
      <AppShell>

        <DeveloperDashboard
          profile={profile}
          projects={visibleProjects}
          tasks={tasks}
          tickets={tickets}
          stats={developerStats}
          refreshing={refreshing}
          onRefresh={() =>
            loadDashboard(true)
          }
        />

        {error && (
          <DashboardError
            error={error}
            onRetry={() =>
              loadDashboard()
            }
          />
        )}

      </AppShell>
    );
  }

  /* =========================================================
     TESTER
  ========================================================= */

  if (isTester) {
    return (
      <AppShell>

        <TesterDashboard
          profile={profile}
          projects={visibleProjects}
          tickets={tickets}
          stats={testerStats}
          refreshing={refreshing}
          onRefresh={() =>
            loadDashboard(true)
          }
        />

        {error && (
          <DashboardError
            error={error}
            onRetry={() =>
              loadDashboard()
            }
          />
        )}

      </AppShell>
    );
  }

  /* =========================================================
     ADMIN
  ========================================================= */

  return (
    <AppShell>

      <div className="dashboard-page page-enter">

        <section className="dashboard-hero gradient-panel mb-4">

          <div className="dashboard-hero-content">

            <div className="dashboard-hero-copy">

              <div className="dashboard-eyebrow">
                <span className="gold-dot" />
                ADMIN WORKSPACE
              </div>

              <h1>
                Your workspace,
                <br />
                <span>moving forward.</span>
              </h1>

              <p>
                Monitor delivery, coordinate your team,
                track tasks and keep quality visible from
                one workspace.
              </p>

              <div className="d-flex flex-wrap gap-2 mt-4">

                <Link
                  href="/projects"
                  className="btn dashboard-hero-btn"
                >
                  <i className="bi bi-kanban me-2" />
                  View projects
                </Link>

                <Link
                  href="/tasks"
                  className="btn dashboard-hero-btn-secondary"
                >
                  <i className="bi bi-check2-square me-2" />
                  Open tasks
                </Link>

              </div>

            </div>

            <DashboardOrbit
              progress={overallProgress}
              completed={completedTasks.length}
              openTickets={openTickets.length}
              label="workspace progress"
            />

          </div>

        </section>

        {error && (
          <div className="alert dashboard-alert mb-4">
            <i className="bi bi-exclamation-circle me-2" />
            {error}

            <button
              type="button"
              className="btn btn-sm btn-dark ms-3"
              onClick={() =>
                loadDashboard()
              }
            >
              Retry
            </button>
          </div>
        )}

        {/* ADMIN KPIs */}

        <section className="row g-3 mb-4">

          <AdminStatCard
            icon="bi-grid-1x2"
            value={visibleProjects.length}
            label="Total projects"
            helper={`${activeProjects.length} currently active`}
            progress={overallProgress}
          />

          <AdminStatCard
            icon="bi-lightning-charge"
            iconClass="purple"
            value={openTasks.length}
            label="Open tasks"
            helper={`${taskCompletion}% task completion`}
            progress={taskCompletion}
          />

          <AdminStatCard
            icon="bi-bug"
            iconClass="gold"
            value={openTickets.length}
            label="Open QA tickets"
            helper={`${criticalTickets.length} critical`}
            progress={qaHealth}
          />

          <AdminStatCard
            icon="bi-check2-all"
            iconClass="green"
            value={completedProjects.length}
            label="Completed projects"
            helper={
              visibleProjects.length
                ? `${Math.round(
                    (completedProjects.length /
                      visibleProjects.length) *
                      100,
                  )}% of workspace`
                : '0% of workspace'
            }
            progress={
              visibleProjects.length
                ? (completedProjects.length /
                    visibleProjects.length) *
                  100
                : 0
            }
          />

        </section>

        <div className="row g-4">

          {/* PROJECT PERFORMANCE */}

          <div className="col-xl-8">

            <section className="cardx dashboard-section h-100">

              <DashboardSectionHeader
                kicker="DELIVERY ROADMAP"
                title="Project performance"
                description="Track progress across your active work."
                href="/projects"
                linkText="View all"
              />

              {visibleProjects.length === 0 ? (
                <DashboardEmpty
                  icon="bi-kanban"
                  title="No projects yet"
                  description="Create your first project to start tracking delivery."
                  href="/projects"
                  action="Create project"
                />
              ) : (
                <div className="dashboard-project-list">

                  {visibleProjects
                    .slice()
                    .sort(
                      (a, b) =>
                        progressValue(b.progress) -
                        progressValue(a.progress),
                    )
                    .slice(0, 6)
                    .map(
                      (project, index) => (
                        <ProjectRow
                          key={project.id}
                          project={project}
                          index={index}
                        />
                      ),
                    )}

                </div>
              )}

            </section>

          </div>

          {/* HEALTH */}

          <div className="col-xl-4">

            <section className="cardx dashboard-section h-100">

              <DashboardSectionHeader
                kicker="WORKSPACE"
                title="Health overview"
              />

              <HealthOverview
                progress={overallProgress}
                taskCompletion={taskCompletion}
                qaHealth={qaHealth}
                activeProjects={
                  activeProjects.length
                }
              />

            </section>

          </div>

          {/* TASKS */}

          <div className="col-lg-5">

            <section className="cardx dashboard-section">

              <DashboardSectionHeader
                kicker="EXECUTION"
                title="Task overview"
                description="Current workload distribution."
                href="/tasks"
              />

              <TaskOverview
                total={tasks.length}
                todo={taskDistribution.todo}
                inProgress={
                  taskDistribution.inProgress
                }
                review={
                  taskDistribution.review
                }
                done={
                  taskDistribution.done
                }
              />

            </section>

          </div>

          {/* QA */}

          <div className="col-lg-7">

            <section className="cardx dashboard-section">

              <DashboardSectionHeader
                kicker="QUALITY ASSURANCE"
                title="QA health"
                description="Visibility into current testing workload."
                href="/tickets"
                linkText="Open QA"
              />

              <QAOverview
                health={qaHealth}
                open={
                  tickets.filter(
                    (ticket) =>
                      ticket.status === 'open',
                  ).length
                }
                inProgress={
                  tickets.filter(
                    (ticket) =>
                      ticket.status === 'in-progress',
                  ).length
                }
                resolved={
                  resolvedTickets.length
                }
              />

            </section>

          </div>

          {/* ACTIVITY */}

          <div className="col-xl-7">

            <section className="cardx dashboard-section">

              <DashboardSectionHeader
                kicker="LIVE WORKSPACE"
                title="Recent activity"
                description="What's happening across your workspace."
                href="/activity"
                linkText="Full activity"
              />

              {activity.length === 0 ? (
                <DashboardEmpty
                  icon="bi-activity"
                  title="No activity yet"
                  description="Workspace activity will appear here."
                />
              ) : (
                <div className="dashboard-activity-list">

                  {activity.map(
                    (item, index) => (
                      <ActivityRow
                        key={item.id}
                        item={item}
                        index={index}
                      />
                    ),
                  )}

                </div>
              )}

            </section>

          </div>

          {/* QUICK ACTIONS */}

          <div className="col-xl-5">

            <section className="cardx dashboard-section">

              <DashboardSectionHeader
                kicker="WORKSPACE TOOLS"
                title="Quick actions"
                description="Jump directly into your workflow."
              />

              <div className="dashboard-actions">

                <DashboardAction
                  href="/projects"
                  icon="bi-plus-lg"
                  iconClass="blue"
                  title="Create project"
                  description="Start a new delivery roadmap"
                />

                <DashboardAction
                  href="/tasks"
                  icon="bi-check2-square"
                  iconClass="purple"
                  title="Manage tasks"
                  description="Review and update execution"
                />

                <DashboardAction
                  href="/tickets"
                  icon="bi-bug"
                  iconClass="gold"
                  title="QA tickets"
                  description="Review issues and testing"
                />

                <DashboardAction
                  href="/updates"
                  icon="bi-journal-text"
                  iconClass="navy"
                  title="Post update"
                  description="Keep the team aligned"
                />

              </div>

            </section>

          </div>

        </div>

        <DashboardFooter
          refreshing={refreshing}
          onRefresh={() =>
            loadDashboard(true)
          }
        />

      </div>

      <DashboardStyles />

    </AppShell>
  );
}

/* =========================================================
   ERROR
========================================================= */

function DashboardError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="dashboard-alert-wrap">
      <div className="alert dashboard-alert">
        <i className="bi bi-exclamation-circle me-2" />
        {error}

        <button
          type="button"
          className="btn btn-sm btn-dark ms-3"
          onClick={onRetry}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ORBIT
========================================================= */

function DashboardOrbit({
  progress,
  completed,
  openTickets,
  label,
}: {
  progress: number;
  completed: number;
  openTickets: number;
  label: string;
}) {
  return (
    <div className="dashboard-orbit">

      <div className="dashboard-orbit-ring ring-one" />
      <div className="dashboard-orbit-ring ring-two" />

      <div className="dashboard-orbit-core">
        <span>DELIVERY</span>

        <strong>
          {progress}%
        </strong>

        <small>
          {label}
        </small>
      </div>

      <div className="dashboard-floating-card float-card-one">

        <i className="bi bi-check2-circle" />

        <div>
          <strong>{completed}</strong>
          <span>completed</span>
        </div>

      </div>

      <div className="dashboard-floating-card float-card-two">

        <i className="bi bi-bug" />

        <div>
          <strong>{openTickets}</strong>
          <span>open QA</span>
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   ADMIN STAT
========================================================= */

function AdminStatCard({
  icon,
  iconClass = '',
  value,
  label,
  helper,
  progress,
}: {
  icon: string;
  iconClass?: string;
  value: number;
  label: string;
  helper: string;
  progress: number;
}) {
  return (
    <div className="col-12 col-md-6 col-xl-3">

      <div className="cardx dashboard-stat-card">

        <div className="dashboard-stat-top">

          <div
            className={`stat-icon ${iconClass}`}
          >
            <i className={`bi ${icon}`} />
          </div>

          <span className="dashboard-stat-label">
            Live
          </span>

        </div>

        <div className="stat mt-3">
          {value}
        </div>

        <div className="stat-label">
          {label}
        </div>

        <div className="dashboard-mini-progress mt-3">

          <span
            style={{
              width: `${Math.min(
                100,
                Math.max(0, progress),
              )}%`,
            }}
          />

        </div>

        <small className="muted">
          {helper}
        </small>

      </div>

    </div>
  );
}

/* =========================================================
   DEVELOPER
========================================================= */

function DeveloperDashboard({
  profile,
  projects,
  tasks,
  tickets,
  stats,
  refreshing,
  onRefresh,
}: {
  profile: Profile | null;
  projects: Project[];
  tasks: Task[];
  tickets: Ticket[];
  stats: {
    completed: number;
    open: number;
    review: number;
    inProgress: number;
    urgentTickets: number;
    projectProgress: number;
  };
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const recentTasks = [...tasks]
    .sort(
      (a, b) =>
        getTimestamp(b.createdAt) -
        getTimestamp(a.createdAt),
    )
    .slice(0, 6);

  const recentTickets = [...tickets]
    .sort(
      (a, b) =>
        getTimestamp(b.createdAt) -
        getTimestamp(a.createdAt),
    )
    .slice(0, 6);

  const developerQaHealth = tickets.length
    ? Math.round(
        (tickets.filter(
          (ticket) =>
            ticket.status === 'resolved' ||
            ticket.status === 'closed' ||
            ticket.status === 'verified',
        ).length /
          tickets.length) *
          100,
      )
    : 100;

  const completion = tasks.length
    ? Math.round(
        (stats.completed / tasks.length) * 100,
      )
    : 0;

  return (
    <div className="dashboard-page page-enter">

      <section className="dashboard-hero gradient-panel mb-4">

        <div className="dashboard-hero-content">

          <div className="dashboard-hero-copy">

            <div className="dashboard-eyebrow">
              <span className="gold-dot" />
              DEVELOPER WORKSPACE
            </div>

            <h1>
              Build.
              <br />
              <span>Ship. Improve.</span>
            </h1>

            <p>
              Welcome back, {profile?.name}.
              Track your projects, tasks and QA work
              from one focused engineering workspace.
            </p>

            <div className="d-flex flex-wrap gap-2 mt-4">

              <Link
                href="/projects"
                className="btn dashboard-hero-btn"
              >
                <i className="bi bi-kanban me-2" />
                My projects
              </Link>

              <Link
                href="/tasks"
                className="btn dashboard-hero-btn-secondary"
              >
                <i className="bi bi-check2-square me-2" />
                My tasks
              </Link>

            </div>

          </div>

          <DashboardOrbit
            progress={stats.projectProgress}
            completed={stats.completed}
            openTickets={
              tickets.filter(
                (ticket) =>
                  ticket.status !== 'closed' &&
                  ticket.status !== 'verified',
              ).length
            }
            label="my projects"
          />

        </div>

      </section>

      <section className="row g-3 mb-4">

        <DeveloperStat
          icon="bi-kanban"
          value={projects.length}
          label="My projects"
          helper={`${stats.projectProgress}% average progress`}
          progress={stats.projectProgress}
        />

        <DeveloperStat
          icon="bi-lightning-charge"
          iconClass="purple"
          value={stats.open}
          label="Open tasks"
          helper={`${stats.completed} completed`}
          progress={completion}
        />

        <DeveloperStat
          icon="bi-arrow-repeat"
          iconClass="gold"
          value={stats.inProgress}
          label="In progress"
          helper={`${stats.review} awaiting review`}
          progress={
            tasks.length
              ? (stats.inProgress /
                  tasks.length) *
                100
              : 0
          }
        />

        <DeveloperStat
          icon="bi-bug"
          iconClass="green"
          value={tickets.length}
          label="QA tickets"
          helper={`${stats.urgentTickets} critical`}
          progress={developerQaHealth}
        />

      </section>

      <div className="row g-4">

        <div className="col-xl-8">

          <section className="cardx dashboard-section">

            <DashboardSectionHeader
              kicker="MY DELIVERY"
              title="My projects"
              description="Projects you own and are responsible for."
              href="/projects"
              linkText="View all"
            />

            {projects.length === 0 ? (
              <DashboardEmpty
                icon="bi-kanban"
                title="No projects assigned yet"
                description="Your project work will appear here."
              />
            ) : (
              <div className="dashboard-project-list">

                {projects
                  .slice()
                  .sort(
                    (a, b) =>
                      progressValue(b.progress) -
                      progressValue(a.progress),
                  )
                  .slice(0, 6)
                  .map(
                    (project, index) => (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        index={index}
                      />
                    ),
                  )}

              </div>
            )}

          </section>

        </div>

        <div className="col-xl-4">

          <section className="cardx dashboard-section">

            <DashboardSectionHeader
              kicker="MY DELIVERY"
              title="Delivery health"
            />

            <HealthOverview
              progress={stats.projectProgress}
              taskCompletion={completion}
              qaHealth={developerQaHealth}
              activeProjects={
                projects.filter(
                  (project) =>
                    project.status === 'active',
                ).length
              }
            />

          </section>

        </div>

        <div className="col-xl-7">

          <section className="cardx dashboard-section">

            <DashboardSectionHeader
              kicker="MY WORK"
              title="Recent tasks"
              description="Your latest assigned engineering work."
              href="/tasks"
              linkText="Open tasks"
            />

            {recentTasks.length === 0 ? (
              <DashboardEmpty
                icon="bi-check2-square"
                title="No tasks assigned"
                description="Tasks assigned to you will appear here."
              />
            ) : (
              <div className="dashboard-personal-list">

                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="dashboard-personal-row"
                  >

                    <div className="dashboard-personal-icon purple">
                      <i className="bi bi-check2-square" />
                    </div>

                    <div className="dashboard-personal-main">

                      <strong>
                        {task.title}
                      </strong>

                      <span>
                        {task.projectName ||
                          'Project'}
                        {' · '}
                        {taskStatusLabel(
                          task.status,
                        )}
                      </span>

                    </div>

                    <span className="dashboard-personal-status">
                      {task.priority}
                    </span>

                  </div>
                ))}

              </div>
            )}

          </section>

        </div>

        <div className="col-xl-5">

          <section className="cardx dashboard-section">

            <DashboardSectionHeader
              kicker="QUALITY"
              title="QA assigned to me"
              description="Issues currently connected to your development work."
              href="/tickets"
              linkText="Open QA"
            />

            {recentTickets.length === 0 ? (
              <DashboardEmpty
                icon="bi-bug"
                title="No QA tickets"
                description="Tickets assigned to you will appear here."
              />
            ) : (
              <div className="dashboard-personal-list">

                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="dashboard-personal-row"
                  >

                    <div className="dashboard-personal-icon gold">
                      <i className="bi bi-bug" />
                    </div>

                    <div className="dashboard-personal-main">

                      <strong>
                        {ticket.title}
                      </strong>

                      <span>
                        {ticket.projectName ||
                          'Project'}
                        {' · '}
                        {ticketStatusLabel(
                          ticket.status,
                        )}
                      </span>

                    </div>

                    <span className="dashboard-personal-status">
                      {ticket.priority}
                    </span>

                  </div>
                ))}

              </div>
            )}

          </section>

        </div>

      </div>

      <DashboardFooter
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <DeveloperTesterStyles />

    </div>
  );
}

/* =========================================================
   TESTER
========================================================= */

function TesterDashboard({
  profile,
  projects,
  tickets,
  stats,
  refreshing,
  onRefresh,
}: {
  profile: Profile | null;
  projects: Project[];
  tickets: Ticket[];
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    verified: number;
    testingRate: number;
    projectProgress: number;
  };
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const recentTickets = [...tickets]
    .sort(
      (a, b) =>
        getTimestamp(b.createdAt) -
        getTimestamp(a.createdAt),
    )
    .slice(0, 6);

  return (
    <div className="dashboard-page page-enter">

      <section className="dashboard-hero gradient-panel mb-4">

        <div className="dashboard-hero-content">

          <div className="dashboard-hero-copy">

            <div className="dashboard-eyebrow">
              <span className="gold-dot" />
              TESTING WORKSPACE
            </div>

            <h1>
              Test.
              <br />
              <span>Verify. Deliver.</span>
            </h1>

            <p>
              Welcome back, {profile?.name}.
              Track the issues you've raised,
              testing progress and projects connected
              to your QA work.
            </p>

            <div className="d-flex flex-wrap gap-2 mt-4">

              <Link
                href="/tickets"
                className="btn dashboard-hero-btn"
              >
                <i className="bi bi-bug me-2" />
                My QA tickets
              </Link>

              <Link
                href="/projects"
                className="btn dashboard-hero-btn-secondary"
              >
                <i className="bi bi-kanban me-2" />
                My projects
              </Link>

            </div>

          </div>

          <DashboardOrbit
            progress={stats.testingRate}
            completed={stats.verified}
            openTickets={stats.open}
            label="testing rate"
          />

        </div>

      </section>

      <section className="row g-3 mb-4">

        <TesterStat
          icon="bi-kanban"
          value={projects.length}
          label="Projects involved"
          helper={`${stats.projectProgress}% average progress`}
          progress={stats.projectProgress}
        />

        <TesterStat
          icon="bi-bug"
          iconClass="gold"
          value={stats.total}
          label="Tickets raised"
          helper={`${stats.open} currently open`}
          progress={
            stats.total
              ? ((stats.total - stats.open) /
                  stats.total) *
                100
              : 0
          }
        />

        <TesterStat
          icon="bi-arrow-repeat"
          iconClass="purple"
          value={stats.inProgress}
          label="Testing in progress"
          helper={`${stats.resolved} resolved`}
          progress={
            stats.total
              ? (stats.inProgress /
                  stats.total) *
                100
              : 0
          }
        />

        <TesterStat
          icon="bi-patch-check"
          iconClass="green"
          value={stats.testingRate}
          label="Testing rate"
          helper={`${stats.verified} verified or closed`}
          progress={stats.testingRate}
          percentage
        />

      </section>

      <div className="row g-4">

        <div className="col-xl-7">

          <section className="cardx dashboard-section">

            <DashboardSectionHeader
              kicker="PROJECT INVOLVEMENT"
              title="Projects I'm testing"
              description="Projects connected to your QA tickets."
              href="/projects"
              linkText="View all"
            />

            {projects.length === 0 ? (
              <DashboardEmpty
                icon="bi-kanban"
                title="No projects yet"
                description="Projects connected to your testing activity will appear here."
              />
            ) : (
              <div className="dashboard-project-list">

                {projects
                  .slice(0, 6)
                  .map(
                    (project, index) => (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        index={index}
                      />
                    ),
                  )}

              </div>
            )}

          </section>

        </div>

        <div className="col-xl-5">

          <section className="cardx dashboard-section">

            <DashboardSectionHeader
              kicker="QA PERFORMANCE"
              title="Testing performance"
              description="Your current QA workload and verification progress."
            />

            <div className="tester-rate-panel">

              <div
                className="tester-rate-ring"
                style={{
                  background:
                    `conic-gradient(
                      #7657e8 ${stats.testingRate * 3.6}deg,
                      rgba(118,87,232,.08) ${stats.testingRate * 3.6}deg
                    )`,
                }}
              >

                <div>

                  <strong>
                    {stats.testingRate}%
                  </strong>

                  <span>
                    testing rate
                  </span>

                </div>

              </div>

              <div className="tester-rate-details">

                <div>
                  <span>
                    <i className="bi bi-exclamation-circle" />
                    Open
                  </span>

                  <strong>
                    {stats.open}
                  </strong>
                </div>

                <div>
                  <span>
                    <i className="bi bi-arrow-repeat" />
                    In progress
                  </span>

                  <strong>
                    {stats.inProgress}
                  </strong>
                </div>

                <div>
                  <span>
                    <i className="bi bi-check2-circle" />
                    Resolved
                  </span>

                  <strong>
                    {stats.resolved}
                  </strong>
                </div>

                <div>
                  <span>
                    <i className="bi bi-patch-check" />
                    Verified
                  </span>

                  <strong>
                    {stats.verified}
                  </strong>
                </div>

              </div>

            </div>

          </section>

        </div>

        <div className="col-xl-8">

          <section className="cardx dashboard-section">

            <DashboardSectionHeader
              kicker="MY QA ACTIVITY"
              title="Tickets I've raised"
              description="Your latest reported issues and their current state."
              href="/tickets"
              linkText="View all"
            />

            {recentTickets.length === 0 ? (
              <DashboardEmpty
                icon="bi-bug"
                title="No tickets raised"
                description="QA tickets you raise will appear here."
              />
            ) : (
              <div className="dashboard-personal-list">

                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="dashboard-personal-row"
                  >

                    <div className="dashboard-personal-icon gold">
                      <i className="bi bi-bug" />
                    </div>

                    <div className="dashboard-personal-main">

                      <strong>
                        {ticket.title}
                      </strong>

                      <span>
                        {ticket.projectName ||
                          'Project'}
                        {' · '}
                        {ticketStatusLabel(
                          ticket.status,
                        )}
                      </span>

                    </div>

                    <span
                      className={`dashboard-ticket-status status-${ticket.status}`}
                    >
                      {ticketStatusLabel(
                        ticket.status,
                      )}
                    </span>

                  </div>
                ))}

              </div>
            )}

          </section>

        </div>

        <div className="col-xl-4">

          <section className="cardx dashboard-section">

            <DashboardSectionHeader
              kicker="QUALITY"
              title="Testing summary"
            />

            <div className="tester-summary">

              <div className="tester-summary-row">
                <span>Tickets raised</span>
                <strong>{stats.total}</strong>
              </div>

              <div className="tester-summary-row">
                <span>Currently open</span>
                <strong>{stats.open}</strong>
              </div>

              <div className="tester-summary-row">
                <span>In progress</span>
                <strong>{stats.inProgress}</strong>
              </div>

              <div className="tester-summary-row">
                <span>Resolved</span>
                <strong>{stats.resolved}</strong>
              </div>

              <div className="tester-summary-row">
                <span>Verified</span>
                <strong>{stats.verified}</strong>
              </div>

            </div>

            <Link
              href="/tickets"
              className="dashboard-testing-action"
            >
              Raise or manage QA ticket
              <i className="bi bi-arrow-up-right" />
            </Link>

          </section>

        </div>

      </div>

      <DashboardFooter
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <DeveloperTesterStyles />

    </div>
  );
}

/* =========================================================
   DEVELOPER STAT
========================================================= */

function DeveloperStat({
  icon,
  iconClass = '',
  value,
  label,
  helper,
  progress,
}: {
  icon: string;
  iconClass?: string;
  value: number;
  label: string;
  helper: string;
  progress: number;
}) {
  return (
    <div className="col-12 col-md-6 col-xl-3">

      <div className="cardx dashboard-stat-card">

        <div className="dashboard-stat-top">

          <div
            className={`stat-icon ${iconClass}`}
          >
            <i className={`bi ${icon}`} />
          </div>

          <span className="dashboard-stat-label">
            My work
          </span>

        </div>

        <div className="stat mt-3">
          {value}
        </div>

        <div className="stat-label">
          {label}
        </div>

        <div className="dashboard-mini-progress mt-3">

          <span
            style={{
              width: `${Math.min(
                100,
                Math.max(0, progress),
              )}%`,
            }}
          />

        </div>

        <small className="muted">
          {helper}
        </small>

      </div>

    </div>
  );
}

/* =========================================================
   TESTER STAT
========================================================= */

function TesterStat({
  icon,
  iconClass = '',
  value,
  label,
  helper,
  progress,
  percentage = false,
}: {
  icon: string;
  iconClass?: string;
  value: number;
  label: string;
  helper: string;
  progress: number;
  percentage?: boolean;
}) {
  return (
    <div className="col-12 col-md-6 col-xl-3">

      <div className="cardx dashboard-stat-card">

        <div className="dashboard-stat-top">

          <div
            className={`stat-icon ${iconClass}`}
          >
            <i className={`bi ${icon}`} />
          </div>

          <span className="dashboard-stat-label">
            QA
          </span>

        </div>

        <div className="stat mt-3">

          {value}

          {percentage && (
            <span
              style={{
                fontSize: 17,
                marginLeft: 2,
              }}
            >
              %
            </span>
          )}

        </div>

        <div className="stat-label">
          {label}
        </div>

        <div className="dashboard-mini-progress mt-3">

          <span
            style={{
              width: `${Math.min(
                100,
                Math.max(0, progress),
              )}%`,
            }}
          />

        </div>

        <small className="muted">
          {helper}
        </small>

      </div>

    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function DashboardSectionHeader({
  kicker,
  title,
  description,
  href,
  linkText = 'View all',
}: {
  kicker: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="dashboard-section-header">

      <div>

        <div className="dashboard-section-kicker">
          {kicker}
        </div>

        <h3 className="mb-1">
          {title}
        </h3>

        {description && (
          <p className="muted mb-0">
            {description}
          </p>
        )}

      </div>

      {href && (
        <Link
          href={href}
          className="dashboard-view-link"
        >
          {linkText}
          <i className="bi bi-arrow-up-right ms-1" />
        </Link>
      )}

    </div>
  );
}

/* =========================================================
   PROJECT ROW
========================================================= */

function ProjectRow({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const progress = progressValue(
    project.progress,
  );

  return (
    <Link
      href={`/projects/${project.id}`}
      className="dashboard-project-row"
      style={{
        animationDelay:
          `${index * 70}ms`,
      }}
    >

      <div className="dashboard-project-number">
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="dashboard-project-main">

        <div className="dashboard-project-heading">

          <div>
            <strong>
              {project.name}
            </strong>

            <span>
              {project.type}

              {project.client
                ? ` · ${project.client}`
                : ''}
            </span>
          </div>

          <span
            className={`badge-soft text-capitalize dashboard-project-status status-${project.status}`}
          >
            {statusLabel(project.status)}
          </span>

        </div>

        <div className="dashboard-project-progress">

          <div className="progress">

            <div
              className="progress-bar"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <strong>
            {Math.round(progress)}%
          </strong>

        </div>

      </div>

      <i className="bi bi-chevron-right dashboard-project-arrow" />

    </Link>
  );
}

/* =========================================================
   HEALTH
========================================================= */

function HealthOverview({
  progress,
  taskCompletion,
  qaHealth,
  activeProjects,
}: {
  progress: number;
  taskCompletion: number;
  qaHealth: number;
  activeProjects: number;
}) {
  const degrees = progress * 3.6;

  return (
    <>
      <div className="dashboard-health">

        <div
          className="dashboard-health-ring"
          style={{
            background:
              `conic-gradient(
                #7657e8 ${degrees}deg,
                rgba(118,87,232,.08) ${degrees}deg
              )`,
          }}
        >

          <div>
            <strong>{progress}%</strong>
            <span>overall</span>
          </div>

        </div>

        <div className="dashboard-health-copy">

          <strong>
            Delivery health
          </strong>

          <p>
            Your workspace is currently averaging{' '}
            <b>{progress}%</b> progress across
            visible projects.
          </p>

          <Link
            href="/activity"
            className="dashboard-text-link"
          >
            Inspect activity
            <i className="bi bi-arrow-right ms-1" />
          </Link>

        </div>

      </div>

      <div className="dashboard-health-stats">

        <div>
          <span>
            <i className="bi bi-check2-circle" />
            Tasks done
          </span>

          <strong>
            {taskCompletion}%
          </strong>
        </div>

        <div>
          <span>
            <i className="bi bi-shield-check" />
            QA health
          </span>

          <strong>
            {qaHealth}%
          </strong>
        </div>

        <div>
          <span>
            <i className="bi bi-lightning" />
            Active projects
          </span>

          <strong>
            {activeProjects}
          </strong>
        </div>

      </div>
    </>
  );
}

/* =========================================================
   TASK OVERVIEW
========================================================= */

function TaskOverview({
  total,
  todo,
  inProgress,
  review,
  done,
}: {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}) {
  return (
    <div className="dashboard-task-chart">

      <div className="dashboard-task-donut">

        <div>
          <strong>{total}</strong>
          <span>total</span>
        </div>

      </div>

      <div className="dashboard-task-legend">

        <TaskLegend
          label="To do"
          value={todo}
          className="todo"
        />

        <TaskLegend
          label="In progress"
          value={inProgress}
          className="progress"
        />

        <TaskLegend
          label="Review"
          value={review}
          className="review"
        />

        <TaskLegend
          label="Done"
          value={done}
          className="done"
        />

      </div>

    </div>
  );
}

function TaskLegend({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div>

      <span>
        <i
          className={`legend-dot ${className}`}
        />
        {label}
      </span>

      <strong>{value}</strong>

    </div>
  );
}

/* =========================================================
   QA
========================================================= */

function QAOverview({
  health,
  open,
  inProgress,
  resolved,
}: {
  health: number;
  open: number;
  inProgress: number;
  resolved: number;
}) {
  return (
    <div className="dashboard-qa-grid">

      <div className="dashboard-qa-main">

        <div className="dashboard-qa-number">
          {health}
          <span>%</span>
        </div>

        <div className="progress mt-2">

          <div
            className="progress-bar"
            style={{
              width: `${health}%`,
            }}
          />

        </div>

        <small className="muted">
          Resolved, closed or verified tickets
        </small>

      </div>

      <div className="dashboard-qa-items">

        <div>
          <span>
            <i className="bi bi-exclamation-circle" />
            Open
          </span>

          <strong>{open}</strong>
        </div>

        <div>
          <span>
            <i className="bi bi-arrow-repeat" />
            In progress
          </span>

          <strong>{inProgress}</strong>
        </div>

        <div>
          <span>
            <i className="bi bi-check2" />
            Resolved
          </span>

          <strong>{resolved}</strong>
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   ACTIVITY
========================================================= */

function ActivityRow({
  item,
  index,
}: {
  item: ActivityItem;
  index: number;
}) {
  const icon =
    item.type === 'project'
      ? 'bi-kanban'
      : item.type === 'task'
        ? 'bi-check2-square'
        : item.type === 'ticket'
          ? 'bi-bug'
          : 'bi-journal-text';

  return (
    <div
      className="dashboard-activity-item"
      style={{
        animationDelay:
          `${index * 60}ms`,
      }}
    >

      <div
        className={`dashboard-activity-icon ${item.type}`}
      >
        <i className={`bi ${icon}`} />
      </div>

      <div className="dashboard-activity-body">

        <div className="dashboard-activity-title">

          <strong>
            {item.title}
          </strong>

          <span>
            {formatDate(item.createdAt)}
          </span>

        </div>

        <p>
          {item.description}
        </p>

        <div className="dashboard-activity-meta">

          {item.projectName && (
            <span>
              <i className="bi bi-folder2" />
              {item.projectName}
            </span>
          )}

          {item.person && (
            <span>
              <i className="bi bi-person" />
              {item.person}
            </span>
          )}

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function DashboardAction({
  href,
  icon,
  iconClass,
  title,
  description,
}: {
  href: string;
  icon: string;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="dashboard-action"
    >

      <div
        className={`dashboard-action-icon ${iconClass}`}
      >
        <i className={`bi ${icon}`} />
      </div>

      <div>

        <strong>{title}</strong>

        <span>{description}</span>

      </div>

      <i className="bi bi-arrow-up-right" />

    </Link>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function DashboardEmpty({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="dashboard-empty">

      <div className="empty-state-icon">
        <i className={`bi ${icon}`} />
      </div>

      <strong>{title}</strong>

      <p className="muted mb-3">
        {description}
      </p>

      {href && action && (
        <Link
          href={href}
          className="btn btn-dark btn-sm"
        >
          {action}
        </Link>
      )}

    </div>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function DashboardFooter({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="dashboard-footer mt-4">

      <span>
        Workspace synced from Firebase
      </span>

      <button
        type="button"
        className="dashboard-refresh"
        onClick={onRefresh}
        disabled={refreshing}
      >

        <i
          className={`bi ${
            refreshing
              ? 'bi-arrow-repeat spin'
              : 'bi-arrow-clockwise'
          }`}
        />

        {refreshing
          ? 'Refreshing...'
          : 'Refresh'}

      </button>

    </div>
  );
}

/* =========================================================
   DEVELOPER / TESTER STYLES
========================================================= */

function DeveloperTesterStyles() {
  return (
    <style jsx>{`
      .dashboard-personal-list {
        display: flex;
        flex-direction: column;
      }

      .dashboard-personal-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 4px;
        border-bottom: 1px solid var(--line);
      }

      .dashboard-personal-row:last-child {
        border-bottom: 0;
      }

      .dashboard-personal-icon {
        width: 36px;
        min-width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        font-size: 11px;
      }

      .dashboard-personal-icon.purple {
        color: #7657e8;
        background: rgba(118, 87, 232, .09);
      }

      .dashboard-personal-icon.gold {
        color: #ad7c24;
        background: rgba(212, 175, 90, .12);
      }

      .dashboard-personal-main {
        flex: 1;
        min-width: 0;
      }

      .dashboard-personal-main strong {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text);
        font-size: 10px;
      }

      .dashboard-personal-main span {
        display: block;
        margin-top: 3px;
        color: var(--muted);
        font-size: 8px;
      }

      .dashboard-personal-status {
        flex-shrink: 0;
        color: var(--muted);
        font-size: 8px;
        text-transform: capitalize;
      }

      .dashboard-ticket-status {
        flex-shrink: 0;
        padding: 5px 8px;
        border-radius: 7px;
        font-size: 8px;
        font-weight: 700;
        text-transform: capitalize;
        background: rgba(118, 87, 232, .07);
        color: #7657e8;
      }

      .dashboard-ticket-status.status-open {
        color: #b45309;
        background: rgba(245, 158, 11, .09);
      }

      .dashboard-ticket-status.status-in-progress {
        color: #3155d9;
        background: rgba(49, 85, 217, .08);
      }

      .dashboard-ticket-status.status-resolved,
      .dashboard-ticket-status.status-closed,
      .dashboard-ticket-status.status-verified {
        color: #16834c;
        background: rgba(22, 131, 76, .08);
      }

      .tester-rate-panel {
        display: flex;
        align-items: center;
        gap: 28px;
      }

      .tester-rate-ring {
        width: 145px;
        min-width: 145px;
        height: 145px;
        display: grid;
        place-items: center;
        border-radius: 50%;
      }

      .tester-rate-ring > div {
        width: 116px;
        height: 116px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--surface);
      }

      .tester-rate-ring strong {
        color: var(--text);
        font-family: 'Manrope', sans-serif;
        font-size: 27px;
        line-height: 1;
      }

      .tester-rate-ring span {
        margin-top: 5px;
        color: var(--muted);
        font-size: 8px;
        text-transform: uppercase;
      }

      .tester-rate-details {
        flex: 1;
      }

      .tester-rate-details > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px 0;
        border-bottom: 1px solid var(--line);
      }

      .tester-rate-details > div:last-child {
        border-bottom: 0;
      }

      .tester-rate-details span {
        color: var(--muted);
        font-size: 9px;
      }

      .tester-rate-details span i {
        margin-right: 5px;
        color: #7657e8;
      }

      .tester-rate-details strong {
        color: var(--text);
        font-size: 11px;
      }

      .tester-summary {
        display: flex;
        flex-direction: column;
      }

      .tester-summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid var(--line);
      }

      .tester-summary-row:last-child {
        border-bottom: 0;
      }

      .tester-summary-row span {
        color: var(--muted);
        font-size: 9px;
      }

      .tester-summary-row strong {
        color: var(--text);
        font-family: 'Manrope', sans-serif;
        font-size: 13px;
      }

      .dashboard-testing-action {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 18px;
        padding: 11px 12px;
        border-radius: 11px;
        color: #3155d9;
        background: rgba(49, 85, 217, .05);
        text-decoration: none;
        font-size: 9px;
        font-weight: 700;
        transition:
          transform .18s ease,
          background .18s ease;
      }

      .dashboard-testing-action:hover {
        color: #3155d9;
        background: rgba(49, 85, 217, .08);
        transform: translateY(-1px);
      }

      .dashboard-alert-wrap {
        padding: 0 24px 24px;
      }

      @media (max-width: 767.98px) {
        .tester-rate-panel {
          flex-direction: column;
          align-items: center;
        }

        .tester-rate-details {
          width: 100%;
        }
      }
    `}</style>
  );
}

/* =========================================================
   ADMIN STYLES
========================================================= */

function DashboardStyles() {
  return (
    <style jsx>{`
      .dashboard-page {
        width: 100%;
      }

      .dashboard-hero {
        min-height: 340px;
        padding: 42px 46px;
      }

      .dashboard-hero-content {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 255px;
      }

      .dashboard-hero-copy {
        max-width: 650px;
      }

      .dashboard-eyebrow {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 17px;
        color: rgba(255,255,255,.64);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .14em;
      }

      .dashboard-hero h1 {
        margin: 0;
        color: #fff;
        font-size: clamp(2.1rem, 4vw, 3.45rem);
        line-height: 1.04;
        letter-spacing: -.055em;
      }

      .dashboard-hero h1 span {
        color: #d8d2ff;
      }

      .dashboard-hero p {
        max-width: 570px;
        margin: 18px 0 0;
        color: rgba(255,255,255,.67);
        font-size: 14px;
        line-height: 1.7;
      }

      .dashboard-hero-btn {
        color: #172554 !important;
        background: #fff !important;
        border: 0 !important;
        padding: 10px 15px;
        box-shadow: 0 10px 25px rgba(0,0,0,.13);
      }

      .dashboard-hero-btn-secondary {
        color: rgba(255,255,255,.90) !important;
        background: rgba(255,255,255,.08) !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      .dashboard-orbit {
        position: relative;
        width: 245px;
        height: 245px;
        flex-shrink: 0;
        margin-right: 25px;
      }

      .dashboard-orbit-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 50%;
        transform: translate(-50%, -50%);
      }

      .ring-one {
        width: 195px;
        height: 195px;
        animation: orbit-spin 18s linear infinite;
      }

      .ring-two {
        width: 140px;
        height: 140px;
        border-color: rgba(212,175,90,.18);
        animation: orbit-spin-reverse 13s linear infinite;
      }

      .dashboard-orbit-core {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 112px;
        height: 112px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transform: translate(-50%,-50%);
        border-radius: 50%;
        background:
          radial-gradient(
            circle at 35% 25%,
            rgba(255,255,255,.17),
            transparent 40%
          ),
          rgba(255,255,255,.075);
        border: 1px solid rgba(255,255,255,.14);
        box-shadow:
          0 20px 45px rgba(0,0,0,.15),
          inset 0 1px 0 rgba(255,255,255,.12);
        backdrop-filter: blur(16px);
      }

      .dashboard-orbit-core span {
        color: rgba(255,255,255,.48);
        font-size: 8px;
        font-weight: 700;
        letter-spacing: .1em;
      }

      .dashboard-orbit-core strong {
        margin: 1px 0;
        color: #fff;
        font-family: 'Manrope', sans-serif;
        font-size: 27px;
        line-height: 1;
      }

      .dashboard-orbit-core small {
        color: rgba(255,255,255,.43);
        font-size: 7px;
      }

      .dashboard-floating-card {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 12px;
        color: #fff;
        background: rgba(255,255,255,.075);
        box-shadow: 0 12px 30px rgba(0,0,0,.14);
        backdrop-filter: blur(16px);
        animation: float-card 4s ease-in-out infinite;
      }

      .dashboard-floating-card i {
        color: #d4af5a;
      }

      .dashboard-floating-card strong {
        display: block;
        font-family: 'Manrope', sans-serif;
        font-size: 13px;
        line-height: 1;
      }

      .dashboard-floating-card span {
        display: block;
        margin-top: 2px;
        color: rgba(255,255,255,.43);
        font-size: 7px;
        text-transform: uppercase;
      }

      .float-card-one {
        left: -3px;
        top: 28px;
      }

      .float-card-two {
        right: -8px;
        bottom: 28px;
        animation-delay: -2s;
      }

      .dashboard-stat-card {
        min-height: 165px;
        padding: 19px;
      }

      .dashboard-stat-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .dashboard-stat-label {
        color: var(--muted);
        font-size: 9px;
        font-weight: 600;
      }

      .dashboard-mini-progress {
        height: 4px;
        overflow: hidden;
        margin-bottom: 6px;
        background: rgba(49,85,217,.07);
        border-radius: 99px;
      }

      .dashboard-mini-progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(
          90deg,
          #3155d9,
          #7657e8
        );
        transition: width 700ms ease;
      }

      .dashboard-section {
        min-height: 100%;
      }

      .dashboard-section-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 23px;
      }

      .dashboard-section-kicker {
        margin-bottom: 5px;
        color: #7657e8;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: .12em;
      }

      .dashboard-section h3 {
        font-size: 17px;
        letter-spacing: -.035em;
      }

      .dashboard-view-link,
      .dashboard-text-link {
        color: #3155d9;
        font-size: 10px;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
      }

      .dashboard-project-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .dashboard-project-row {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 13px 10px;
        border-radius: 13px;
        color: inherit;
        text-decoration: none;
        opacity: 0;
        animation: dashboard-row-in 500ms ease forwards;
        transition:
          background 180ms ease,
          transform 180ms ease;
      }

      .dashboard-project-row:hover {
        color: inherit;
        background:
          linear-gradient(
            135deg,
            rgba(49,85,217,.035),
            rgba(118,87,232,.045)
          );
        transform: translateX(3px);
      }

      .dashboard-project-number {
        width: 30px;
        color: #a2a9b7;
        font-family: 'Manrope', sans-serif;
        font-size: 10px;
        font-weight: 700;
      }

      .dashboard-project-main {
        flex: 1;
        min-width: 0;
      }

      .dashboard-project-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 9px;
      }

      .dashboard-project-heading strong {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text);
        font-size: 12px;
      }

      .dashboard-project-heading span:not(.badge-soft) {
        display: block;
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--muted);
        font-size: 9px;
      }

      .dashboard-project-status {
        flex-shrink: 0;
      }

      .dashboard-project-progress {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dashboard-project-progress .progress {
        flex: 1;
      }

      .dashboard-project-progress strong {
        width: 33px;
        color: var(--text-secondary);
        font-size: 10px;
        text-align: right;
      }

      .dashboard-project-arrow {
        color: #a3aaba;
        font-size: 10px;
      }

      .dashboard-health {
        display: flex;
        align-items: center;
        gap: 23px;
        padding: 10px 0 25px;
      }

      .dashboard-health-ring {
        width: 125px;
        min-width: 125px;
        height: 125px;
        display: grid;
        place-items: center;
        border-radius: 50%;
      }

      .dashboard-health-ring > div {
        width: 103px;
        height: 103px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--surface);
      }

      .dashboard-health-ring strong {
        color: var(--text);
        font-family: 'Manrope', sans-serif;
        font-size: 24px;
        line-height: 1;
      }

      .dashboard-health-ring span {
        margin-top: 3px;
        color: var(--muted);
        font-size: 8px;
        text-transform: uppercase;
      }

      .dashboard-health-copy strong {
        color: var(--text);
        font-size: 12px;
      }

      .dashboard-health-copy p {
        margin: 5px 0 9px;
        color: var(--muted);
        font-size: 10px;
        line-height: 1.6;
      }

      .dashboard-health-stats {
        display: grid;
        grid-template-columns: repeat(3,1fr);
        border-top: 1px solid var(--line);
        padding-top: 17px;
      }

      .dashboard-health-stats > div {
        padding: 0 12px;
        border-right: 1px solid var(--line);
      }

      .dashboard-health-stats > div:first-child {
        padding-left: 0;
      }

      .dashboard-health-stats > div:last-child {
        padding-right: 0;
        border-right: 0;
      }

      .dashboard-health-stats span {
        display: block;
        color: var(--muted);
        font-size: 8px;
      }

      .dashboard-health-stats span i {
        margin-right: 4px;
      }

      .dashboard-health-stats strong {
        display: block;
        margin-top: 4px;
        color: var(--text);
        font-family: 'Manrope', sans-serif;
        font-size: 15px;
      }

      .dashboard-task-chart {
        display: flex;
        align-items: center;
        gap: 32px;
      }

      .dashboard-task-donut {
        width: 145px;
        min-width: 145px;
        height: 145px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background:
          conic-gradient(
            #3155d9 0deg,
            #7657e8 150deg,
            #d4af5a 240deg,
            #dfe4ef 240deg
          );
      }

      .dashboard-task-donut > div {
        width: 112px;
        height: 112px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--surface);
      }

      .dashboard-task-donut strong {
        color: var(--text);
        font-family: 'Manrope', sans-serif;
        font-size: 27px;
        line-height: 1;
      }

      .dashboard-task-donut span {
        margin-top: 4px;
        color: var(--muted);
        font-size: 9px;
      }

      .dashboard-task-legend {
        flex: 1;
      }

      .dashboard-task-legend > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px 0;
        border-bottom: 1px solid var(--line);
      }

      .dashboard-task-legend > div:last-child {
        border-bottom: 0;
      }

      .dashboard-task-legend span {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--text-secondary);
        font-size: 10px;
      }

      .dashboard-task-legend strong {
        color: var(--text);
        font-size: 11px;
      }

      .legend-dot {
        width: 7px;
        height: 7px;
        display: inline-block;
        border-radius: 50%;
      }

      .legend-dot.todo {
        background: #b7bfce;
      }

      .legend-dot.progress {
        background: #3155d9;
      }

      .legend-dot.review {
        background: #d4af5a;
      }

      .legend-dot.done {
        background: #7657e8;
      }

      .dashboard-qa-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 35px;
      }

      .dashboard-qa-number {
        color: var(--text);
        font-family: 'Manrope', sans-serif;
        font-size: 39px;
        font-weight: 800;
        letter-spacing: -.06em;
      }

      .dashboard-qa-number span {
        margin-left: 2px;
        color: #7657e8;
        font-size: 17px;
      }

      .dashboard-qa-main small {
        display: block;
        margin-top: 7px;
        font-size: 8px;
      }

      .dashboard-qa-items > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--line);
      }

      .dashboard-qa-items > div:last-child {
        border-bottom: 0;
      }

      .dashboard-qa-items span {
        color: var(--text-secondary);
        font-size: 10px;
      }

      .dashboard-qa-items span i {
        margin-right: 6px;
        color: #7657e8;
      }

      .dashboard-qa-items strong {
        color: var(--text);
        font-size: 12px;
      }

      .dashboard-activity-list {
        display: flex;
        flex-direction: column;
      }

      .dashboard-activity-item {
        display: flex;
        gap: 13px;
        padding: 12px 0;
        border-bottom: 1px solid var(--line);
        opacity: 0;
        animation: dashboard-row-in 450ms ease forwards;
      }

      .dashboard-activity-item:last-child {
        border-bottom: 0;
      }

      .dashboard-activity-icon {
        width: 34px;
        min-width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        font-size: 11px;
      }

      .dashboard-activity-icon.project {
        color: #3155d9;
        background: rgba(49,85,217,.08);
      }

      .dashboard-activity-icon.task {
        color: #7657e8;
        background: rgba(118,87,232,.09);
      }

      .dashboard-activity-icon.ticket {
        color: #b88a2e;
        background: rgba(212,175,90,.11);
      }

      .dashboard-activity-icon.update {
        color: #172554;
        background: rgba(23,37,84,.07);
      }

      .dashboard-activity-body {
        flex: 1;
        min-width: 0;
      }

      .dashboard-activity-title {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 15px;
      }

      .dashboard-activity-title strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text);
        font-size: 10px;
      }

      .dashboard-activity-title span {
        flex-shrink: 0;
        color: var(--muted);
        font-size: 8px;
      }

      .dashboard-activity-body p {
        margin: 3px 0 5px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        color: var(--muted);
        font-size: 9px;
      }

      .dashboard-activity-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .dashboard-activity-meta span {
        color: #8992a4;
        font-size: 8px;
      }

      .dashboard-activity-meta i {
        margin-right: 4px;
      }

      .dashboard-actions {
        display: flex;
        flex-direction: column;
        gap: 7px;
      }

      .dashboard-action {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        border: 1px solid transparent;
        border-radius: 13px;
        color: inherit;
        text-decoration: none;
        transition:
          background 180ms ease,
          border-color 180ms ease,
          transform 180ms ease;
      }

      .dashboard-action:hover {
        color: inherit;
        background:
          linear-gradient(
            135deg,
            rgba(49,85,217,.035),
            rgba(118,87,232,.05)
          );
        border-color: rgba(49,85,217,.07);
        transform: translateX(3px);
      }

      .dashboard-action-icon {
        width: 37px;
        min-width: 37px;
        height: 37px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        font-size: 12px;
      }

      .dashboard-action-icon.blue {
        color: #3155d9;
        background: rgba(49,85,217,.09);
      }

      .dashboard-action-icon.purple {
        color: #7657e8;
        background: rgba(118,87,232,.10);
      }

      .dashboard-action-icon.gold {
        color: #ad7c24;
        background: rgba(212,175,90,.12);
      }

      .dashboard-action-icon.navy {
        color: #172554;
        background: rgba(23,37,84,.07);
      }

      .dashboard-action > div:nth-child(2) {
        flex: 1;
        min-width: 0;
      }

      .dashboard-action strong {
        display: block;
        color: var(--text);
        font-size: 10px;
      }

      .dashboard-action span {
        display: block;
        margin-top: 1px;
        color: var(--muted);
        font-size: 8px;
      }

      .dashboard-action > i:last-child {
        color: #a2a9b7;
        font-size: 9px;
      }

      .dashboard-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 245px;
        text-align: center;
      }

      .dashboard-empty strong {
        color: var(--text);
        font-size: 12px;
      }

      .dashboard-empty p {
        max-width: 300px;
        margin-top: 4px;
        font-size: 9px;
      }

      .dashboard-alert {
        color: #7c3b25;
        background: rgba(255,246,238,.80);
        border: 1px solid rgba(212,157,111,.20);
        border-radius: 13px;
      }

      .dashboard-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 3px;
        color: var(--muted);
        font-size: 9px;
      }

      .dashboard-refresh {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 8px;
        border: 0;
        border-radius: 8px;
        color: var(--text-secondary);
        background: transparent;
        font-size: 9px;
      }

      .dashboard-refresh:hover {
        color: #3155d9;
        background: rgba(49,85,217,.05);
      }

      .dashboard-refresh:disabled {
        opacity: .6;
        cursor: wait;
      }

      .spin {
        animation: spin 700ms linear infinite;
      }

      .dashboard-skeleton-hero {
        height: 340px;
        border-radius: 26px;
      }

      @keyframes dashboard-row-in {
        from {
          opacity: 0;
          transform: translateY(7px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes float-card {
        0%,100% {
          transform: translateY(0);
        }

        50% {
          transform: translateY(-6px);
        }
      }

      @keyframes orbit-spin {
        from {
          transform: translate(-50%,-50%) rotate(0deg);
        }

        to {
          transform: translate(-50%,-50%) rotate(360deg);
        }
      }

      @keyframes orbit-spin-reverse {
        from {
          transform: translate(-50%,-50%) rotate(360deg);
        }

        to {
          transform: translate(-50%,-50%) rotate(0deg);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 1199.98px) {
        .dashboard-orbit {
          width: 210px;
          height: 210px;
          margin-right: 0;
        }

        .dashboard-hero {
          padding: 36px;
        }
      }

      @media (max-width: 991.98px) {
        .dashboard-hero-content {
          min-height: auto;
        }

        .dashboard-orbit {
          display: none;
        }

        .dashboard-hero {
          min-height: auto;
        }
      }

      @media (max-width: 767.98px) {
        .dashboard-hero {
          padding: 30px 25px;
        }

        .dashboard-hero h1 {
          font-size: 2rem;
        }

        .dashboard-health {
          flex-direction: column;
          align-items: flex-start;
        }

        .dashboard-health-copy {
          width: 100%;
        }

        .dashboard-task-chart {
          gap: 20px;
        }

        .dashboard-task-donut {
          width: 120px;
          min-width: 120px;
          height: 120px;
        }

        .dashboard-task-donut > div {
          width: 92px;
          height: 92px;
        }

        .dashboard-qa-grid {
          grid-template-columns: 1fr;
          gap: 20px;
        }
      }

      @media (max-width: 575.98px) {
        .dashboard-hero {
          padding: 25px 20px;
        }

        .dashboard-hero h1 {
          font-size: 1.8rem;
        }

        .dashboard-hero p {
          font-size: 12px;
        }

        .dashboard-section-header {
          gap: 10px;
        }

        .dashboard-health-stats {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .dashboard-health-stats > div,
        .dashboard-health-stats > div:first-child {
          padding: 8px 0;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .dashboard-health-stats > div:last-child {
          border-bottom: 0;
        }

        .dashboard-task-chart {
          flex-direction: column;
          align-items: center;
        }

        .dashboard-task-legend {
          width: 100%;
        }

        .dashboard-project-number {
          display: none;
        }

        .dashboard-project-heading {
          align-items: flex-start;
          flex-direction: column;
          gap: 5px;
        }

        .dashboard-project-status {
          align-self: flex-start;
        }

        .dashboard-footer {
          align-items: flex-start;
          gap: 8px;
          flex-direction: column;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .dashboard-orbit-ring,
        .dashboard-floating-card,
        .dashboard-project-row,
        .dashboard-activity-item {
          animation: none !important;
          opacity: 1 !important;
        }
      }
    `}</style>
  );
}