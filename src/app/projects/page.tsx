'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';

import {
  createProject,
  listProjects,
  listTasks,
} from '@/lib/firestore';

import { db } from '@/lib/firebase';

import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import {
  UFAA_PHASES,
  UFAA_PROJECT,
  UFAA_PROJECT_NAME,
  UFAA_TASK_COUNT,
} from '@/lib/ufaaSeed';

import type { Project, Task } from '@/lib/types';

function normalizeStatus(status: string): Project['status'] {
  const value = status.toLowerCase().trim();

  if (value === 'active' || value === 'in progress') {
    return 'active';
  }

  if (value === 'completed' || value === 'complete') {
    return 'completed';
  }

  if (value === 'on-hold' || value === 'on hold') {
    return 'on-hold';
  }

  return 'planned';
}

function getProjectStatusClass(status: string) {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case 'active':
      return 'status-active';

    case 'completed':
      return 'status-completed';

    case 'on-hold':
      return 'status-on-hold';

    default:
      return 'status-planned';
  }
}

function getPriorityClass(priority: string) {
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'priority-critical';

    case 'high':
      return 'priority-high';

    case 'medium':
      return 'priority-medium';

    default:
      return 'priority-low';
  }
}

function getProgress(tasks: Task[], projectId: string) {
  const projectTasks = tasks.filter(
    (task) => task.projectId === projectId,
  );

  if (projectTasks.length === 0) {
    return 0;
  }

  const completed = projectTasks.filter(
    (task) => task.status === 'done',
  ).length;

  return Math.round(
    (completed / projectTasks.length) * 100,
  );
}

