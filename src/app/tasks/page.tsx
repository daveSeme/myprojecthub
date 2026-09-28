'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import {
  createTask,
  listProjects,
  listTasks,
  listUsers,
} from '@/lib/firestore';
import { useAuth } from '@/components/AuthProvider';
import type {
  Profile,
  Project,
  Task,
  Priority,
} from '@/lib/types';

type TaskFilter =
  | 'all'
  | 'todo'
  | 'in_progress'
  | 'done';

function normalizeStatus(status?: string) {
  return status?.toLowerCase().replace(/[\s-]+/g, '_') || 'todo';
}

function isCompleted(status?: string) {
  const value = normalizeStatus(status);

  return value === 'done' || value === 'completed';
}

function isInProgress(status?: string) {
  const value = normalizeStatus(status);

  return value === 'in_progress' || value === 'inprogress';
}

function statusLabel(status?: string) {
  const value = normalizeStatus(status);

  if (isCompleted(status)) return 'Completed';
  if (isInProgress(status)) return 'In progress';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function priorityClass(priority?: string) {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return 'priority-critical';

    case 'high':
      return 'priority-high';

    case 'low':
      return 'priority-low';

    default:
      return 'priority-medium';
  }
}

function priorityLabel(priority?: string) {
  if (!priority) return 'Medium';

  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function statusClass(status?: string) {
  if (isCompleted(status)) return 'status-completed';
  if (isInProgress(status)) return 'status-progress';

  return 'status-todo';
}

function TaskSkeleton() {
  return (
    <div className="task-skeleton">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-meta" />
    </div>
  );
}

export default function Tasks() {
  const { profile } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [pid, setPid] = useState('');
  const [aid, setAid] = useState('');
  const [priority, setPriority] =
    useState<Priority>('medium');

  const [phase, setPhase] = useState('Foundation');
  const [dueDate, setDueDate] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] =
    useState<TaskFilter>('all');

  const [projectFilter, setProjectFilter] =
    useState('all');

  async function load() {
    try {
      setLoading(true);

      const [taskData, projectData, userData] =
        await Promise.all([
          listTasks(),
          listProjects(),
          listUsers(),
        ]);

      setTasks(taskData);
      setProjects(projectData);
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !pid || !aid) return;

    const project = projects.find(
      (project) => project.id === pid
    );

    const assignee = users.find(
      (user) => user.uid === aid
    );

    try {
      setBusy(true);

      await createTask({
        title: title.trim(),
        description: desc.trim(),

        /*
         * This is important.
         * Projects use projectId to calculate
         * their real completion percentage.
         */
        projectId: pid,
        projectName: project?.name,

        assigneeId: aid,
        assigneeName: assignee?.name,

        status: 'todo',
        priority,

        /*
         * Roadmap phase.
         */
        phase,

        /*
         * Optional due date.
         */
        dueDate: dueDate || undefined,
      });

      setTitle('');
      setDesc('');
      setPid('');
      setAid('');
      setPriority('medium');
      setPhase('Foundation');
      setDueDate('');

      await load();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setBusy(false);
    }
  }

  const metrics = useMemo(() => {
    const total = tasks.length;

    const todo = tasks.filter(
      (task) =>
        !isCompleted(task.status) &&
        !isInProgress(task.status)
    ).length;

    const inProgress = tasks.filter((task) =>
      isInProgress(task.status)
    ).length;

    const completed = tasks.filter((task) =>
      isCompleted(task.status)
    ).length;

    const critical = tasks.filter(
      (task) =>
        task.priority?.toLowerCase() === 'critical'
    ).length;

    const high = tasks.filter(
      (task) =>
        task.priority?.toLowerCase() === 'high'
    ).length;

    const completion =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    return {
      total,
      todo,
      inProgress,
      completed,
      critical,
      high,
      completion,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.projectName
          ?.toLowerCase()
          .includes(query) ||
        task.assigneeName
          ?.toLowerCase()
          .includes(query);

      const status = normalizeStatus(task.status);

      const matchesStatus =
        filter === 'all' ||
        (filter === 'todo' &&
          !isCompleted(status) &&
          !isInProgress(status)) ||
        (filter === 'in_progress' &&
          isInProgress(status)) ||
        (filter === 'done' &&
          isCompleted(status));

      const matchesProject =
        projectFilter === 'all' ||
        task.projectId === projectFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProject
      );
    });
  }, [
    tasks,
    search,
    filter,
    projectFilter,
  ]);

  return (
    <AppShell>
      <div className="tasks-page">

        {/* Header */}
        <div className="tasks-header">
          <div>
            <div className="page-eyebrow">
              <i className="bi bi-check2-square" />
              WORK MANAGEMENT
            </div>

            <h2>Tasks</h2>

            <p className="muted mb-0">
              Create, assign, and track the work that
              drives your project progress.
            </p>
          </div>

          <div className="completion-summary">
            <div className="completion-number">
              {metrics.completion}%
            </div>

            <div>
              <strong>Overall completion</strong>
              <span>
                {metrics.completed} of {metrics.total} done
              </span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="row g-3 mb-4">

          <div className="col-6 col-xl-3">
            <div className="cardx task-stat">
              <div className="stat-icon">
                <i className="bi bi-list-check" />
              </div>

              <div>
                <span>Total tasks</span>
                <strong>{metrics.total}</strong>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="cardx task-stat">
              <div className="stat-icon">
                <i className="bi bi-arrow-repeat" />
              </div>

              <div>
                <span>In progress</span>
                <strong>{metrics.inProgress}</strong>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="cardx task-stat">
              <div className="stat-icon completed">
                <i className="bi bi-check2-circle" />
              </div>

              <div>
                <span>Completed</span>
                <strong>{metrics.completed}</strong>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="cardx task-stat">
              <div className="stat-icon critical">
                <i className="bi bi-flag-fill" />
              </div>

              <div>
                <span>High priority</span>
                <strong>
                  {metrics.critical + metrics.high}
                </strong>
              </div>
            </div>
          </div>

        </div>

        {/* Create Task */}
        <div className="cardx create-task-card mb-4">

          <div className="create-task-header">
            <div className="create-task-icon">
              <i className="bi bi-plus-lg" />
            </div>

            <div>
              <h5>Create task</h5>

              <p className="muted mb-0">
                Assign work to a project, roadmap phase,
                and team member.
              </p>
            </div>
          </div>

          <form
            onSubmit={save}
            className="row g-3 mt-2"
          >

            {/* Title */}
            <div className="col-lg-5">
              <label className="form-label">
                Task title
              </label>

              <input
                className="form-control"
                placeholder="What needs to be done?"
                required
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
              />
            </div>

            {/* Project */}
            <div className="col-lg-3">
              <label className="form-label">
                Project
              </label>

              <select
                className="form-select"
                required
                value={pid}
                onChange={(e) =>
                  setPid(e.target.value)
                }
              >
                <option value="">
                  Select project
                </option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Phase */}
            <div className="col-lg-2">
              <label className="form-label">
                Roadmap phase
              </label>

              <select
                className="form-select"
                value={phase}
                onChange={(e) =>
                  setPhase(e.target.value)
                }
              >
                <option>Foundation</option>
                <option>Core Product</option>
                <option>Development</option>
                <option>Testing</option>
                <option>Shopping</option>
                <option>Launch</option>
                <option>Maintenance</option>
              </select>
            </div>

            {/* Priority */}
            <div className="col-lg-2">
              <label className="form-label">
                Priority
              </label>

              <select
                className="form-select"
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as Priority
                  )
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">
                  Critical
                </option>
              </select>
            </div>

            {/* Assignee */}
            <div className="col-md-6">
              <label className="form-label">
                Assign to
              </label>

              <select
                className="form-select"
                required
                value={aid}
                onChange={(e) =>
                  setAid(e.target.value)
                }
              >
                <option value="">
                  Select team member
                </option>

                {users.map((user) => (
                  <option
                    key={user.uid}
                    value={user.uid}
                  >
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div className="col-md-3">
              <label className="form-label">
                Due date
              </label>

              <input
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(e.target.value)
                }
              />
            </div>

            {/* Description */}
            <div className="col-md-3">
              <label className="form-label">
                Context
              </label>

              <input
                className="form-control"
                placeholder="Short description"
                value={desc}
                onChange={(e) =>
                  setDesc(e.target.value)
                }
              />
            </div>

            {/* Submit */}
            <div className="col-12">
              <button
                className="btn btn-dark"
                disabled={busy}
                type="submit"
              >
                {busy ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-lg me-2" />
                    Create task
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Toolbar */}
        <div className="cardx tasks-toolbar mb-3">

          <div className="task-search">
            <i className="bi bi-search" />

            <input
              type="search"
              placeholder="Search tasks, projects, or people..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                title="Clear search"
                data-bs-toggle="tooltip"
                className="clear-search"
              >
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>

          <div className="task-filters">

            {(
              [
                ['all', 'All', metrics.total],
                ['todo', 'To do', metrics.todo],
                [
                  'in_progress',
                  'In progress',
                  metrics.inProgress,
                ],
                [
                  'done',
                  'Completed',
                  metrics.completed,
                ],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                className={`task-filter ${
                  filter === value ? 'active' : ''
                }`}
                onClick={() => setFilter(value)}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}

          </div>

          <select
            className="form-select project-filter-select"
            value={projectFilter}
            onChange={(e) =>
              setProjectFilter(e.target.value)
            }
            title="Filter by project"
            data-bs-toggle="tooltip"
          >
            <option value="all">
              All projects
            </option>

            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ))}
          </select>

        </div>

        {/* Task list */}
        <div className="cardx task-list-card">

          <div className="task-list-header">
            <div>
              <h5>Task board</h5>
              <p className="muted">
                {filteredTasks.length} task
                {filteredTasks.length === 1
                  ? ''
                  : 's'} shown
              </p>
            </div>
          </div>

          {loading && (
            <div className="task-list">
              <TaskSkeleton />
              <TaskSkeleton />
              <TaskSkeleton />
              <TaskSkeleton />
            </div>
          )}

          {!loading &&
            filteredTasks.length > 0 && (
              <div className="task-list">

                {filteredTasks.map(
                  (task, index) => (
                    <div
                      className="task-row"
                      key={task.id}
                      style={{
                        animationDelay: `${
                          index * 45
                        }ms`,
                      }}
                    >

                      <div
                        className={`task-indicator ${statusClass(
                          task.status
                        )}`}
                      />

                      <div className="task-info">

                        <div className="task-title">
                          <strong>
                            {task.title}
                          </strong>

                          <span
                            className={`priority-badge ${priorityClass(
                              task.priority
                            )}`}
                          >
                            <i className="bi bi-flag-fill" />
                            {priorityLabel(
                              task.priority
                            )}
                          </span>
                        </div>

                        {task.description && (
                          <p className="muted">
                            {task.description}
                          </p>
                        )}

                        <div className="task-meta">

                          <span>
                            <i className="bi bi-folder2-open" />
                            {task.projectName ||
                              'No project'}
                          </span>

                          {task.phase && (
                            <span>
                              <i className="bi bi-signpost-2" />
                              {task.phase}
                            </span>
                          )}

                          <span>
                            <i className="bi bi-person" />
                            {task.assigneeName ||
                              'Unassigned'}
                          </span>

                          {task.dueDate && (
                            <span>
                              <i className="bi bi-calendar3" />
                              {task.dueDate}
                            </span>
                          )}

                        </div>

                      </div>

                      <div className="task-status-wrapper">

                        <span
                          className={`status-badge ${statusClass(
                            task.status
                          )}`}
                        >
                          <i className="bi bi-circle-fill" />
                          {statusLabel(task.status)}
                        </span>

                        <button
                          type="button"
                          className="task-action"
                          title="Task actions"
                          data-bs-toggle="tooltip"
                          aria-label={`Actions for ${task.title}`}
                        >
                          <i className="bi bi-three-dots" />
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          {!loading &&
            filteredTasks.length === 0 && (
              <div className="tasks-empty">

                <div className="empty-icon">
                  <i className="bi bi-check2-square" />
                </div>

                <h5>
                  {tasks.length === 0
                    ? 'No tasks yet'
                    : 'No matching tasks'}
                </h5>

                <p className="muted">
                  {tasks.length === 0
                    ? 'Create your first task to start tracking project work.'
                    : 'Try changing your search or filters.'}
                </p>

              </div>
            )}

        </div>

      </div>

      <style jsx>{`
        .tasks-page {
          animation: pageIn 0.45s ease both;
        }

        .tasks-header {
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

        .tasks-header h2 {
          margin: 0;
          font-weight: 700;
          letter-spacing: -0.035em;
        }

        .tasks-header p {
          margin-top: 7px;
          font-size: 13px;
        }

        .completion-summary {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 15px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.72);
        }

        .completion-number {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #9b7b42;
        }

        .completion-summary strong {
          display: block;
          font-size: 12px;
        }

        .completion-summary span {
          display: block;
          margin-top: 2px;
          color: #999;
          font-size: 10px;
        }

        .task-stat {
          min-height: 92px;
          display: flex;
          align-items: center;
          gap: 14px;
          animation: cardIn 0.5s ease both;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .task-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
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

        .stat-icon.completed {
          background: #eaf0eb;
          color: #68816d;
        }

        .stat-icon.critical {
          background: #f5e8e5;
          color: #8c625b;
        }

        .task-stat span {
          display: block;
          color: #888;
          font-size: 11px;
          margin-bottom: 3px;
        }

        .task-stat strong {
          display: block;
          font-size: 24px;
          line-height: 1;
        }

        .create-task-card {
          animation: panelIn 0.4s ease both;
        }

        .create-task-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .create-task-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #f5f0e8;
          color: #9b7b42;
        }

        .create-task-header h5 {
          margin: 0;
          font-weight: 650;
        }

        .create-task-header p {
          margin-top: 3px;
          font-size: 11px;
        }

        .form-label {
          font-size: 11px;
          font-weight: 650;
          margin-bottom: 6px;
        }

        .tasks-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px;
        }

        .task-search {
          position: relative;
          flex: 1;
          min-width: 220px;
        }

        .task-search > i {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: 12px;
        }

        .task-search input {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 9px;
          background: #faf9f6;
          padding: 9px 35px 9px 35px;
          outline: none;
          font-size: 11px;
        }

        .task-search input:focus {
          border-color: rgba(200, 169, 110, 0.7);
          box-shadow: 0 0 0 3px
            rgba(200, 169, 110, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 7px;
          top: 50%;
          transform: translateY(-50%);
          width: 25px;
          height: 25px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #999;
        }

        .clear-search:hover {
          background: #eee;
          color: #333;
        }

        .task-filters {
          display: flex;
          gap: 3px;
          padding: 4px;
          border-radius: 9px;
          background: #f8f7f4;
        }

        .task-filter {
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

        .task-filter:hover {
          color: #222;
        }

        .task-filter.active {
          background: #fff;
          color: #222;
          box-shadow: 0 2px 7px
            rgba(0, 0, 0, 0.06);
        }

        .task-filter span {
          margin-left: 4px;
          color: #999;
          font-size: 9px;
        }

        .project-filter-select {
          width: 150px;
          flex: 0 0 150px;
          font-size: 11px;
        }

        .task-list-card {
          padding: 0;
          overflow: hidden;
          animation: cardIn 0.5s ease both;
        }

        .task-list-header {
          padding: 20px 24px;
          border-bottom: 1px solid
            rgba(0, 0, 0, 0.055);
        }

        .task-list-header h5 {
          margin: 0;
          font-weight: 650;
        }

        .task-list-header p {
          margin: 3px 0 0;
          font-size: 10px;
        }

        .task-list {
          padding: 0 24px;
        }

        .task-row {
          display: flex;
          align-items: center;
          gap: 13px;
          min-height: 91px;
          padding: 17px 4px;
          border-bottom: 1px solid
            rgba(0, 0, 0, 0.055);
          animation: rowIn 0.4s ease both;
          transition:
            padding 0.2s ease,
            background 0.2s ease;
        }

        .task-row:last-child {
          border-bottom: 0;
        }

        .task-row:hover {
          padding-left: 9px;
          padding-right: 9px;
          background: rgba(245, 240, 232, 0.25);
        }

        .task-indicator {
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          border-radius: 50%;
        }

        .status-todo {
          background: #aaa;
        }

        .status-progress {
          background: #c8a96e;
          animation: pulse 2s infinite;
        }

        .status-completed {
          background: #718875;
        }

        .task-info {
          min-width: 0;
          flex: 1;
        }

        .task-title {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .task-title strong {
          color: #262626;
          font-size: 13px;
        }

        .priority-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 6px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 700;
        }

        .priority-critical {
          color: #8a5550;
          background: #f5e5e2;
        }

        .priority-high {
          color: #8c625b;
          background: #f6ebe8;
        }

        .priority-medium {
          color: #8d7344;
          background: #f5f0e5;
        }

        .priority-low {
          color: #66806c;
          background: #eaf0eb;
        }

        .task-info > p {
          margin: 5px 0 7px;
          max-width: 650px;
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .task-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          color: #919191;
          font-size: 9px;
        }

        .task-meta span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .task-meta i {
          font-size: 9px;
        }

        .task-status-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 650;
          white-space: nowrap;
        }

        .status-badge.status-todo {
          color: #777;
          background: #f0f0ee;
        }

        .status-badge.status-progress {
          color: #8d7344;
          background: #f6f0e4;
        }

        .status-badge.status-completed {
          color: #66806c;
          background: #eaf0eb;
        }

        .status-badge i {
          font-size: 5px;
        }

        .task-action {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(0, 0, 0, 0.07);
          border-radius: 8px;
          background: #fff;
          color: #888;
          transition: all 0.2s ease;
        }

        .task-action:hover {
          background: #f5f0e8;
          color: #222;
          transform: translateY(-1px);
        }

        .tasks-empty {
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

        .tasks-empty h5 {
          margin-bottom: 6px;
        }

        .tasks-empty p {
          max-width: 400px;
          margin: 0 auto;
          font-size: 11px;
        }

        .task-skeleton {
          min-height: 91px;
          padding: 20px 4px;
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

        .skeleton-title {
          width: 35%;
          height: 13px;
          margin-bottom: 10px;
        }

        .skeleton-text {
          width: 65%;
          height: 9px;
          margin-bottom: 10px;
        }

        .skeleton-meta {
          width: 40%;
          height: 7px;
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
            transform: translateX(-5px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0
              rgba(200, 169, 110, 0.25);
          }

          50% {
            box-shadow: 0 0 0 5px
              rgba(200, 169, 110, 0);
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

        @media (max-width: 1100px) {
          .tasks-toolbar {
            align-items: stretch;
            flex-wrap: wrap;
          }

          .task-search {
            min-width: 100%;
          }

          .project-filter-select {
            width: auto;
            flex: 1;
          }
        }

        @media (max-width: 900px) {
          .tasks-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .completion-summary {
            width: 100%;
          }
        }

        @media (max-width: 650px) {
          .task-list {
            padding: 0 16px;
          }

          .task-list-header {
            padding: 18px;
          }

          .task-row {
            align-items: flex-start;
          }

          .task-status-wrapper {
            flex-direction: column;
          }

          .task-info > p {
            white-space: normal;
          }

          .task-meta {
            gap: 7px;
          }

          .task-meta span {
            width: 100%;
          }

          .task-filters {
            width: 100%;
            overflow-x: auto;
          }

          .task-filter {
            flex: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tasks-page,
          .task-stat,
          .create-task-card,
          .task-list-card,
          .task-row,
          .tasks-empty,
          .task-skeleton,
          .task-indicator,
          .skeleton {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </AppShell>
  );
}