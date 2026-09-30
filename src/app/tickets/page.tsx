'use client';

import { useEffect, useMemo, useState } from 'react';

import AppShell from '@/components/AppShell';
import {
  createTicket,
  listProjects,
  listTickets,
  listUsers,
  updateTicket,
} from '@/lib/firestore';

import { useAuth } from '@/components/AuthProvider';

import type {
  Profile,
  Project,
  Ticket,
  Priority,
} from '@/lib/types';


/* =========================================================
   CONSTANTS
========================================================= */

const statuses: Ticket['status'][] = [
  'open',
  'in-progress',
  'resolved',
  'verified',
  'closed',
];

const priorities: Priority[] = [
  'low',
  'medium',
  'high',
  'critical',
];


/* =========================================================
   HELPERS
========================================================= */

function statusLabel(
  status: Ticket['status'],
) {
  return status
    .replace('-', ' ')
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

function priorityLabel(
  priority: Priority,
) {
  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1)
  );
}

function priorityClass(
  priority: Priority,
) {
  switch (priority) {
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

function statusClass(
  status: Ticket['status'],
) {
  switch (status) {
    case 'open':
      return 'ticket-open';

    case 'in-progress':
      return 'ticket-progress';

    case 'resolved':
      return 'ticket-resolved';

    case 'verified':
      return 'ticket-verified';

    case 'closed':
      return 'ticket-closed';

    default:
      return 'ticket-open';
  }
}


/**
 * Developers should only move tickets through
 * the development part of the workflow.
 *
 * Admins can use all statuses.
 */
function developerStatuses(
  current: Ticket['status'],
): Ticket['status'][] {
  switch (current) {
    case 'open':
      return ['open', 'in-progress'];

    case 'in-progress':
      return ['in-progress', 'resolved'];

    case 'resolved':
      return ['resolved'];

    case 'verified':
      return ['verified'];

    case 'closed':
      return ['closed'];

    default:
      return [current];
  }
}


/* =========================================================
   SKELETON
========================================================= */

function TicketSkeleton() {
  return (
    <div className="ticket-skeleton">
      <div className="skeleton skeleton-title" />

      <div className="skeleton skeleton-line" />

      <div className="skeleton skeleton-line short" />
    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function Tickets() {
  const { profile } = useAuth();

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [devs, setDevs] =
    useState<Profile[]>([]);

  const [title, setTitle] =
    useState('');

  const [desc, setDesc] =
    useState('');

  const [projectId, setProjectId] =
    useState('');

  const [priority, setPriority] =
    useState<Priority>('medium');

  const [developerId, setDeveloperId] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [updating, setUpdating] =
    useState<string | null>(null);

  const [error, setError] =
    useState('');


  /* =======================================================
     LOAD
  ======================================================= */

  async function load() {
    if (!profile) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [
        ticketData,
        projectData,
        userData,
      ] = await Promise.all([
        listTickets(),
        listProjects(),
        listUsers(),
      ]);

      setTickets(ticketData);

      setProjects(projectData);

      setDevs(
        userData.filter(
          (user) =>
            user.role === 'developer' ||
            user.role === 'admin',
        ),
      );
    } catch (err) {
      console.error(
        'Failed to load tickets:',
        err,
      );

      setError(
        'Unable to load QA tickets. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (profile) {
      load();
    }
  }, [profile?.uid, profile?.role]);


  /* =======================================================
     AVAILABLE PROJECTS
  ======================================================= */

  const availableProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.status === 'active',
      ),
    [projects],
  );


  /* =======================================================
     METRICS
  ======================================================= */

  const ticketStats = useMemo(() => {
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

    const critical = tickets.filter(
      (ticket) =>
        ticket.priority === 'critical',
    ).length;

    const verified = tickets.filter(
      (ticket) =>
        ticket.status === 'verified',
    ).length;

    return {
      total: tickets.length,
      open,
      inProgress,
      resolved,
      critical,
      verified,
    };
  }, [tickets]);


  /* =======================================================
     RAISE TICKET
  ======================================================= */

  async function raise(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!profile) {
      setError(
        'You must be logged in to raise a ticket.',
      );

      return;
    }

    if (profile.role !== 'tester') {
      setError(
        'Only testers can raise QA tickets.',
      );

      return;
    }

    if (!projectId) {
      setError(
        'Please select an active project.',
      );

      return;
    }

    if (!title.trim()) {
      setError(
        'Please enter a ticket title.',
      );

      return;
    }

    if (!desc.trim()) {
      setError(
        'Please describe the issue.',
      );

      return;
    }

    const project =
      availableProjects.find(
        (item) =>
          item.id === projectId,
      );

    if (!project) {
      setError(
        'The selected project is not currently available for QA.',
      );

      return;
    }

    const developer =
      devs.find(
        (item) =>
          item.uid === developerId,
      );

    try {
      setSubmitting(true);
      setError('');

      await createTicket({
        title: title.trim(),

        description: desc.trim(),

        projectId,

        projectName:
          project.name,

        testerId:
          profile.uid,

        testerName:
          profile.name,

        developerId:
          developer?.uid,

        developerName:
          developer?.name,

        priority,

        status: 'open',
      });

      setTitle('');
      setDesc('');
      setProjectId('');
      setPriority('medium');
      setDeveloperId('');

      await load();
    } catch (err) {
      console.error(
        'Failed to create ticket:',
        err,
      );

      setError(
        'Unable to create the ticket. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }


  /* =======================================================
     CHANGE STATUS
  ======================================================= */

  async function changeStatus(
    ticketId: string,
    status: Ticket['status'],
  ) {
    try {
      setUpdating(ticketId);
      setError('');

      await updateTicket(
        ticketId,
        {
          status,
        },
      );

      await load();
    } catch (err) {
      console.error(
        'Failed to update ticket:',
        err,
      );

      setError(
        'Unable to update the ticket status.',
      );
    } finally {
      setUpdating(null);
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AppShell>

      <div className="tickets-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="tickets-header">

          <div>

            <div className="page-eyebrow">
              <i className="bi bi-bug" />

              QUALITY ASSURANCE
            </div>

            <h2>
              {profile?.role === 'admin'
                ? 'QA Tickets'
                : profile?.role === 'tester'
                  ? 'My QA Tickets'
                  : 'My Tickets'}
            </h2>

            <p className="muted mb-0">
              {profile?.role === 'admin'
                ? 'Manage QA issues across the entire workspace.'
                : profile?.role === 'tester'
                  ? 'Raise issues, track fixes, and verify resolved tickets.'
                  : 'Track and resolve QA issues assigned to you.'}
            </p>

          </div>


          {profile?.role === 'tester' && (
            <div className="qa-status">

              <i className="bi bi-shield-check" />

              <div>

                <strong>
                  QA workspace
                </strong>

                <span>
                  {availableProjects.length}{' '}
                  active{' '}
                  {availableProjects.length === 1
                    ? 'project'
                    : 'projects'}
                </span>

              </div>

            </div>
          )}

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="alert alert-danger ticket-alert"
            role="alert"
          >
            <i className="bi bi-exclamation-circle me-2" />

            {error}
          </div>
        )}


        {/* =================================================
            METRICS
        ================================================= */}

        <div className="row g-3 mb-4">

          <div className="col-6 col-xl-3">

            <div className="cardx ticket-stat">

              <div className="stat-icon">
                <i className="bi bi-ticket-perforated" />
              </div>

              <div>

                <span>
                  Total tickets
                </span>

                <strong>
                  {ticketStats.total}
                </strong>

              </div>

            </div>

          </div>


          <div className="col-6 col-xl-3">

            <div className="cardx ticket-stat">

              <div className="stat-icon open">
                <i className="bi bi-exclamation-circle" />
              </div>

              <div>

                <span>
                  Open
                </span>

                <strong>
                  {ticketStats.open}
                </strong>

              </div>

            </div>

          </div>


          <div className="col-6 col-xl-3">

            <div className="cardx ticket-stat">

              <div className="stat-icon progress">
                <i className="bi bi-arrow-repeat" />
              </div>

              <div>

                <span>
                  In progress
                </span>

                <strong>
                  {ticketStats.inProgress}
                </strong>

              </div>

            </div>

          </div>


          <div className="col-6 col-xl-3">

            <div className="cardx ticket-stat">

              <div className="stat-icon critical">
                <i className="bi bi-flag-fill" />
              </div>

              <div>

                <span>
                  Critical
                </span>

                <strong>
                  {ticketStats.critical}
                </strong>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            RAISE TICKET
        ================================================= */}

        {profile?.role === 'tester' && (

          <div className="cardx raise-ticket-card mb-4">

            <div className="raise-ticket-header">

              <div className="raise-ticket-icon">
                <i className="bi bi-plus-lg" />
              </div>

              <div>

                <h5>
                  Raise a ticket
                </h5>

                <p className="muted mb-0">
                  Report an issue found while
                  testing an active project.
                </p>

              </div>

            </div>


            {availableProjects.length === 0 ? (

              <div className="no-projects">

                <div className="no-projects-icon">
                  <i className="bi bi-folder-x" />
                </div>

                <div>

                  <strong>
                    No projects available for QA
                  </strong>

                  <p className="muted mb-0">
                    You currently have no active
                    projects assigned to you for QA.
                    Once a project is assigned to you,
                    it will appear here.
                  </p>

                </div>

              </div>

            ) : (

              <form
                onSubmit={raise}
                className="row g-3 mt-2"
              >

                <div className="col-lg-6">

                  <label className="form-label">
                    Issue title
                  </label>

                  <input
                    className="form-control"
                    placeholder="Describe the issue briefly"
                    required
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value,
                      )
                    }
                  />

                </div>


                <div className="col-lg-3">

                  <label className="form-label">
                    Project
                  </label>

                  <select
                    className="form-select"
                    required
                    value={projectId}
                    onChange={(e) =>
                      setProjectId(
                        e.target.value,
                      )
                    }
                  >

                    <option value="">
                      Select active project
                    </option>

                    {availableProjects.map(
                      (project) => (

                        <option
                          key={project.id}
                          value={project.id}
                        >
                          {project.name}
                        </option>

                      ),
                    )}

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
                        e.target
                          .value as Priority,
                      )
                    }
                  >

                    {priorities.map(
                      (item) => (

                        <option
                          key={item}
                          value={item}
                        >
                          {priorityLabel(item)}
                        </option>

                      ),
                    )}

                  </select>

                </div>


                <div className="col-md-6">

                  <label className="form-label">
                    Assign developer
                  </label>

                  <select
                    className="form-select"
                    value={developerId}
                    onChange={(e) =>
                      setDeveloperId(
                        e.target.value,
                      )
                    }
                  >

                    <option value="">
                      Unassigned
                    </option>

                    {devs.map(
                      (developer) => (

                        <option
                          key={developer.uid}
                          value={developer.uid}
                        >
                          {developer.name} (
                          {developer.role})
                        </option>

                      ),
                    )}

                  </select>

                </div>


                <div className="col-md-6">

                  <div className="ticket-form-hint">

                    <i className="bi bi-info-circle" />

                    <span>
                      Include reproduction steps,
                      expected behaviour, actual
                      behaviour, screenshots, or
                      relevant links.
                    </span>

                  </div>

                </div>


                <div className="col-12">

                  <label className="form-label">
                    Description
                  </label>

                  <textarea
                    className="form-control"
                    rows={5}
                    placeholder="Steps to reproduce, expected result, actual result, screenshots or links..."
                    required
                    value={desc}
                    onChange={(e) =>
                      setDesc(
                        e.target.value,
                      )
                    }
                  />

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

                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2" />

                        Submit ticket
                      </>
                    )}

                  </button>

                </div>

              </form>

            )}

          </div>

        )}


        {/* =================================================
            TICKET LIST
        ================================================= */}

        <div className="cardx tickets-list-card">

          <div className="tickets-list-header">

            <div>

              <h5>
                Ticket queue
              </h5>

              <p className="muted mb-0">
                {profile?.role === 'admin'
                  ? 'All reported QA issues across the workspace.'
                  : profile?.role === 'tester'
                    ? 'Issues you have reported and their current status.'
                    : 'QA issues currently assigned to you.'}
              </p>

            </div>


            <div className="ticket-queue-summary">

              <span>
                {ticketStats.resolved +
                  ticketStats.verified}{' '}
                resolved
              </span>

              <span>
                {ticketStats.verified}{' '}
                verified
              </span>

            </div>

          </div>


          {loading ? (

            <div className="ticket-list">

              <TicketSkeleton />
              <TicketSkeleton />
              <TicketSkeleton />
              <TicketSkeleton />

            </div>

          ) : tickets.length === 0 ? (

            <div className="tickets-empty">

              <div className="empty-icon">
                <i className="bi bi-ticket-perforated" />
              </div>

              <h5>
                No QA tickets yet
              </h5>

              <p className="muted">
                {profile?.role === 'tester'
                  ? 'Issues you report will appear here.'
                  : 'Tickets assigned to you will appear here.'}
              </p>

            </div>

          ) : (

            <div className="ticket-list">

              {tickets.map(
                (ticket, index) => (

                  <div
                    className="ticket-row"
                    key={ticket.id}
                    style={{
                      animationDelay:
                        `${index * 45}ms`,
                    }}
                  >

                    <div
                      className={`ticket-severity ${priorityClass(
                        ticket.priority,
                      )}`}
                    />


                    <div className="ticket-main">

                      <div className="ticket-title-row">

                        <div className="ticket-title">

                          <strong>
                            {ticket.title}
                          </strong>

                          <span
                            className={`priority-badge ${priorityClass(
                              ticket.priority,
                            )}`}
                          >

                            <i className="bi bi-flag-fill" />

                            {ticket.priority}

                          </span>

                        </div>


                        <span
                          className={`ticket-status ${statusClass(
                            ticket.status,
                          )}`}
                        >

                          <i className="bi bi-circle-fill" />

                          {statusLabel(
                            ticket.status,
                          )}

                        </span>

                      </div>


                      <div className="ticket-description">
                        {ticket.description}
                      </div>


                      <div className="ticket-meta">

                        <span>

                          <i className="bi bi-folder2-open" />

                          {ticket.projectName ||
                            'Unknown project'}

                        </span>


                        <span>

                          <i className="bi bi-person" />

                          {ticket.testerName ||
                            'Unknown tester'}

                        </span>


                        <span>

                          <i className="bi bi-code-slash" />

                          {ticket.developerName ||
                            'Unassigned'}

                        </span>

                      </div>

                    </div>


                    {/* =====================================
                        ACTIONS
                    ===================================== */}

                    <div className="ticket-actions">

                      {/* ADMIN */}
                      {profile?.role === 'admin' && (

                        <select
                          className="form-select ticket-status-select"
                          value={ticket.status}
                          disabled={
                            updating ===
                            ticket.id
                          }
                          title="Update ticket status"
                          onChange={(e) =>
                            changeStatus(
                              ticket.id,
                              e.target
                                .value as Ticket['status'],
                            )
                          }
                        >

                          {statuses.map(
                            (status) => (

                              <option
                                key={status}
                                value={status}
                              >
                                {statusLabel(
                                  status,
                                )}
                              </option>

                            ),
                          )}

                        </select>

                      )}


                      {/* DEVELOPER */}
                      {profile?.role ===
                        'developer' && (

                        <select
                          className="form-select ticket-status-select"
                          value={ticket.status}
                          disabled={
                            updating ===
                            ticket.id
                          }
                          title="Update ticket status"
                          onChange={(e) =>
                            changeStatus(
                              ticket.id,
                              e.target
                                .value as Ticket['status'],
                            )
                          }
                        >

                          {developerStatuses(
                            ticket.status,
                          ).map(
                            (status) => (

                              <option
                                key={status}
                                value={status}
                              >
                                {statusLabel(
                                  status,
                                )}
                              </option>

                            ),
                          )}

                        </select>

                      )}


                      {/* TESTER */}
                      {profile?.role ===
                        'tester' &&
                        ticket.testerId ===
                          profile.uid &&
                        ticket.status ===
                          'resolved' && (

                          <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            disabled={
                              updating ===
                              ticket.id
                            }
                            onClick={() =>
                              changeStatus(
                                ticket.id,
                                'verified',
                              )
                            }
                            title="Verify the fix"
                          >

                            {updating ===
                            ticket.id ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  aria-hidden="true"
                                />

                                Verifying
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check2-circle me-1" />

                                Verify fix
                              </>
                            )}

                          </button>

                        )}


                      {/* TESTER — WAITING */}
                      {profile?.role ===
                        'tester' &&
                        ticket.testerId ===
                          profile.uid &&
                        ticket.status !==
                          'resolved' &&
                        ticket.status !==
                          'verified' &&
                        ticket.status !==
                          'closed' && (

                          <span className="ticket-waiting">
                            <i className="bi bi-hourglass-split" />

                            Waiting for developer
                          </span>

                        )}

                    </div>

                  </div>

                ),
              )}

            </div>

          )}

        </div>

      </div>


      {/* ===================================================
          STYLES
      =================================================== */}

      <style jsx>{`

        .tickets-page {
          animation: pageIn 0.45s ease both;
        }

        .tickets-header {
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

        .tickets-header h2 {
          margin: 0;
          font-weight: 700;
          letter-spacing: -0.035em;
        }

        .tickets-header p {
          margin-top: 7px;
          max-width: 650px;
          font-size: 13px;
        }

        .qa-status {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 15px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.72);
        }

        .qa-status > i {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #eaf0eb;
          color: #68816d;
        }

        .qa-status strong {
          display: block;
          font-size: 11px;
        }

        .qa-status span {
          display: block;
          margin-top: 2px;
          color: #999;
          font-size: 9px;
        }

        .ticket-alert {
          border-radius: 10px;
          font-size: 11px;
          animation: panelIn 0.3s ease both;
        }

        .ticket-stat {
          min-height: 92px;
          display: flex;
          align-items: center;
          gap: 14px;
          animation: cardIn 0.45s ease both;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .ticket-stat:hover {
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

        .stat-icon.open {
          background: #f5e8e5;
          color: #8c625b;
        }

        .stat-icon.progress {
          background: #f6f0e4;
          color: #9b7b42;
        }

        .stat-icon.critical {
          background: #f5e5e2;
          color: #8a5550;
        }

        .ticket-stat span {
          display: block;
          color: #888;
          font-size: 11px;
          margin-bottom: 3px;
        }

        .ticket-stat strong {
          display: block;
          font-size: 24px;
          line-height: 1;
        }

        .raise-ticket-card {
          animation: panelIn 0.4s ease both;
        }

        .raise-ticket-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .raise-ticket-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #f5f0e8;
          color: #9b7b42;
        }

        .raise-ticket-header h5 {
          margin: 0;
          font-weight: 650;
        }

        .raise-ticket-header p {
          margin-top: 3px;
          font-size: 11px;
        }

        .form-label {
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 650;
        }

        .ticket-form-hint {
          height: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 12px;
          border-radius: 9px;
          background: #faf9f6;
          color: #888;
          font-size: 10px;
          line-height: 1.5;
        }

        .ticket-form-hint i {
          flex: 0 0 auto;
          color: #9b7b42;
        }

        .no-projects {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 22px;
          padding: 16px;
          border: 1px dashed rgba(0, 0, 0, 0.1);
          border-radius: 11px;
          background: #faf9f6;
        }

        .no-projects-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 11px;
          background: #f1f1ef;
          color: #777;
        }

        .no-projects strong {
          display: block;
          margin-bottom: 3px;
          font-size: 11px;
        }

        .no-projects p {
          font-size: 10px;
          line-height: 1.5;
        }

        .tickets-list-card {
          padding: 0;
          overflow: hidden;
          animation: cardIn 0.5s ease both;
        }

        .tickets-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.055);
        }

        .tickets-list-header h5 {
          margin: 0;
          font-weight: 650;
        }

        .tickets-list-header p {
          margin-top: 3px;
          font-size: 10px;
        }

        .ticket-queue-summary {
          display: flex;
          gap: 12px;
          color: #999;
          font-size: 9px;
        }

        .ticket-list {
          padding: 0 24px;
        }

        .ticket-row {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: 112px;
          padding: 18px 4px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.055);
          animation: rowIn 0.4s ease both;
          transition:
            padding 0.2s ease,
            background 0.2s ease;
        }

        .ticket-row:last-child {
          border-bottom: 0;
        }

        .ticket-row:hover {
          padding-left: 9px;
          padding-right: 9px;
          background: rgba(245, 240, 232, 0.25);
        }

        .ticket-severity {
          width: 4px;
          min-height: 48px;
          flex: 0 0 4px;
          border-radius: 5px;
        }

        .ticket-severity.priority-critical {
          background: #8a5550;
        }

        .ticket-severity.priority-high {
          background: #a06d62;
        }

        .ticket-severity.priority-medium {
          background: #c8a96e;
        }

        .ticket-severity.priority-low {
          background: #718875;
        }

        .ticket-main {
          min-width: 0;
          flex: 1;
        }

        .ticket-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .ticket-title {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          min-width: 0;
        }

        .ticket-title strong {
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
          text-transform: capitalize;
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

        .ticket-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          flex: 0 0 auto;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 650;
          white-space: nowrap;
        }

        .ticket-status i {
          font-size: 5px;
        }

        .ticket-open {
          color: #8c625b;
          background: #f5e8e5;
        }

        .ticket-progress {
          color: #8d7344;
          background: #f6f0e4;
        }

        .ticket-resolved {
          color: #68816d;
          background: #eaf0eb;
        }

        .ticket-verified {
          color: #5f7765;
          background: #e7efe9;
        }

        .ticket-closed {
          color: #777;
          background: #eeeeec;
        }

        .ticket-description {
          max-width: 800px;
          margin-top: 7px;
          color: #777;
          font-size: 10px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ticket-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 9px;
          color: #999;
          font-size: 9px;
        }

        .ticket-meta span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .ticket-meta i {
          font-size: 9px;
        }

        .ticket-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex: 0 0 auto;
        }

        .ticket-status-select {
          width: 145px;
          font-size: 10px;
        }

        .ticket-waiting {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 9px;
          border-radius: 7px;
          background: #f7f5ef;
          color: #999;
          font-size: 9px;
          white-space: nowrap;
        }

        .tickets-empty {
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

        .tickets-empty h5 {
          margin-bottom: 6px;
        }

        .tickets-empty p {
          margin: 0;
          font-size: 11px;
        }

        .ticket-skeleton {
          min-height: 112px;
          padding: 20px 4px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.055);
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
          width: 30%;
          height: 13px;
          margin-bottom: 12px;
        }

        .skeleton-line {
          width: 75%;
          height: 8px;
          margin-bottom: 9px;
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

        @media (max-width: 900px) {

          .tickets-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .qa-status {
            width: 100%;
          }

          .ticket-title-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }

          .ticket-status {
            align-self: flex-start;
          }

        }

        @media (max-width: 700px) {

          .tickets-list-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .ticket-row {
            align-items: flex-start;
          }

          .ticket-actions {
            flex-direction: column;
          }

          .ticket-status-select {
            width: 125px;
          }

          .ticket-list {
            padding: 0 16px;
          }

          .tickets-list-header {
            padding: 18px;
          }

          .ticket-meta {
            gap: 7px;
          }

          .ticket-meta span {
            width: 100%;
          }

        }

        @media (max-width: 500px) {

          .ticket-row {
            gap: 9px;
          }

          .ticket-actions {
            width: 100%;
            margin-top: 10px;
          }

          .ticket-status-select {
            width: 100%;
          }

        }

        @media (prefers-reduced-motion: reduce) {

          .tickets-page,
          .ticket-stat,
          .raise-ticket-card,
          .tickets-list-card,
          .ticket-row,
          .tickets-empty,
          .ticket-skeleton,
          .skeleton,
          .ticket-alert {
            animation: none !important;
            transition: none !important;
          }

        }

      `}</style>

    </AppShell>
  );
}