export default function Projects() {
  const { user, profile } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Software Project');
  const [priority, setPriority] =
    useState<Project['priority']>('medium');

  const [seedMessage, setSeedMessage] = useState('');

  async function load() {
    try {
      setLoading(true);

      const [projectData, taskData] = await Promise.all([
        listProjects(),
        listTasks(),
      ]);

      setProjects(projectData);
      setTasks(taskData);
    } catch (error) {
      console.error(
        'Failed to load projects:',
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!profile || !name.trim()) {
      return;
    }

    try {
      setBusy(true);

      await createProject({
        name: name.trim(),
        description: description.trim(),
        type,
        status: 'planned',
        priority,
        progress: 0,
        technologies: [],
        ownerId: profile.uid,
        ownerName: profile.name,
      });

      setName('');
      setDescription('');
      setType('Software Project');
      setPriority('medium');
      setOpen(false);

      await load();
    } catch (error) {
      console.error(
        'Failed to create project:',
        error,
      );
    } finally {
      setBusy(false);
    }
  }

  async function seedUfaaProject() {
    if (!user || !profile || !db) {
      setSeedMessage(
        'You must be logged in before seeding the project.',
      );
      return;
    }

    if (
      profile.role !== 'admin' &&
      profile.role !== 'developer'
    ) {
      setSeedMessage(
        'Only an admin or developer can seed this project.',
      );
      return;
    }

    const alreadyExists = projects.some(
      (project) =>
        project.name === UFAA_PROJECT_NAME,
    );

    if (alreadyExists) {
      setSeedMessage(
        'The UFAA Power BI project already exists in your projects.',
      );
      return;
    }

    try {
      setSeeding(true);
      setSeedMessage(
        'Preparing UFAA Power BI project...',
      );

      /*
       * 1 project + 98 tasks = 99 Firestore writes.
       *
       * Firestore supports up to 500 writes in one batch,
       * so everything can be committed atomically.
       */

      const batch = writeBatch(db);

      const projectRef = doc(
        collection(db, 'projects'),
      );

      batch.set(projectRef, {
        name: UFAA_PROJECT.name,
        client: UFAA_PROJECT.client,
        description: UFAA_PROJECT.description,
        type: UFAA_PROJECT.type,
        status: UFAA_PROJECT.status,
        priority: UFAA_PROJECT.priority,
        progress: 0,
        technologies: [
          ...UFAA_PROJECT.technologies,
        ],
        ownerId: user.uid,
        ownerName: profile.name,
        testerIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      let taskCount = 0;

      for (
        let phaseIndex = 0;
        phaseIndex < UFAA_PHASES.length;
        phaseIndex++
      ) {
        const phase = UFAA_PHASES[phaseIndex];

        for (
          let taskIndex = 0;
          taskIndex < phase.tasks.length;
          taskIndex++
        ) {
          const title =
            phase.tasks[taskIndex];

          const taskRef = doc(
            collection(db, 'tasks'),
          );

          batch.set(taskRef, {
            projectId: projectRef.id,
            phase: phase.name,
            phaseOrder: phaseIndex + 1,
            taskOrder: taskIndex + 1,
            title,
            name: title,
            description: title,
            status: 'todo',
            progress: 0,
            priority: 'high',
            assigneeId: user.uid,
            assigneeName: profile.name,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          taskCount++;

          setSeedMessage(
            `Preparing UFAA Power BI project... ${taskCount}/${UFAA_TASK_COUNT} tasks`,
          );
        }
      }

      setSeedMessage(
        `Saving ${UFAA_TASK_COUNT} tasks to Firebase...`,
      );

      await batch.commit();

      setSeedMessage(
        `UFAA Power BI project created successfully — ${UFAA_TASK_COUNT} tasks.`,
      );

      await load();
    } catch (error) {
      console.error(
        'UFAA seed failed:',
        error,
      );

      setSeedMessage(
        error instanceof Error
          ? `Seed failed: ${error.message}`
          : 'Seed failed. Check the browser console.',
      );
    } finally {
      setSeeding(false);
    }
  }

  const projectStats = useMemo(() => {
    const active = projects.filter(
      (project) =>
        normalizeStatus(project.status) ===
        'active',
    ).length;

    const completed = projects.filter(
      (project) =>
        normalizeStatus(project.status) ===
        'completed',
    ).length;

    const onHold = projects.filter(
      (project) =>
        normalizeStatus(project.status) ===
        'on-hold',
    ).length;

    return {
      total: projects.length,
      active,
      completed,
      onHold,
    };
  }, [projects]);

  return (
    <AppShell>
      <div className="projects-page">
        <header className="page-header">
          <div>
            <div className="eyebrow">
              WORKSPACE
            </div>

            <h1>Projects</h1>

            <p>
              Manage projects, track progress, and
              coordinate delivery.
            </p>
          </div>

          <div className="header-actions">
            {profile &&
              (profile.role === 'admin' ||
                profile.role === 'developer') && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={seedUfaaProject}
                  disabled={seeding}
                >
                  {seeding
                    ? 'Seeding UFAA...'
                    : 'Seed UFAA Power BI'}
                </button>
              )}

            <button
              type="button"
              className="primary-btn"
              onClick={() => setOpen(true)}
            >
              <span className="plus">+</span>
              New Project
            </button>
          </div>
        </header>

        {seedMessage && (
          <div className="seed-message">
            <div className="seed-message-content">
              <span className="seed-icon">
                {seeding ? '⏳' : '✓'}
              </span>

              <span>{seedMessage}</span>
            </div>

            {!seeding && (
              <button
                type="button"
                className="seed-close"
                onClick={() =>
                  setSeedMessage('')
                }
                aria-label="Dismiss"
              >
                ×
              </button>
            )}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">
              Total Projects
            </span>

            <strong>{projectStats.total}</strong>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              Active
            </span>

            <strong>
              {projectStats.active}
            </strong>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              Completed
            </span>

            <strong>
              {projectStats.completed}
            </strong>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              On Hold
            </span>

            <strong>
              {projectStats.onHold}
            </strong>
          </div>
        </section>

        <section className="projects-section">
          <div className="section-header">
            <div>
              <h2>Your Projects</h2>
              <span>
                {projects.length}{' '}
                {projects.length === 1
                  ? 'project'
                  : 'projects'}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                ◫
              </div>

              <h3>No projects yet</h3>

              <p>
                Create your first project to start
                tracking work.
              </p>

              <button
                type="button"
                className="primary-btn"
                onClick={() => setOpen(true)}
              >
                <span className="plus">+</span>
                New Project
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => {
                const progress =
                  getProgress(
                    tasks,
                    project.id,
                  );

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="project-card"
                  >
                    <div className="project-card-top">
                      <div className="project-icon">
                        {project.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="project-card-actions">
                        <span
                          className={`status-pill ${getProjectStatusClass(
                            project.status,
                          )}`}
                        >
                          {normalizeStatus(
                            project.status,
                          )
                            .replace(
                              '-',
                              ' ',
                            )
                            .replace(
                              /^\w/,
                              (c) =>
                                c.toUpperCase(),
                            )}
                        </span>
                      </div>
                    </div>

                    <div className="project-content">
                      <h3>
                        {project.name}
                      </h3>

                      {project.client && (
                        <div className="client">
                          {project.client}
                        </div>
                      )}

                      <p>
                        {project.description ||
                          'No project description provided.'}
                      </p>

                      <div className="project-meta">
                        <span
                          className={`priority ${getPriorityClass(
                            project.priority,
                          )}`}
                        >
                          {project.priority}
                        </span>

                        {project.type && (
                          <span className="type">
                            {project.type}
                          </span>
                        )}
                      </div>

                      <div className="progress-section">
                        <div className="progress-header">
                          <span>
                            Progress
                          </span>

                          <strong>
                            {progress}%
                          </strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="project-footer">
                        <span>
                          {tasks.filter(
                            (task) =>
                              task.projectId ===
                              project.id,
                          ).length}{' '}
                          tasks
                        </span>

                        <span>
                          View project →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {open && (
          <div
            className="modal-backdrop"
            onClick={() => setOpen(false)}
          >
            <div
              className="modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <div className="eyebrow">
                    PROJECT
                  </div>

                  <h2>
                    Create New Project
                  </h2>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setOpen(false)
                  }
                >
                  ×
                </button>
              </div>

              <form onSubmit={save}>
                <div className="form-group">
                  <label htmlFor="project-name">
                    Project Name
                  </label>

                  <input
                    id="project-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="project-description">
                    Description
                  </label>

                  <textarea
                    id="project-description"
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    placeholder="Describe the project"
                    rows={4}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="project-type">
                      Project Type
                    </label>

                    <select
                      id="project-type"
                      value={type}
                      onChange={(event) =>
                        setType(
                          event.target.value,
                        )
                      }
                    >
                      <option>
                        Software Project
                      </option>

                      <option>
                        Data / BI Project
                      </option>

                      <option>
                        Mobile App
                      </option>

                      <option>
                        Web Application
                      </option>

                      <option>
                        Infrastructure
                      </option>

                      <option>
                        Other
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="project-priority">
                      Priority
                    </label>

                    <select
                      id="project-priority"
                      value={priority}
                      onChange={(event) =>
                        setPriority(
                          event.target
                            .value as Project['priority'],
                        )
                      }
                    >
                      <option value="low">
                        Low
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="high">
                        High
                      </option>

                      <option value="critical">
                        Critical
                      </option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() =>
                      setOpen(false)
                    }
                    disabled={busy}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={
                      busy || !name.trim()
                    }
                  >
                    {busy
                      ? 'Creating...'
                      : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .projects-page {
          padding: 32px;
          max-width: 1440px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #8a8278;
          margin-bottom: 7px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.15;
          color: #1a1a1a;
          font-weight: 700;
        }

        .page-header p {
          margin: 8px 0 0;
          color: #77716a;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        button {
          font-family: inherit;
        }

        .primary-btn,
        .secondary-btn {
          border: 0;
          border-radius: 9px;
          padding: 11px 17px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .primary-btn {
          background: #1a1a1a;
          color: #fff;
        }

        .secondary-btn {
          background: #f5f0e8;
          color: #1a1a1a;
          border: 1px solid #e4ddd2;
        }

        .primary-btn:hover:not(:disabled),
        .secondary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .primary-btn:disabled,
        .secondary-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .plus {
          font-size: 18px;
          margin-right: 5px;
          vertical-align: -1px;
        }

        .seed-message {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          padding: 13px 16px;
          border: 1px solid #e4ddd2;
          border-radius: 10px;
          background: #f5f0e8;
          color: #4f4a44;
          font-size: 13px;
        }

        .seed-message-content {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .seed-icon {
          font-size: 15px;
        }

        .seed-close {
          border: 0;
          background: transparent;
          color: #77716a;
          font-size: 20px;
          cursor: pointer;
          line-height: 1;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #ebe6df;
          border-radius: 12px;
          padding: 18px 20px;
        }

        .stat-label {
          display: block;
          color: #817a72;
          font-size: 12px;
          margin-bottom: 7px;
        }

        .stat-card strong {
          display: block;
          color: #1a1a1a;
          font-size: 26px;
          line-height: 1;
        }

        .projects-section {
          margin-top: 8px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .section-header h2 {
          margin: 0 0 4px;
          color: #1a1a1a;
          font-size: 20px;
        }

        .section-header span {
          color: #8a8278;
          font-size: 12px;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(
            3,
            minmax(0, 1fr)
          );
          gap: 18px;
        }

        .project-card {
          display: block;
          text-decoration: none;
          color: inherit;
          background: #fff;
          border: 1px solid #ebe6df;
          border-radius: 14px;
          overflow: hidden;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .project-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(
            30,
            25,
            20,
            0.07
          );
          border-color: #ddd4c8;
        }

        .project-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 18px 0;
        }

        .project-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #f5f0e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 700;
          color: #5f5549;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 700;
        }

        .status-active {
          background: #e9f5ed;
          color: #2f6f45;
        }

        .status-completed {
          background: #eaf0f8;
          color: #496580;
        }

        .status-on-hold {
          background: #f8f0df;
          color: #856c38;
        }

        .status-planned {
          background: #f1efed;
          color: #6d6761;
        }

        .project-content {
          padding: 17px 18px 18px;
        }

        .project-content h3 {
          margin: 0;
          color: #1a1a1a;
          font-size: 17px;
          line-height: 1.35;
        }

        .client {
          margin-top: 5px;
          color: #9a9188;
          font-size: 11px;
          font-weight: 600;
        }

        .project-content > p {
          margin: 10px 0 14px;
          color: #77716a;
          font-size: 13px;
          line-height: 1.55;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .project-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 17px;
        }

        .priority,
        .type {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 10px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .priority-high {
          background: #f7ebe5;
          color: #92563e;
        }

        .priority-medium {
          background: #f5f0e8;
          color: #806b51;
        }

        .priority-low {
          background: #eef1ed;
          color: #647363;
        }

        .priority-critical {
          background: #f3e4e4;
          color: #963f3f;
        }

        .type {
          background: #f4f2ef;
          color: #756f68;
        }

        .progress-section {
          margin-top: 4px;
        }

        .progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 7px;
          color: #8a8278;
          font-size: 11px;
        }

        .progress-header strong {
          color: #514b45;
        }

        .progress-track {
          height: 6px;
          border-radius: 999px;
          background: #eeeae5;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: #c8a96e;
          transition: width 0.25s ease;
        }

        .project-footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 17px;
          padding-top: 13px;
          border-top: 1px solid #f0ece7;
          color: #8a8278;
          font-size: 11px;
        }

        .project-footer span:last-child {
          color: #514b45;
          font-weight: 700;
        }

        .empty-state {
          min-height: 330px;
          border: 1px dashed #ddd6ce;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
        }

        .empty-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #f5f0e8;
          color: #756a5d;
          font-size: 23px;
          margin-bottom: 14px;
        }

        .empty-state h3 {
          margin: 0;
          color: #1a1a1a;
          font-size: 17px;
        }

        .empty-state p {
          margin: 7px 0 18px;
          color: #817a72;
          font-size: 13px;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e7e1d9;
          border-top-color: #756a5d;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 13px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(20, 18, 16, 0.48);
        }

        .modal {
          width: min(560px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 25px 70px rgba(
            0,
            0,
            0,
            0.18
          );
          padding: 24px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 21px;
          color: #1a1a1a;
        }

        .modal-close {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: #f4f1ed;
          color: #5d5751;
          font-size: 22px;
          cursor: pointer;
        }

        .form-group {
          margin-bottom: 17px;
        }

        .form-group label {
          display: block;
          margin-bottom: 7px;
          color: #4d4842;
          font-size: 12px;
          font-weight: 700;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #ded8d0;
          border-radius: 9px;
          background: #fff;
          color: #1a1a1a;
          font-family: inherit;
          font-size: 13px;
          padding: 11px 12px;
          outline: none;
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          border-color: #b9a98f;
          box-shadow: 0 0 0 3px
            rgba(200, 169, 110, 0.12);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 23px;
          padding-top: 18px;
          border-top: 1px solid #eee9e3;
        }

        .cancel-btn {
          border: 1px solid #ded8d0;
          border-radius: 9px;
          background: #fff;
          color: #5e5851;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 1100px) {
          .projects-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
          }
        }

        @media (max-width: 800px) {
          .projects-page {
            padding: 22px 16px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .projects-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .header-actions {
            width: 100%;
          }

          .header-actions button {
            flex: 1;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </AppShell>
  );
}