'use client';

import { useEffect, useMemo, useState } from 'react';

import AppShell from '@/components/AppShell';
import {
  createUpdate,
  listProjects,
  listUpdates,
} from '@/lib/firestore';
import { useAuth } from '@/components/AuthProvider';

import type { Project, Update } from '@/lib/types';

function formatDate(value?: unknown) {
  if (!value) return 'Recently';

  try {
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
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

    const date = new Date(value as string);

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

function getInitials(name?: string) {
  if (!name) return '?';

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function UpdateSkeleton() {
  return (
    <div className="update-skeleton">
      <div className="skeleton skeleton-avatar" />

      <div className="skeleton-content">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
    </div>
  );
}

function UpdateCard({
  update,
  index,
}: {
  update: Update;
  index: number;
}) {
  return (
    <article
      className="update-card"
      style={{
        animationDelay: `${index * 55}ms`,
      }}
    >
      <div className="update-timeline">

        <div className="update-avatar">
          {getInitials(update.authorName)}
        </div>

        <div className="update-line" />

      </div>

      <div className="update-content">

        <div className="update-top">

          <div className="update-heading">

            <div className="update-project">
              <i className="bi bi-folder2-open" />
              <strong>
                {update.projectName ||
                  'Unknown project'}
              </strong>
            </div>

            <span className="update-author">
              {update.authorName ||
                'Unknown author'}
            </span>

          </div>

          <time className="update-date">
            <i className="bi bi-clock" />
            {formatDate(update.createdAt)}
          </time>

        </div>

        <div className="update-body">
          {update.text}
        </div>

        <div className="update-footer">

          <span>
            <i className="bi bi-journal-text" />
            Project update
          </span>

          <span>
            <i className="bi bi-person" />
            {update.authorName ||
              'Unknown author'}
          </span>

        </div>

      </div>
    </article>
  );
}

export default function Updates() {
  const { profile } = useAuth();

  const [items, setItems] = useState<Update[]>([]);
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [pid, setPid] = useState('');
  const [text, setText] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState('');

  const [projectFilter, setProjectFilter] =
    useState('all');

  async function load() {
    try {
      setLoading(true);
      setError('');

      const [updateData, projectData] =
        await Promise.all([
          listUpdates(),
          listProjects(),
        ]);

      setItems(updateData);
      setProjects(projectData);
    } catch (err) {
      console.error(err);

      setError(
        'Unable to load project updates. Please try again.',
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

    if (!profile) {
      setError(
        'You must be logged in to post an update.',
      );
      return;
    }

    if (!pid) {
      setError('Please select a project.');
      return;
    }

    if (!text.trim()) {
      setError('Please write an update.');
      return;
    }

    const project = projects.find(
      (item) => item.id === pid,
    );

    try {
      setSubmitting(true);
      setError('');

      await createUpdate({
        projectId: pid,
        projectName:
          project?.name ?? 'Unknown project',
        authorId: profile.uid,
        authorName: profile.name,
        text: text.trim(),
      });

      setPid('');
      setText('');

      await load();
    } catch (err) {
      console.error(err);

      setError(
        'Unable to post the project update.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const filteredItems = useMemo(() => {
    if (projectFilter === 'all') {
      return items;
    }

    return items.filter(
      (item) =>
        item.projectId === projectFilter,
    );
  }, [items, projectFilter]);

  const stats = useMemo(() => {
    const projectIds = new Set(
      items.map((item) => item.projectId),
    );

    const authors = new Set(
      items
        .map((item) => item.authorId)
        .filter(Boolean),
    );

    return {
      total: items.length,
      projects: projectIds.size,
      contributors: authors.size,
    };
  }, [items]);

  return (
    <AppShell>
      <div className="updates-page">

        {/* HEADER */}
        <div className="updates-header">

          <div>
            <div className="page-eyebrow">
              <i className="bi bi-journal-richtext" />
              PROJECT COMMUNICATION
            </div>

            <h2>Project Updates</h2>

            <p className="muted mb-0">
              Keep a clear record of what changed,
              what is blocked, and what comes next.
            </p>
          </div>

          <div className="update-summary">

            <div>
              <strong>{stats.total}</strong>
              <span>Updates</span>
            </div>

            <div className="summary-divider" />

            <div>
              <strong>{stats.projects}</strong>
              <span>Projects</span>
            </div>

            <div className="summary-divider" />

            <div>
              <strong>{stats.contributors}</strong>
              <span>Contributors</span>
            </div>

          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div
            className="alert alert-danger update-alert"
            role="alert"
          >
            <i className="bi bi-exclamation-circle me-2" />
            {error}
          </div>
        )}

        {/* POST UPDATE */}
        <div className="cardx post-update-card mb-4">

          <div className="post-update-header">

            <div className="post-update-icon">
              <i className="bi bi-pencil-square" />
            </div>

            <div>
              <h5>Post project update</h5>

              <p className="muted mb-0">
                Record progress, blockers, decisions,
                and the next actions for the team.
              </p>
            </div>

          </div>

          <form
            onSubmit={save}
            className="row g-3 mt-2"
          >

            <div className="col-lg-4">

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

            <div className="col-lg-8">

              <label className="form-label">
                Update
              </label>

              <div className="update-format-hint">

                <span>
                  <i className="bi bi-check2" />
                  Changed
                </span>

                <span>
                  <i className="bi bi-exclamation-circle" />
                  Blocked
                </span>

                <span>
                  <i className="bi bi-arrow-right" />
                  Next
                </span>

              </div>

            </div>

            <div className="col-12">

              <textarea
                className="form-control update-textarea"
                rows={6}
                required
                placeholder={`Completed:
Implemented the authentication flow and connected Firebase.

Current:
Dashboard and project management are working.

Blocked:
Waiting for the production API endpoint.

Next:
Connect the API and begin integration testing.`}
                value={text}
                onChange={(e) =>
                  setText(e.target.value)
                }
              />

              <div className="textarea-footer">
                <span>
                  <i className="bi bi-info-circle" />
                  Be specific enough that someone
                  reading this later understands the
                  project state.
                </span>

                <span>
                  {text.length} characters
                </span>
              </div>

            </div>

            <div className="col-12">

              <button
                type="submit"
                className="btn btn-dark"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />
                    Posting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2" />
                    Post update
                  </>
                )}
              </button>

            </div>

          </form>

        </div>

        {/* FILTER */}
        <div className="updates-toolbar cardx mb-3">

          <div className="toolbar-title">

            <div className="toolbar-icon">
              <i className="bi bi-clock-history" />
            </div>

            <div>
              <h5>Project timeline</h5>

              <span>
                {filteredItems.length}{' '}
                {filteredItems.length === 1
                  ? 'update'
                  : 'updates'}{' '}
                shown
              </span>
            </div>

          </div>

          <select
            className="form-select updates-project-filter"
            value={projectFilter}
            onChange={(e) =>
              setProjectFilter(
                e.target.value,
              )
            }
            title="Filter updates by project"
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

        {/* TIMELINE */}
        <div className="updates-timeline">

          {loading ? (
            <>
              <UpdateSkeleton />
              <UpdateSkeleton />
              <UpdateSkeleton />
            </>
          ) : filteredItems.length === 0 ? (
            <div className="cardx updates-empty">

              <div className="empty-icon">
                <i className="bi bi-journal-x" />
              </div>

              <h5>
                {items.length === 0
                  ? 'No project updates yet'
                  : 'No updates for this project'}
              </h5>

              <p className="muted">
                {items.length === 0
                  ? 'Post the first update to start building the project history.'
                  : 'Select another project or post a new update.'}
              </p>

            </div>
          ) : (
            [...filteredItems]
              .reverse()
              .map((item, index) => (
                <UpdateCard
                  key={item.id}
                  update={item}
                  index={index}
                />
              ))
          )}

        </div>

      </div>

      <style jsx>{`
        .updates-page {
          animation: pageIn 0.45s ease both;
        }

        .updates-header {
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

        .updates-header h2 {
          margin: 0;
          font-weight: 700;
          letter-spacing: -0.035em;
        }

        .updates-header p {
          margin-top: 7px;
          max-width: 650px;
          font-size: 13px;
        }

        .update-summary {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 11px 15px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.72);
        }

        .update-summary div:not(.summary-divider) {
          text-align: center;
        }

        .update-summary strong {
          display: block;
          color: #9b7b42;
          font-size: 18px;
          line-height: 1;
        }

        .update-summary span {
          display: block;
          margin-top: 4px;
          color: #999;
          font-size: 8px;
        }

        .summary-divider {
          width: 1px;
          height: 27px;
          background: rgba(0, 0, 0, 0.07);
        }

        .update-alert {
          border-radius: 10px;
          font-size: 11px;
          animation: panelIn 0.3s ease both;
        }

        .post-update-card {
          animation: panelIn 0.4s ease both;
        }

        .post-update-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .post-update-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #f5f0e8;
          color: #9b7b42;
          font-size: 16px;
        }

        .post-update-header h5 {
          margin: 0;
          font-weight: 650;
        }

        .post-update-header p {
          margin-top: 3px;
          font-size: 11px;
        }

        .form-label {
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 650;
        }

        .update-format-hint {
          height: 38px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .update-format-hint span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 8px;
          border-radius: 6px;
          background: #faf9f6;
          color: #888;
          font-size: 9px;
        }

        .update-format-hint i {
          color: #9b7b42;
        }

        .update-textarea {
          min-height: 145px;
          resize: vertical;
          line-height: 1.65;
        }

        .textarea-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 7px;
          color: #999;
          font-size: 9px;
        }

        .textarea-footer span:first-child {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .textarea-footer i {
          color: #9b7b42;
        }

        .updates-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 12px 15px;
          animation: cardIn 0.45s ease both;
        }

        .toolbar-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toolbar-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: #f5f0e8;
          color: #9b7b42;
        }

        .toolbar-title h5 {
          margin: 0;
          font-size: 12px;
          font-weight: 650;
        }

        .toolbar-title span {
          display: block;
          margin-top: 2px;
          color: #999;
          font-size: 9px;
        }

        .updates-project-filter {
          width: 190px;
          font-size: 10px;
        }

        .updates-timeline {
          position: relative;
        }

        .update-card {
          display: flex;
          gap: 14px;
          animation: updateIn 0.45s ease both;
        }

        .update-timeline {
          width: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 0 0 40px;
        }

        .update-avatar {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 34px;
          border: 3px solid #fff;
          border-radius: 50%;
          background: #f5f0e8;
          color: #8d7344;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          font-size: 9px;
          font-weight: 700;
          z-index: 2;
        }

        .update-line {
          width: 1px;
          flex: 1;
          min-height: 25px;
          background: rgba(0, 0, 0, 0.08);
        }

        .update-card:last-child .update-line {
          display: none;
        }

        .update-content {
          min-width: 0;
          flex: 1;
          margin-bottom: 15px;
          padding: 18px 20px;
          border: 1px solid rgba(0, 0, 0, 0.055);
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.025);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .update-content:hover {
          transform: translateY(-2px);
          border-color: rgba(200, 169, 110, 0.25);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.055);
        }

        .update-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .update-heading {
          min-width: 0;
        }

        .update-project {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #262626;
          font-size: 12px;
        }

        .update-project i {
          color: #9b7b42;
          font-size: 12px;
        }

        .update-author {
          display: block;
          margin-top: 3px;
          color: #999;
          font-size: 9px;
        }

        .update-date {
          display: flex;
          align-items: center;
          gap: 5px;
          flex: 0 0 auto;
          color: #999;
          font-size: 9px;
        }

        .update-date i {
          color: #9b7b42;
        }

        .update-body {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(0, 0, 0, 0.055);
          color: #4e4e4e;
          font-size: 11px;
          line-height: 1.75;
          white-space: pre-wrap;
        }

        .update-footer {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 14px;
          padding-top: 11px;
          border-top: 1px solid rgba(0, 0, 0, 0.045);
          color: #999;
          font-size: 8px;
        }

        .update-footer span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .update-footer i {
          color: #9b7b42;
          font-size: 9px;
        }

        .updates-empty {
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

        .updates-empty h5 {
          margin-bottom: 6px;
        }

        .updates-empty p {
          margin: 0;
          font-size: 11px;
        }

        .update-skeleton {
          display: flex;
          gap: 14px;
          min-height: 130px;
          animation: updateIn 0.4s ease both;
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

        .skeleton-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 50%;
        }

        .skeleton-content {
          flex: 1;
          padding: 5px 20px;
        }

        .skeleton-title {
          width: 25%;
          height: 12px;
          margin-bottom: 18px;
        }

        .skeleton-line {
          width: 85%;
          height: 9px;
          margin-bottom: 9px;
        }

        .skeleton-line.short {
          width: 55%;
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

        @keyframes updateIn {
          from {
            opacity: 0;
            transform: translateX(-7px);
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

        @media (max-width: 850px) {
          .updates-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .update-summary {
            width: 100%;
            justify-content: space-around;
          }

          .updates-project-filter {
            width: 170px;
          }
        }

        @media (max-width: 650px) {
          .updates-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .updates-project-filter {
            width: 100%;
          }

          .update-top {
            flex-direction: column;
            gap: 7px;
          }

          .update-date {
            align-self: flex-start;
          }

          .update-content {
            padding: 15px;
          }

          .update-timeline {
            width: 32px;
            flex-basis: 32px;
          }

          .update-avatar {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .updates-page,
          .post-update-card,
          .updates-toolbar,
          .update-card,
          .update-content,
          .updates-empty,
          .update-skeleton,
          .skeleton,
          .update-alert {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </AppShell>
  );
}