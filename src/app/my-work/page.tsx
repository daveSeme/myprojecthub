'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import { listTasks } from '@/lib/firestore';
import { useAuth } from '@/components/AuthProvider';
import type { Task } from '@/lib/types';

type Filter = 'all' | 'todo' | 'in_progress' | 'done';

function getPriorityClass(priority?: string) {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'priority-high';
    case 'low':
      return 'priority-low';
    default:
      return 'priority-medium';
  }
}

function getStatusClass(status?: string) {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'completed':
      return 'status-done';
    case 'in_progress':
    case 'in progress':
      return 'status-progress';
    default:
      return 'status-todo';
  }
}

function formatStatus(status?: string) {
  if (!status) return 'To do';

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPriority(priority?: string) {
  if (!priority) return 'Medium';

  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function TaskSkeleton() {
  return (
    <div className="mywork-skeleton">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-text" />
      <div className="skeleton-line skeleton-short" />
    </div>
  );
}

export default function MyWork() {
  const { profile } = useAuth();

  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    async function load() {
      try {
        const tasks = await listTasks();
        setItems(tasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const mine = useMemo(() => {
    return items.filter((task) => task.assigneeId === profile?.uid);
  }, [items, profile?.uid]);

  const counts = useMemo(() => {
    return {
      total: mine.length,
      todo: mine.filter(
        (task) =>
          task.status?.toLowerCase() === 'todo' ||
          task.status?.toLowerCase() === 'open'
      ).length,
      progress: mine.filter((task) => {
        const status = task.status?.toLowerCase();

        return status === 'in_progress' || status === 'in progress';
      }).length,
      done: mine.filter((task) => {
        const status = task.status?.toLowerCase();

        return status === 'done' || status === 'completed';
      }).length,
    };
  }, [mine]);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return mine;

    return mine.filter((task) => {
      const status = task.status?.toLowerCase();

      if (filter === 'todo') {
        return status === 'todo' || status === 'open';
      }

      if (filter === 'in_progress') {
        return status === 'in_progress' || status === 'in progress';
      }

      if (filter === 'done') {
        return status === 'done' || status === 'completed';
      }

      return true;
    });
  }, [mine, filter]);

  const completionRate =
    counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

  return (
    <AppShell>
      <div className="mywork-page">
        {/* Header */}
        <div className="mywork-header">
          <div>
            <div className="page-eyebrow">
              <i className="bi bi-person-workspace" />
              PERSONAL WORKSPACE
            </div>

            <h2>My Work</h2>

            <p className="muted">
              Your assigned tasks across every project.
            </p>
          </div>

          <div className="mywork-completion">
            <div className="completion-ring">
              <svg viewBox="0 0 42 42">
                <circle
                  className="completion-track"
                  cx="21"
                  cy="21"
                  r="16"
                />
                <circle
                  className="completion-value"
                  cx="21"
                  cy="21"
                  r="16"
                  strokeDasharray={`${completionRate} ${100 - completionRate}`}
                />
              </svg>

              <span>{completionRate}%</span>
            </div>

            <div>
              <strong>Completion</strong>
              <small className="muted d-block">
                {counts.done} of {counts.total} completed
              </small>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-xl-3">
            <div className="mywork-stat cardx">
              <div className="stat-icon">
                <i className="bi bi-list-check" />
              </div>

              <div>
                <span className="stat-label">Total tasks</span>
                <strong className="stat-number">{counts.total}</strong>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="mywork-stat cardx">
              <div className="stat-icon">
                <i className="bi bi-circle" />
              </div>

              <div>
                <span className="stat-label">To do</span>
                <strong className="stat-number">{counts.todo}</strong>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="mywork-stat cardx">
              <div className="stat-icon">
                <i className="bi bi-arrow-repeat" />
              </div>

              <div>
                <span className="stat-label">In progress</span>
                <strong className="stat-number">{counts.progress}</strong>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="mywork-stat cardx">
              <div className="stat-icon">
                <i className="bi bi-check2-circle" />
              </div>

              <div>
                <span className="stat-label">Completed</span>
                <strong className="stat-number">{counts.done}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="cardx mywork-card">
          <div className="mywork-toolbar">
            <div>
              <h5 className="mb-1">Assigned tasks</h5>
              <p className="muted mb-0">
                Tasks currently assigned to you.
              </p>
            </div>

            <div className="mywork-filters" role="group">
              <button
                type="button"
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
                title="Show all assigned tasks"
                data-bs-toggle="tooltip"
              >
                All
                <span>{counts.total}</span>
              </button>

              <button
                type="button"
                className={`filter-btn ${filter === 'todo' ? 'active' : ''}`}
                onClick={() => setFilter('todo')}
                title="Show tasks that have not started"
                data-bs-toggle="tooltip"
              >
                To do
                <span>{counts.todo}</span>
              </button>

              <button
                type="button"
                className={`filter-btn ${
                  filter === 'in_progress' ? 'active' : ''
                }`}
                onClick={() => setFilter('in_progress')}
                title="Show tasks currently in progress"
                data-bs-toggle="tooltip"
              >
                In progress
                <span>{counts.progress}</span>
              </button>

              <button
                type="button"
                className={`filter-btn ${
                  filter === 'done' ? 'active' : ''
                }`}
                onClick={() => setFilter('done')}
                title="Show completed tasks"
                data-bs-toggle="tooltip"
              >
                Done
                <span>{counts.done}</span>
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="mywork-list">
              <TaskSkeleton />
              <TaskSkeleton />
              <TaskSkeleton />
              <TaskSkeleton />
            </div>
          )}

          {/* Tasks */}
          {!loading && filteredTasks.length > 0 && (
            <div className="mywork-list">
              {filteredTasks.map((task, index) => (
                <div
                  className="mywork-task"
                  key={task.id}
                  style={{
                    animationDelay: `${index * 55}ms`,
                  }}
                >
                  <div className="task-main">
                    <div
                      className={`task-status-dot ${getStatusClass(
                        task.status
                      )}`}
                    />

                    <div className="task-content">
                      <div className="task-title-row">
                        <strong>{task.title}</strong>

                        <span
                          className={`task-priority ${getPriorityClass(
                            task.priority
                          )}`}
                        >
                          <i className="bi bi-flag-fill" />
                          {formatPriority(task.priority)}
                        </span>
                      </div>

                      {task.description && (
                        <p className="muted task-description">
                          {task.description}
                        </p>
                      )}

                      <div className="task-meta">
                        <span>
                          <i className="bi bi-folder2-open" />
                          {task.projectName || 'Unassigned project'}
                        </span>

                        <span
                          className={`task-status ${getStatusClass(
                            task.status
                          )}`}
                        >
                          <i className="bi bi-circle-fill" />
                          {formatStatus(task.status)}
                        </span>

                        {task.dueDate && (
                          <span>
                            <i className="bi bi-calendar3" />
                            Due {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="task-action">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Task actions"
                      data-bs-toggle="tooltip"
                      aria-label={`Actions for ${task.title}`}
                    >
                      <i className="bi bi-three-dots" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filteredTasks.length === 0 && (
            <div className="mywork-empty">
              <div className="empty-icon">
                <i className="bi bi-check2-square" />
              </div>

              <h5>
                {mine.length === 0
                  ? 'No tasks assigned'
                  : 'No tasks in this view'}
              </h5>

              <p className="muted mb-0">
                {mine.length === 0
                  ? 'Tasks assigned to you will appear here.'
                  : 'Try selecting another task status above.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .mywork-page {
          animation: fadeUp 0.45s ease both;
        }

        .mywork-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .page-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #8a8a8a;
        }

        .page-eyebrow i {
          font-size: 13px;
        }

        .mywork-header h2 {
          margin: 0;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .mywork-header p {
          margin-top: 7px;
          margin-bottom: 0;
        }

        .mywork-completion {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.72);
        }

        .completion-ring {
          position: relative;
          width: 48px;
          height: 48px;
        }

        .completion-ring svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .completion-ring circle {
          fill: none;
          stroke-width: 3;
        }

        .completion-track {
          stroke: #eceae5;
        }

        .completion-value {
          stroke: #c8a96e;
          stroke-linecap: round;
          transition: stroke-dasharray 0.8s ease;
        }

        .completion-ring span {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 700;
        }

        .mywork-completion strong {
          font-size: 13px;
        }

        .mywork-completion small {
          font-size: 11px;
          margin-top: 2px;
        }

        .mywork-stat {
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: 92px;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
          animation: cardIn 0.5s ease both;
        }

        .mywork-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #f5f0e8;
          color: #9b7b42;
          font-size: 18px;
        }

        .stat-label {
          display: block;
          color: #858585;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .stat-number {
          display: block;
          font-size: 23px;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .mywork-card {
          overflow: hidden;
          padding: 0;
          animation: cardIn 0.55s ease both;
        }

        .mywork-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 22px 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .mywork-toolbar h5 {
          font-weight: 650;
        }

        .mywork-toolbar p {
          font-size: 12px;
        }

        .mywork-filters {
          display: flex;
          gap: 4px;
          padding: 4px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 10px;
          background: #faf9f6;
        }

        .filter-btn {
          border: 0;
          background: transparent;
          color: #777;
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 600;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .filter-btn:hover {
          color: #222;
          transform: translateY(-1px);
        }

        .filter-btn.active {
          color: #222;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .filter-btn span {
          margin-left: 5px;
          color: #999;
          font-size: 10px;
        }

        .mywork-list {
          padding: 0 24px;
        }

        .mywork-task {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 20px 4px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.055);
          animation: taskIn 0.45s ease both;
          transition:
            padding 0.2s ease,
            background 0.2s ease;
        }

        .mywork-task:last-child {
          border-bottom: 0;
        }

        .mywork-task:hover {
          padding-left: 9px;
          padding-right: 9px;
          background: rgba(245, 240, 232, 0.28);
        }

        .task-main {
          min-width: 0;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .task-status-dot {
          width: 9px;
          height: 9px;
          flex: 0 0 9px;
          margin-top: 6px;
          border-radius: 50%;
        }

        .status-todo {
          background: #b7b7b7;
        }

        .status-progress {
          background: #c8a96e;
          animation: statusPulse 2s infinite;
        }

        .status-done {
          background: #6f8f73;
        }

        .task-content {
          min-width: 0;
        }

        .task-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .task-title-row strong {
          font-size: 14px;
          color: #242424;
        }

        .task-description {
          max-width: 720px;
          margin: 5px 0 9px;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .task-priority {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 7px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 650;
        }

        .priority-high {
          color: #8b5f58;
          background: #f5e9e6;
        }

        .priority-medium {
          color: #8c7040;
          background: #f6f0e3;
        }

        .priority-low {
          color: #667a6a;
          background: #eaf0eb;
        }

        .task-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 13px;
          color: #898989;
          font-size: 11px;
        }

        .task-meta span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .task-meta i {
          font-size: 10px;
        }

        .task-status {
          font-weight: 600;
        }

        .task-status.status-progress {
          color: #9b7b42;
          background: transparent;
          animation: none;
        }

        .task-status.status-done {
          color: #6f8f73;
          background: transparent;
        }

        .task-action {
          flex: 0 0 auto;
        }

        .icon-btn {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 9px;
          background: #fff;
          color: #777;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .icon-btn:hover {
          background: #f5f0e8;
          color: #222;
          transform: translateY(-1px);
        }

        .mywork-empty {
          padding: 70px 20px;
          text-align: center;
          animation: fadeUp 0.45s ease both;
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

        .mywork-empty h5 {
          margin-bottom: 6px;
        }

        .mywork-empty p {
          font-size: 13px;
        }

        .mywork-skeleton {
          padding: 20px 4px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.055);
        }

        .skeleton-line {
          height: 10px;
          margin-bottom: 9px;
          border-radius: 5px;
          background: linear-gradient(
            90deg,
            #f1f0ed,
            #faf9f6,
            #f1f0ed
          );
          background-size: 200% 100%;
          animation: skeleton 1.5s infinite;
        }

        .skeleton-title {
          width: 32%;
          height: 13px;
        }

        .skeleton-text {
          width: 60%;
        }

        .skeleton-short {
          width: 25%;
          margin-bottom: 0;
        }

        @keyframes fadeUp {
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

        @keyframes taskIn {
          from {
            opacity: 0;
            transform: translateX(-5px);
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

        @keyframes statusPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(200, 169, 110, 0.25);
          }

          50% {
            box-shadow: 0 0 0 5px rgba(200, 169, 110, 0);
          }
        }

        @media (max-width: 900px) {
          .mywork-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .mywork-completion {
            width: 100%;
          }

          .mywork-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .mywork-filters {
            width: 100%;
            overflow-x: auto;
          }

          .filter-btn {
            flex: 1;
            white-space: nowrap;
          }
        }

        @media (max-width: 576px) {
          .mywork-toolbar {
            padding: 18px;
          }

          .mywork-list {
            padding: 0 16px;
          }

          .mywork-task {
            align-items: flex-start;
          }

          .task-description {
            white-space: normal;
          }

          .task-meta {
            gap: 8px;
          }

          .task-meta span {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mywork-page,
          .mywork-stat,
          .mywork-card,
          .mywork-task,
          .mywork-empty,
          .mywork-skeleton,
          .completion-value {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </AppShell>
  );
}