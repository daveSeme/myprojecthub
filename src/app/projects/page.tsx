'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import AppShell from '@/components/AppShell';
import {
  createProject,
  listProjects,
  listTasks,
} from '@/lib/firestore';
import { useAuth } from '@/components/AuthProvider';

import type { Project, Task } from '@/lib/types';

function normalizeStatus(status?: string) {
  return status?.toLowerCase().replace(/[\s_]+/g, '-') || 'planned';
}

function getProjectStatusClass(status?: string) {
  switch (normalizeStatus(status)) {
    case 'active':
      return 'project-active';

    case 'completed':
      return 'project-completed';

    case 'on-hold':
      return 'project-hold';

    default:
      return 'project-planned';
  }
}

function getProgress(tasks: Task[]) {
  if (!tasks.length) return 0;

  const completed = tasks.filter(
    (task) => normalizeStatus(task.status) === 'done'
  ).length;

  return Math.round((completed / tasks.length) * 100);
}

function ProjectSkeleton() {
  return (
    <div className="project-skeleton">
      <div className="skeleton skeleton-small" />
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-progress" />
    </div>
  );
}

export default function Projects() {
  const { profile } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Software Project');
  const [priority, setPriority] =
    useState<Project['priority']>('medium');

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
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!profile || !name.trim()) return;

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
      console.error('Failed to create project:', error);
    } finally {
      setBusy(false);
    }
  }

  const projectStats = useMemo(() => {
    const active = projects.filter(
      (project) =>
        normalizeStatus(project.status) === 'active'
    ).length;

    const planned = projects.filter(
      (project) =>
        normalizeStatus(project.status) === 'planned'
    ).length;

    const completed = projects.filter(
      (project) =>
        normalizeStatus(project.status) === 'completed'
    ).length;

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
      (task) =>
        normalizeStatus(task.status) === 'done'
    ).length;

    const overallProgress =
      totalTasks > 0
        ? Math.round(
            (completedTasks / totalTasks) * 100
          )
        : 0;

    return {
      total: projects.length,
      active,
      planned,
      completed,
      totalTasks,
      completedTasks,
      overallProgress,
    };
  }, [projects, tasks]);

  function getTasksForProject(projectId: string) {
    return tasks.filter(
      (task) => task.projectId === projectId
    );
  }

  return (
    <AppShell>
      <div className="projects-page">

        {/* HEADER */}
        <div className="projects-header">
          <div>
            <div className="page-eyebrow">
              <i className="bi bi-kanban" />
              PROJECT MANAGEMENT
            </div>

            <h2>Projects</h2>

            <p className="muted mb-0">
              Manage projects, monitor delivery progress,
              and follow each roadmap from one workspace.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-gold create-project-button"
            onClick={() => setOpen(true)}
          >
            <i className="bi bi-plus-lg me-2" />
            New project
          </button>
        </div>

        {/* SUMMARY */}
        <div className="row g-3 mb-4">

          <div className="col-6 col-xl-3">
            <div className="cardx project-stat">
              <div className="stat-icon">
                <i className="bi bi-kanban" />
              </div>

              <div>
                <span>Total projects</span>
                <strong>{projectStats.total}</strong>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="cardx project-stat">
              <div className="stat-icon active">
                <i className="bi bi-lightning-charge" />
              </div>

              <div>
                <span>Active</span>
                <strong>{projectStats.active}</strong>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="cardx project-stat">
              <div className="stat-icon planned">
                <i className="bi bi-clock" />
              </div>

              <div>
                <span>Planned</span>
                <strong>{projectStats.planned}</strong>
              </div>
            </div>
          </div>

          <div className="col-6 col-xl-3">
            <div className="cardx project-stat">
              <div className="stat-icon completed">
                <i className="bi bi-check2-circle" />
              </div>

              <div>
                <span>Completed</span>
                <strong>{projectStats.completed}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* WORKSPACE SUMMARY */}
        <div className="cardx workspace-summary mb-4">

          <div className="workspace-summary-left">

            <div className="workspace-summary-icon">
              <i className="bi bi-graph-up-arrow" />
            </div>

            <div>
              <h5>Workspace progress</h5>

              <p className="muted mb-0">
                Completion is calculated from the actual
                project tasks.
              </p>
            </div>

          </div>

          <div className="workspace-progress">

            <div className="workspace-progress-top">
              <span>
                {projectStats.completedTasks} of{' '}
                {projectStats.totalTasks} tasks completed
              </span>

              <strong>
                {projectStats.overallProgress}%
              </strong>
            </div>

            <div className="progress workspace-progress-bar">
              <div
                className="progress-bar"
                style={{
                  width: `${projectStats.overallProgress}%`,
                }}
              />
            </div>

          </div>

        </div>

        {/* CREATE PROJECT */}
        {open && (
          <div className="cardx create-project-card mb-4">

            <div className="create-project-heading">

              <div className="create-project-icon">
                <i className="bi bi-folder-plus" />
              </div>

              <div>
                <h5>Create project</h5>

                <p className="muted mb-0">
                  Set up the project workspace before
                  adding tasks and roadmap phases.
                </p>
              </div>

            </div>

            <form
              onSubmit={save}
              className="row g-3 mt-2"
            >

              <div className="col-lg-6">
                <label className="form-label">
                  Project name
                </label>

                <input
                  className="form-control"
                  placeholder="e.g. DressMe AI"
                  required
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />
              </div>

              <div className="col-lg-3">
                <label className="form-label">
                  Project type
                </label>

                <select
                  className="form-select"
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value)
                  }
                >
                  <option>Software Project</option>
                  <option>Data / BI Project</option>
                  <option>Client Project</option>
                  <option>Startup Project</option>
                  <option>Freelance Project</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="col-lg-3">
                <label className="form-label">
                  Priority
                </label>

                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) =>
                    setPriority(
                      e.target.value as Project['priority']
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

              <div className="col-12">
                <label className="form-label">
                  Description
                </label>

                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Explain the project scope, objective, or expected outcome..."
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                />
              </div>

              <div className="col-12">

                <button
                  type="submit"
                  className="btn btn-dark me-2"
                  disabled={busy}
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
                      Create project
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>

              </div>

            </form>
          </div>
        )}

        {/* PROJECTS */}
        <div className="projects-section">

          <div className="section-heading">

            <div>
              <h5>Your projects</h5>

              <p className="muted mb-0">
                Open a project to view its roadmap,
                tasks, and delivery progress.
              </p>
            </div>

            <span className="project-count">
              {projects.length}{' '}
              {projects.length === 1
                ? 'project'
                : 'projects'}
            </span>

          </div>

          {/* LOADING */}
          {loading && (
            <div className="row g-3">

              <div className="col-md-6 col-xl-4">
                <ProjectSkeleton />
              </div>

              <div className="col-md-6 col-xl-4">
                <ProjectSkeleton />
              </div>

              <div className="col-md-6 col-xl-4">
                <ProjectSkeleton />
              </div>

            </div>
          )}

          {/* PROJECT CARDS */}
          {!loading && projects.length > 0 && (
            <div className="row g-3">

              {projects.map((project, index) => {

                const projectTasks =
                  getTasksForProject(project.id);

                const progress =
                  getProgress(projectTasks);

                const completedTasks =
                  projectTasks.filter(
                    (task) =>
                      normalizeStatus(task.status) ===
                      'done'
                  ).length;

                const inProgressTasks =
                  projectTasks.filter(
                    (task) =>
                      normalizeStatus(task.status) ===
                      'in-progress'
                  ).length;

                return (
                  <div
                    className="col-md-6 col-xl-4"
                    key={project.id}
                  >

                    <Link
                      href={`/projects/${project.id}`}
                      className="project-card-link"
                      title={`Open ${project.name}`}
                      data-bs-toggle="tooltip"
                    >

                      <div
                        className="cardx project-card"
                        style={{
                          animationDelay: `${index * 55}ms`,
                        }}
                      >

                        {/* CARD TOP */}
                        <div className="project-card-top">

                          <div className="project-type">

                            <div className="project-folder">
                              <i className="bi bi-folder2-open" />
                            </div>

                            <span>
                              {project.type}
                            </span>

                          </div>

                          <div
                            className={`project-status ${getProjectStatusClass(
                              project.status
                            )}`}
                          >
                            <span />

                            {project.status
                              .replace('-', ' ')
                              .replace(/\b\w/g, (char) =>
                                char.toUpperCase()
                              )}
                          </div>

                        </div>

                        {/* TITLE */}
                        <div className="project-card-title">

                          <h5>{project.name}</h5>

                          <span
                            className="project-open-icon"
                            title="Open project"
                            data-bs-toggle="tooltip"
                          >
                            <i className="bi bi-arrow-up-right" />
                          </span>

                        </div>

                        {/* DESCRIPTION */}
                        <p className="project-description">
                          {project.description ||
                            'No project description yet.'}
                        </p>

                        {/* PROGRESS */}
                        <div className="project-progress">

                          <div className="project-progress-top">

                            <span>
                              Project completion
                            </span>

                            <strong>
                              {progress}%
                            </strong>

                          </div>

                          <div className="progress">
                            <div
                              className="progress-bar"
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>

                        </div>

                        {/* TASK SUMMARY */}
                        <div className="project-task-summary">

                          <div>
                            <i className="bi bi-list-check" />

                            <span>
                              {projectTasks.length}{' '}
                              {projectTasks.length === 1
                                ? 'task'
                                : 'tasks'}
                            </span>
                          </div>

                          <div>
                            <i className="bi bi-check2" />

                            <span>
                              {completedTasks} done
                            </span>
                          </div>

                          <div>
                            <i className="bi bi-arrow-repeat" />

                            <span>
                              {inProgressTasks} active
                            </span>
                          </div>

                        </div>

                        {/* FOOTER */}
                        <div className="project-card-footer">

                          <div className="project-owner">

                            <div className="owner-avatar">
                              {project.ownerName
                                ?.charAt(0)
                                .toUpperCase() || (
                                <i className="bi bi-person" />
                              )}
                            </div>

                            <span>
                              {project.ownerName ||
                                'Project owner'}
                            </span>

                          </div>

                          <div className="project-priority">

                            <i className="bi bi-flag" />

                            <span className="text-capitalize">
                              {project.priority}
                            </span>

                          </div>

                        </div>

                      </div>

                    </Link>

                  </div>
                );
              })}

            </div>
          )}

          {/* EMPTY */}
          {!loading && projects.length === 0 && (
            <div className="cardx projects-empty">

              <div className="empty-icon">
                <i className="bi bi-folder2-open" />
              </div>

              <h5>No projects yet</h5>

              <p className="muted">
                Create your first project to start
                building its roadmap and tracking work.
              </p>

              <button
                type="button"
                className="btn btn-dark"
                onClick={() => setOpen(true)}
              >
                <i className="bi bi-plus-lg me-2" />
                Create first project
              </button>

            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .projects-page {
          animation: pageIn 0.45s ease both;
        }

        .projects-header {
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
          margin-bottom: 8px;
          color: #8b8b8b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .projects-header h2 {
          margin: 0;
          font-weight: 700;
          letter-spacing: -0.035em;
        }

        .projects-header p {
          margin-top: 7px;
          max-width: 650px;
          font-size: 13px;
        }

        .create-project-button {
          flex: 0 0 auto;
        }

        .project-stat {
          min-height: 92px;
          display: flex;
          align-items: center;
          gap: 14px;
          animation: cardIn 0.45s ease both;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .project-stat:hover {
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

        .stat-icon.active {
          background: #f6f0e4;
          color: #9b7b42;
        }

        .stat-icon.planned {
          background: #f1f1ef;
          color: #777;
        }

        .stat-icon.completed {
          background: #eaf0eb;
          color: #68816d;
        }

        .project-stat span {
          display: block;
          color: #888;
          font-size: 11px;
          margin-bottom: 3px;
        }

        .project-stat strong {
          display: block;
          font-size: 24px;
          line-height: 1;
        }

        .workspace-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          animation: cardIn 0.5s ease both;
        }

        .workspace-summary-left {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 230px;
        }

        .workspace-summary-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #f5f0e8;
          color: #9b7b42;
        }

        .workspace-summary h5 {
          margin: 0;
          font-weight: 650;
        }

        .workspace-summary p {
          margin-top: 3px;
          font-size: 10px;
        }

        .workspace-progress {
          flex: 1;
          max-width: 520px;
        }

        .workspace-progress-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 7px;
          color: #888;
          font-size: 10px;
        }

        .workspace-progress-top strong {
          color: #9b7b42;
          font-size: 13px;
        }

        .workspace-progress-bar {
          height: 7px;
          overflow: hidden;
          border-radius: 10px;
          background: #efeeeb;
        }

        .workspace-progress-bar .progress-bar {
          background: #c8a96e;
          border-radius: inherit;
          transition: width 0.8s ease;
        }

        .create-project-card {
          animation: panelIn 0.35s ease both;
        }

        .create-project-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .create-project-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #f5f0e8;
          color: #9b7b42;
        }

        .create-project-heading h5 {
          margin: 0;
          font-weight: 650;
        }

        .create-project-heading p {
          margin-top: 3px;
          font-size: 11px;
        }

        .form-label {
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 650;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 15px;
        }

        .section-heading h5 {
          margin: 0;
          font-weight: 650;
        }

        .section-heading p {
          margin-top: 3px;
          font-size: 10px;
        }

        .project-count {
          color: #999;
          font-size: 10px;
          white-space: nowrap;
        }

        .project-card-link {
          display: block;
          height: 100%;
          color: inherit;
          text-decoration: none;
        }

        .project-card {
          height: 100%;
          min-height: 305px;
          display: flex;
          flex-direction: column;
          padding: 20px;
          animation: projectIn 0.45s ease both;
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.075);
          border-color: rgba(200, 169, 110, 0.3);
        }

        .project-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 18px;
        }

        .project-type {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #898989;
          font-size: 9px;
          font-weight: 600;
        }

        .project-folder {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #f5f0e8;
          color: #9b7b42;
          font-size: 13px;
        }

        .project-status {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 7px;
          border-radius: 6px;
          font-size: 8px;
          font-weight: 650;
          text-transform: capitalize;
        }

        .project-status > span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .project-planned {
          background: #f1f1ef;
          color: #777;
        }

        .project-planned > span {
          background: #999;
        }

        .project-active {
          background: #f6f0e4;
          color: #8d7344;
        }

        .project-active > span {
          background: #c8a96e;
          animation: pulse 2s infinite;
        }

        .project-hold {
          background: #f5e8e5;
          color: #8c625b;
        }

        .project-hold > span {
          background: #9a6d65;
        }

        .project-completed {
          background: #eaf0eb;
          color: #66806c;
        }

        .project-completed > span {
          background: #718875;
        }

        .project-card-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .project-card-title h5 {
          margin: 0;
          color: #252525;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        .project-open-icon {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 8px;
          color: #888;
          background: #fff;
          transition: all 0.2s ease;
        }

        .project-card:hover .project-open-icon {
          background: #f5f0e8;
          color: #9b7b42;
          transform: translate(1px, -1px);
        }

        .project-description {
          min-height: 34px;
          margin: 8px 0 20px;
          color: #8b8b8b;
          font-size: 10px;
          line-height: 1.65;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .project-progress {
          margin-bottom: 17px;
        }

        .project-progress-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 7px;
          color: #999;
          font-size: 9px;
        }

        .project-progress-top strong {
          color: #9b7b42;
          font-size: 10px;
        }

        .project-progress .progress {
          height: 6px;
          border-radius: 10px;
          background: #efeeeb;
          overflow: hidden;
        }

        .project-progress .progress-bar {
          border-radius: inherit;
          background: #c8a96e;
          transition: width 0.8s ease;
        }

        .project-task-summary {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding-bottom: 17px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.055);
          color: #8d8d8d;
          font-size: 8px;
        }

        .project-task-summary div {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .project-task-summary i {
          font-size: 9px;
        }

        .project-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: auto;
          padding-top: 15px;
        }

        .project-owner {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .owner-avatar {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          flex: 0 0 25px;
          border-radius: 50%;
          background: #f5f0e8;
          color: #8d7344;
          font-size: 9px;
          font-weight: 700;
        }

        .project-owner span:last-child {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #777;
          font-size: 9px;
        }

        .project-priority {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #999;
          font-size: 9px;
        }

        .project-priority i {
          font-size: 9px;
        }

        .projects-empty {
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

        .projects-empty h5 {
          margin-bottom: 6px;
        }

        .projects-empty p {
          max-width: 430px;
          margin: 0 auto 18px;
          font-size: 11px;
        }

        .project-skeleton {
          min-height: 305px;
          padding: 20px;
          border: 1px solid rgba(0, 0, 0, 0.055);
          border-radius: 14px;
          background: #fff;
          overflow: hidden;
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

        .skeleton-small {
          width: 30%;
          height: 26px;
          margin-bottom: 25px;
        }

        .skeleton-heading {
          width: 65%;
          height: 17px;
          margin-bottom: 12px;
        }

        .skeleton-line {
          width: 90%;
          height: 8px;
          margin-bottom: 8px;
        }

        .skeleton-line.short {
          width: 65%;
          margin-bottom: 28px;
        }

        .skeleton-progress {
          width: 100%;
          height: 6px;
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

        @keyframes projectIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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

        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(200, 169, 110, 0.25);
          }

          50% {
            box-shadow: 0 0 0 5px rgba(200, 169, 110, 0);
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

        @media (max-width: 850px) {
          .projects-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .create-project-button {
            width: 100%;
          }

          .workspace-summary {
            align-items: flex-start;
            flex-direction: column;
          }

          .workspace-progress {
            width: 100%;
            max-width: none;
          }
        }

        @media (max-width: 600px) {
          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .project-card {
            min-height: 290px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .projects-page,
          .project-stat,
          .workspace-summary,
          .create-project-card,
          .project-card,
          .projects-empty,
          .project-status > span,
          .skeleton {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </AppShell>
  );
}