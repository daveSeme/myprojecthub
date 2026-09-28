'use client';

import { useEffect, useMemo, useState } from 'react';

import AppShell from '@/components/AppShell';
import {
  listProjects,
  listTasks,
  listTickets,
  listUpdates,
} from '@/lib/firestore';

import type {
  Project,
  Task,
  Ticket,
  Update,
} from '@/lib/types';

type ActivityType =
  | 'project'
  | 'task'
  | 'ticket'
  | 'update';

type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  projectName?: string;
  person?: string;
  status?: string;
  priority?: string;
  createdAt?: unknown;
};

type ActivityFilter =
  | 'all'
  | 'project'
  | 'task'
  | 'ticket'
  | 'update';

function normalizeStatus(status?: string) {
  return (
    status
      ?.toLowerCase()
      .replace(/[\s-]+/g, '_') || ''
  );
}

function formatStatus(status?: string) {
  if (!status) return '';

  return status
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

function formatPriority(priority?: string) {
  if (!priority) return '';

  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1)
  );
}

function formatDate(value?: unknown) {
  if (!value) return 'Recently';

  try {
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate?: unknown })
        .toDate === 'function'
    ) {
      const date = (
        value as { toDate: () => Date }
      ).toDate();

      return date.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const date = new Date(
      value as string,
    );

    if (Number.isNaN(date.getTime())) {
      return 'Recently';
    }

    return date.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recently';
  }
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'project':
      return 'bi-folder2-open';

    case 'task':
      return 'bi-check2-square';

    case 'ticket':
      return 'bi-bug';

    case 'update':
      return 'bi-journal-richtext';

    default:
      return 'bi-activity';
  }
}

function getActivityLabel(type: ActivityType) {
  switch (type) {
    case 'project':
      return 'Project';

    case 'task':
      return 'Task';

    case 'ticket':
      return 'QA ticket';

    case 'update':
      return 'Project update';

    default:
      return 'Activity';
  }
}

function getActivityClass(type: ActivityType) {
  switch (type) {
    case 'project':
      return 'activity-project';

    case 'task':
      return 'activity-task';

    case 'ticket':
      return 'activity-ticket';

    case 'update':
      return 'activity-update';

    default:
      return '';
  }
}

function ActivitySkeleton() {
  return (
    <div className="activity-skeleton">
      <div className="skeleton skeleton-icon" />

      <div className="skeleton-content">
        <div className="skeleton skeleton-line title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
    </div>
  );
}

export default function Activity() {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [updates, setUpdates] =
    useState<Update[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [filter, setFilter] =
    useState<ActivityFilter>('all');

  const [search, setSearch] =
    useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');

      const [
        projectData,
        taskData,
        ticketData,
        updateData,
      ] = await Promise.all([
        listProjects(),
        listTasks(),
        listTickets(),
        listUpdates(),
      ]);

      setProjects(projectData);
      setTasks(taskData);
      setTickets(ticketData);
      setUpdates(updateData);
    } catch (err) {
      console.error(
        'Failed to load activity:',
        err,
      );

      setError(
        'Unable to load workspace activity. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activities = useMemo<ActivityItem[]>(
    () => {
      const projectActivities: ActivityItem[] =
        projects.map((project) => ({
          id: `project-${project.id}`,
          type: 'project',
          title: `Project created: ${project.name}`,
          description:
            project.description ||
            'Project added to the workspace.',
          projectName: project.name,
          person: project.ownerName,
          status: project.status,
          priority: project.priority,
          createdAt: project.createdAt,
        }));

      const taskActivities: ActivityItem[] =
        tasks.map((task) => ({
          id: `task-${task.id}`,
          type: 'task',
          title: `Task: ${task.title}`,
          description:
            task.description ||
            'Task added to the project.',
          projectName: task.projectName,
          person: task.assigneeName,
          status: task.status,
          priority: task.priority,
          createdAt: task.createdAt,
        }));

      const ticketActivities: ActivityItem[] =
        tickets.map((ticket) => ({
          id: `ticket-${ticket.id}`,
          type: 'ticket',
          title: `QA ticket: ${ticket.title}`,
          description:
            ticket.description ||
            'QA ticket raised against the project.',
          projectName: ticket.projectName,
          person: ticket.testerName,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.createdAt,
        }));

      const updateActivities: ActivityItem[] =
        updates.map((update) => ({
          id: `update-${update.id}`,
          type: 'update',
          title: `Project update: ${
            update.projectName ||
            'Unknown project'
          }`,
          description: update.text,
          projectName: update.projectName,
          person: update.authorName,
          createdAt: update.createdAt,
        }));

      return [
        ...projectActivities,
        ...taskActivities,
        ...ticketActivities,
        ...updateActivities,
      ];
    },
    [
      projects,
      tasks,
      tickets,
      updates,
    ],
  );

  const sortedActivities = useMemo(() => {
    return [...activities].sort(
      (a, b) => {
        const getTime = (
          value?: unknown,
        ) => {
          try {
            if (
              typeof value === 'object' &&
              value !== null &&
              'toDate' in value &&
              typeof (
                value as {
                  toDate?: unknown;
                }
              ).toDate === 'function'
            ) {
              return (
                value as {
                  toDate: () => Date;
                }
              )
                .toDate()
                .getTime();
            }

            const date = new Date(
              value as string,
            );

            return Number.isNaN(
              date.getTime(),
            )
              ? 0
              : date.getTime();
          } catch {
            return 0;
          }
        };

        return (
          getTime(b.createdAt) -
          getTime(a.createdAt)
        );
      },
    );
  }, [activities]);

  const filteredActivities =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return sortedActivities.filter(
        (activity) => {
          const matchesType =
            filter === 'all' ||
            activity.type === filter;

          const matchesSearch =
            !query ||
            activity.title
              .toLowerCase()
              .includes(query) ||
            activity.description
              .toLowerCase()
              .includes(query) ||
            activity.projectName
              ?.toLowerCase()
              .includes(query) ||
            activity.person
              ?.toLowerCase()
              .includes(query);

          return (
            matchesType &&
            matchesSearch
          );
        },
      );
    }, [
      sortedActivities,
      filter,
      search,
    ]);

  const stats = useMemo(() => {
    const openTasks = tasks.filter(
      (task) => {
        const status =
          normalizeStatus(task.status);

        return (
          status !== 'done' &&
          status !== 'completed'
        );
      },
    ).length;

    const openTickets = tickets.filter(
      (ticket) => {
        const status =
          normalizeStatus(ticket.status);

        return (
          status !== 'closed' &&
          status !== 'verified'
        );
      },
    ).length;

    const activeProjects =
      projects.filter(
        (project) =>
          project.status === 'active',
      ).length;

    return {
      total: activities.length,
      activeProjects,
      openTasks,
      openTickets,
    };
  }, [
    activities.length,
    projects,
    tasks,
    tickets,
  ]);

  const counts = useMemo(
    () => ({
      all: activities.length,

      project: activities.filter(
        (item) =>
          item.type === 'project',
      ).length,

      task: activities.filter(
        (item) =>
          item.type === 'task',
      ).length,

      ticket: activities.filter(
        (item) =>
          item.type === 'ticket',
      ).length,

      update: activities.filter(
        (item) =>
          item.type === 'update',
      ).length,
    }),
    [activities],
  );

  return (
    <AppShell>
      <div className="activity-page">

        {/* HEADER */}
        <div className="activity-header">

          <div>
            <div className="page-eyebrow">
              <i className="bi bi-activity" />
              WORKSPACE AUDIT
            </div>

            <h2>Activity</h2>

            <p className="muted mb-0">
              A consolidated view of project
              changes, tasks, QA tickets, and
              team updates across the workspace.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary refresh-button"
            onClick={load}
            disabled={loading}
            title="Refresh activity"
            data-bs-toggle="tooltip"
          >
            <i
              className={`bi ${
                loading
                  ? 'bi-arrow-repeat spin'
                  : 'bi-arrow-clockwise'
              } me-2`}
            />
            Refresh
          </button>

        </div>

        {/* ERROR */}
        {error && (
          <div
            className="alert alert-danger activity-alert"
            role="alert"
          >
            <i className="bi bi-exclamation-circle me-2" />
            {error}
          </div>
        )}

        {/* METRICS */}
        <div className="row g-3 mb-4">

          <div className="col-6 col-xl-3">
            <div className="cardx activity-stat">

              <div className="stat-icon">
                <i className="bi bi-activity" />
              </div>

              <div>
                <span>Total events</span>
                <strong>
                  {stats.total}
                </strong>
              </div>

            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="cardx activity-stat">

              <div className="stat-icon">
                <i className="bi bi-folder2-open" />
              </div>

              <div>
                <span>Active projects</span>
                <strong>
                  {stats.activeProjects}
                </strong>
              </div>

            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="cardx activity-stat">

              <div className="stat-icon">
                <i className="bi bi-check2-square" />
              </div>

              <div>
                <span>Open tasks</span>
                <strong>
                  {stats.openTasks}
                </strong>
              </div>

            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="cardx activity-stat">

              <div className="stat-icon critical">
                <i className="bi bi-bug" />
              </div>

              <div>
                <span>Open QA tickets</span>
                <strong>
                  {stats.openTickets}
                </strong>
              </div>

            </div>
          </div>

        </div>

        {/* FILTER TOOLBAR */}
        <div className="cardx activity-toolbar mb-3">

          <div className="activity-search">

            <i className="bi bi-search" />

            <input
              type="search"
              placeholder="Search activity, projects, people..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() =>
                  setSearch('')
                }
                title="Clear search"
                data-bs-toggle="tooltip"
                aria-label="Clear search"
              >
                <i className="bi bi-x-lg" />
              </button>
            )}

          </div>

          <div className="activity-filters">

            {(
              [
                [
                  'all',
                  'All',
                  counts.all,
                ],
                [
                  'project',
                  'Projects',
                  counts.project,
                ],
                [
                  'task',
                  'Tasks',
                  counts.task,
                ],
                [
                  'ticket',
                  'QA',
                  counts.ticket,
                ],
                [
                  'update',
                  'Updates',
                  counts.update,
                ],
              ] as const
            ).map(
              ([
                value,
                label,
                count,
              ]) => (
                <button
                  key={value}
                  type="button"
                  className={`activity-filter ${
                    filter === value
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setFilter(value)
                  }
                >
                  {label}
                  <span>{count}</span>
                </button>
              ),
            )}

          </div>

        </div>

        {/* ACTIVITY FEED */}
        <div className="cardx activity-card">

          <div className="activity-card-header">

            <div>
              <h5>Workspace timeline</h5>

              <p className="muted">
                {loading
                  ? 'Loading workspace events...'
                  : `${filteredActivities.length} event${
                      filteredActivities.length ===
                      1
                        ? ''
                        : 's'
                    } shown`}
              </p>
            </div>

            <div className="live-indicator">
              <span />
              Workspace data
            </div>

          </div>

          {loading ? (
            <div className="activity-feed">

              <ActivitySkeleton />
              <ActivitySkeleton />
              <ActivitySkeleton />
              <ActivitySkeleton />

            </div>
          ) : filteredActivities.length ===
            0 ? (
            <div className="activity-empty">

              <div className="empty-icon">
                <i className="bi bi-activity" />
              </div>

              <h5>
                {activities.length === 0
                  ? 'No activity yet'
                  : 'No matching activity'}
              </h5>

              <p className="muted">
                {activities.length === 0
                  ? 'Project creation, tasks, QA tickets, and updates will appear here as the workspace grows.'
                  : 'Try changing your search or activity filter.'}
              </p>

            </div>
          ) : (
            <div className="activity-feed">

              {filteredActivities.map(
                (activity, index) => (
                  <article
                    className="activity-item"
                    key={activity.id}
                    style={{
                      animationDelay: `${
                        index * 35
                      }ms`,
                    }}
                  >

                    <div className="activity-rail">

                      <div
                        className={`activity-icon ${getActivityClass(
                          activity.type,
                        )}`}
                      >
                        <i
                          className={`bi ${getActivityIcon(
                            activity.type,
                          )}`}
                        />
                      </div>

                      {index <
                        filteredActivities.length -
                          1 && (
                        <div className="activity-line" />
                      )}

                    </div>

                    <div className="activity-content">

                      <div className="activity-main">

                        <div className="activity-title-row">

                          <div>
                            <span className="activity-type">
                              {
                                getActivityLabel(
                                  activity.type,
                                )
                              }
                            </span>

                            <h6>
                              {activity.title}
                            </h6>
                          </div>

                          <time>
                            <i className="bi bi-clock me-1" />
                            {formatDate(
                              activity.createdAt,
                            )}
                          </time>

                        </div>

                        <p className="activity-description">
                          {
                            activity.description
                          }
                        </p>

                        <div className="activity-meta">

                          {activity.projectName && (
                            <span>
                              <i className="bi bi-folder2-open" />
                              {
                                activity.projectName
                              }
                            </span>
                          )}

                          {activity.person && (
                            <span>
                              <i className="bi bi-person" />
                              {
                                activity.person
                              }
                            </span>
                          )}

                          {activity.status && (
                            <span className="meta-status">
                              <i className="bi bi-circle-fill" />
                              {
                                formatStatus(
                                  activity.status,
                                )
                              }
                            </span>
                          )}

                          {activity.priority && (
                            <span>
                              <i className="bi bi-flag" />
                              {
                                formatPriority(
                                  activity.priority,
                                )
                              }
                            </span>
                          )}

                        </div>

                      </div>

                      <button
                        type="button"
                        className="activity-more"
                        title="Activity details"
                        data-bs-toggle="tooltip"
                        aria-label={`Details for ${activity.title}`}
                      >
                        <i className="bi bi-three-dots" />
                      </button>

                    </div>

                  </article>
                ),
              )}

            </div>
          )}

        </div>

      </div>

      <style jsx>{`
        .activity-page {
          animation: pageIn 0.45s ease both;
        }

        .activity-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .page-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #8b8b8b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          margin-bottom: 8px;
        }

        .activity-header h2 {
          margin: 0;
          font-weight: 700;
          letter-spacing: -0.035em;
        }

        .activity-header p {
          margin-top: 7px;
          max-width: 700px;
          font-size: 13px;
        }

        .refresh-button {
          height: 38px;
          border-radius: 9px;
          font-size: 11px;
        }

        .refresh-button .spin {
          animation: spin 0.9s linear infinite;
        }

        .activity-alert {
          border-radius: 10px;
          font-size: 11px;
          animation: panelIn 0.3s ease both;
        }

        .activity-stat {
          min-height: 92px;
          display: flex;
          align-items: center;
          gap: 14px;
          animation: cardIn 0.5s ease both;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .activity-stat:hover {
          transform: translateY(-2px);
          box-shadow:
            0 12px 28px rgba(0, 0, 0, 0.06);
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #f5f0e8;
          color: #9b7b42;
          font-size: 18px;
        }

        .stat-icon.critical {
          background: #f5e8e5;
          color: #8c625b;
        }

        .activity-stat span {
          display: block;
          color: #888;
          font-size: 11px;
          margin-bottom: 3px;
        }

        .activity-stat strong {
          display: block;
          font-size: 24px;
          line-height: 1;
        }

        .activity-toolbar {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 11px;
          animation: cardIn 0.45s ease both;
        }

        .activity-search {
          position: relative;
          flex: 1;
          min-width: 220px;
        }

        .activity-search > i {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: 12px;
        }

        .activity-search input {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 9px;
          background: #faf9f6;
          padding: 9px 36px;
          outline: none;
          font-size: 11px;
        }

        .activity-search input:focus {
          border-color: rgba(
            200,
            169,
            110,
            0.7
          );
          box-shadow:
            0 0 0 3px
              rgba(200, 169, 110, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 7px;
          top: 50%;
          transform: translateY(-50%);
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #999;
        }

        .clear-search:hover {
          background: #eee;
          color: #333;
        }

        .activity-filters {
          display: flex;
          gap: 3px;
          padding: 4px;
          border-radius: 9px;
          background: #f8f7f4;
          overflow-x: auto;
        }

        .activity-filter {
          border: 0;
          background: transparent;
          color: #777;
          border-radius: 7px;
          padding: 7px 9px;
          font-size: 10px;
          font-weight: 650;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .activity-filter:hover {
          color: #222;
        }

        .activity-filter.active {
          background: #fff;
          color: #222;
          box-shadow:
            0 2px 7px
              rgba(0, 0, 0, 0.06);
        }

        .activity-filter span {
          margin-left: 4px;
          color: #999;
          font-size: 9px;
        }

        .activity-card {
          padding: 0;
          overflow: hidden;
          animation: cardIn 0.5s ease both;
        }

        .activity-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 20px 24px;
          border-bottom: 1px solid
            rgba(0, 0, 0, 0.055);
        }

        .activity-card-header h5 {
          margin: 0;
          font-weight: 650;
        }

        .activity-card-header p {
          margin: 3px 0 0;
          font-size: 10px;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #999;
          font-size: 9px;
        }

        .live-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #718875;
          animation: livePulse 2s infinite;
        }

        .activity-feed {
          padding: 0 24px;
        }

        .activity-item {
          display: flex;
          gap: 13px;
          animation: rowIn 0.4s ease both;
        }

        .activity-rail {
          width: 38px;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 0 0 38px;
        }

        .activity-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 34px;
          border: 3px solid #fff;
          border-radius: 50%;
          background: #f5f0e8;
          color: #9b7b42;
          box-shadow:
            0 2px 8px
              rgba(0, 0, 0, 0.06);
          font-size: 12px;
          z-index: 2;
        }

        .activity-icon.activity-project {
          background: #f5f0e8;
          color: #9b7b42;
        }

        .activity-icon.activity-task {
          background: #edf1ed;
          color: #68816d;
        }

        .activity-icon.activity-ticket {
          background: #f5e8e5;
          color: #8c625b;
        }

        .activity-icon.activity-update {
          background: #efedf3;
          color: #746b83;
        }

        .activity-line {
          width: 1px;
          flex: 1;
          min-height: 25px;
          background: rgba(0, 0, 0, 0.08);
        }

        .activity-content {
          min-width: 0;
          flex: 1;
          display: flex;
          gap: 12px;
          padding: 18px 4px;
          border-bottom: 1px solid
            rgba(0, 0, 0, 0.055);
        }

        .activity-item:last-child
          .activity-content {
          border-bottom: 0;
        }

        .activity-main {
          min-width: 0;
          flex: 1;
        }

        .activity-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .activity-type {
          display: inline-block;
          margin-bottom: 3px;
          color: #9b7b42;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .activity-title-row h6 {
          margin: 0;
          color: #272727;
          font-size: 12px;
          font-weight: 650;
        }

        .activity-title-row time {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
          color: #999;
          font-size: 8px;
          white-space: nowrap;
        }

        .activity-title-row time i {
          color: #9b7b42;
        }

        .activity-description {
          max-width: 760px;
          margin: 8px 0 9px;
          color: #666;
          font-size: 10px;
          line-height: 1.65;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          white-space: pre-wrap;
        }

        .activity-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 11px;
          color: #999;
          font-size: 8px;
        }

        .activity-meta span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .activity-meta i {
          color: #9b7b42;
          font-size: 9px;
        }

        .activity-meta .meta-status i {
          font-size: 5px;
        }

        .activity-more {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          flex: 0 0 31px;
          border: 1px solid
            rgba(0, 0, 0, 0.07);
          border-radius: 8px;
          background: #fff;
          color: #888;
          transition: all 0.2s ease;
        }

        .activity-more:hover {
          background: #f5f0e8;
          color: #222;
          transform: translateY(-1px);
        }

        .activity-empty {
          padding: 70px 20px;
          text-align: center;
          animation: pageIn 0.4s ease both;
        }

        .empty-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          margin: 0 auto 15px;
          border-radius: 14px;
          background: #f5f0e8;
          color: #9b7b42;
          font-size: 21px;
        }

        .activity-empty h5 {
          margin-bottom: 6px;
        }

        .activity-empty p {
          max-width: 470px;
          margin: 0 auto;
          font-size: 11px;
        }

        .activity-skeleton {
          display: flex;
          gap: 13px;
          min-height: 110px;
          padding: 18px 4px;
          border-bottom: 1px solid
            rgba(0, 0, 0, 0.055);
        }

        .skeleton {
          border-radius: 6px;
          background: linear-gradient(
            90deg,
            #f0efec,
            #faf9f6,
            #f0efec
          );
          background-size: 200% 100%;
          animation: skeleton 1.5s infinite;
        }

        .skeleton-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 50%;
        }

        .skeleton-content {
          flex: 1;
          padding: 4px 0;
        }

        .skeleton-line {
          width: 75%;
          height: 9px;
          margin-bottom: 10px;
        }

        .skeleton-line.title {
          width: 35%;
          height: 12px;
          margin-bottom: 15px;
        }

        .skeleton-line.short {
          width: 45%;
        }

        @keyframes pageIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(7px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes panelIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes rowIn {
          from {
            opacity: 0;
            transform: translateX(-6px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes skeleton {
          0% {
            background-position: 200% 0;
          }

          100% {
            background-position: -200% 0;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes livePulse {
          0%,
          100% {
            box-shadow:
              0 0 0 0
                rgba(113, 136, 117, 0.25);
          }

          50% {
            box-shadow:
              0 0 0 5px
                rgba(113, 136, 117, 0);
          }
        }

        @media (max-width: 950px) {
          .activity-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .activity-search {
            min-width: 100%;
          }
        }

        @media (max-width: 750px) {
          .activity-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .refresh-button {
            width: 100%;
          }

          .activity-card-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 600px) {
          .activity-feed {
            padding: 0 16px;
          }

          .activity-card-header {
            padding: 18px;
          }

          .activity-title-row {
            flex-direction: column;
            gap: 6px;
          }

          .activity-title-row time {
            order: 2;
          }

          .activity-content {
            padding: 16px 2px;
          }

          .activity-rail {
            width: 32px;
            flex-basis: 32px;
          }

          .activity-icon {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
          }

          .activity-description {
            -webkit-line-clamp: 5;
          }

          .activity-more {
            width: 29px;
            height: 29px;
            flex-basis: 29px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .activity-page,
          .activity-stat,
          .activity-toolbar,
          .activity-card,
          .activity-item,
          .activity-empty,
          .activity-skeleton,
          .skeleton,
          .live-indicator span,
          .refresh-button .spin {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </AppShell>
  );
}