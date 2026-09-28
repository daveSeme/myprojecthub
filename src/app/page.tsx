'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  return (
    <main className="landing-page">
      {/* Background */}
      <div className="landing-grid" />
      <div className="landing-glow landing-glow-one" />
      <div className="landing-glow landing-glow-two" />
      <div className="landing-glow landing-glow-three" />

      {/* Navigation */}
      <nav className="landing-nav">
        <Link href="/" className="landing-logo">
          <span className="landing-logo-mark">P</span>

          <span className="landing-logo-text">
            PROJECT <strong>HUB</strong>
          </span>
        </Link>

        <div className="landing-nav-center">
          <span>Projects</span>
          <span>Tasks</span>
          <span>Team</span>
          <span>QA</span>
        </div>

        <div className="landing-nav-right">
          <span className="nav-status">
            <span className="status-dot" />
            Workspace online
          </span>

          {loading ? (
            <span className="nav-login nav-loading">
              Loading...
            </span>
          ) : profile ? (
            <button
              type="button"
              className="nav-login nav-button"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
              <i className="bi bi-arrow-up-right" />
            </button>
          ) : (
            <Link
              href="/login"
              className="nav-login nav-button"
            >
              Sign in
              <i className="bi bi-arrow-right" />
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="hero-eyebrow">
            <span className="eyebrow-line" />
            YOUR WORK. ONE PLACE.
          </div>

          <h1>
            Build.
            <br />
            <em>Track.</em>
            <br />
            Deliver.
          </h1>

          <p className="hero-description">
            A focused workspace for managing projects, tasks, teams,
            milestones, updates and QA — without losing sight of the
            work that matters.
          </p>

          <div className="hero-actions">
            {loading ? (
              <button
                type="button"
                className="hero-primary"
                disabled
              >
                <span>Loading workspace...</span>
              </button>
            ) : profile ? (
              <Link
                href="/dashboard"
                className="hero-primary"
              >
                <span>Open your workspace</span>
                <i className="bi bi-arrow-up-right" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="hero-primary"
                >
                  <span>Get started</span>
                  <i className="bi bi-arrow-right" />
                </Link>

                <Link
                  href="/login"
                  className="hero-secondary"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          <div className="hero-meta">
            <div>
              <span className="hero-meta-icon">
                <i className="bi bi-kanban" />
              </span>
              <span>Projects</span>
            </div>

            <div>
              <span className="hero-meta-icon">
                <i className="bi bi-check2-square" />
              </span>
              <span>Tasks</span>
            </div>

            <div>
              <span className="hero-meta-icon">
                <i className="bi bi-people" />
              </span>
              <span>Team</span>
            </div>

            <div>
              <span className="hero-meta-icon">
                <i className="bi bi-bug" />
              </span>
              <span>QA</span>
            </div>
          </div>

          <div className="hero-trust">
            <span>
              <i className="bi bi-shield-check" />
              Secure workspace
            </span>

            <span>
              <i className="bi bi-lightning-charge" />
              Built for delivery
            </span>
          </div>
        </div>

        {/* Product Preview */}
        <div className="workspace-stage">
          <div className="workspace-orbit workspace-orbit-one" />
          <div className="workspace-orbit workspace-orbit-two" />

          <div className="workspace-shadow" />

          <div className="workspace-window">
            {/* Window Header */}
            <div className="window-top">
              <div className="window-dots">
                <span />
                <span />
                <span />
              </div>

              <div className="window-title">
                <i className="bi bi-grid-1x2" />
                Project Hub
              </div>

              <div className="window-action">
                <i className="bi bi-three-dots" />
              </div>
            </div>

            {/* Window Body */}
            <div className="workspace-body">
              {/* Mock Sidebar */}
              <aside className="mock-sidebar">
                <div className="mock-brand">
                  <span>P</span>
                </div>

                <div className="mock-nav active">
                  <i className="bi bi-grid" />
                </div>

                <div className="mock-nav">
                  <i className="bi bi-kanban" />
                </div>

                <div className="mock-nav">
                  <i className="bi bi-check2-square" />
                </div>

                <div className="mock-nav">
                  <i className="bi bi-people" />
                </div>

                <div className="mock-nav">
                  <i className="bi bi-bug" />
                </div>

                <div className="mock-nav mock-nav-bottom">
                  <i className="bi bi-gear" />
                </div>
              </aside>

              {/* Mock Dashboard */}
              <div className="mock-content">
                <div className="mock-heading">
                  <div>
                    <small>MONDAY · WORKSPACE</small>
                    <h3>Good morning.</h3>
                  </div>

                  <div className="mock-avatar">
                    D
                  </div>
                </div>

                {/* Stats */}
                <div className="mock-stats">
                  <div className="mock-stat">
                    <span>ACTIVE PROJECTS</span>

                    <strong>08</strong>

                    <small>
                      <i className="bi bi-arrow-up" />
                      12% this month
                    </small>
                  </div>

                  <div className="mock-stat">
                    <span>OPEN TASKS</span>

                    <strong>24</strong>

                    <small>
                      <i className="bi bi-check2" />
                      8 completed
                    </small>
                  </div>

                  <div className="mock-stat">
                    <span>QA TICKETS</span>

                    <strong>06</strong>

                    <small>
                      <i className="bi bi-clock" />
                      2 need attention
                    </small>
                  </div>
                </div>

                {/* Lower Dashboard */}
                <div className="mock-lower">
                  <div className="mock-project-card">
                    <div className="mock-card-heading">
                      <span>PROJECT PROGRESS</span>

                      <i className="bi bi-three-dots" />
                    </div>

                    <div className="project-row">
                      <div className="project-icon">
                        D
                      </div>

                      <div className="project-info">
                        <strong>
                          Digital Platform
                        </strong>

                        <div className="mock-progress">
                          <span
                            style={{ width: '78%' }}
                          />
                        </div>
                      </div>

                      <b>78%</b>
                    </div>

                    <div className="project-row">
                      <div className="project-icon alt">
                        B
                      </div>

                      <div className="project-info">
                        <strong>
                          Business Intelligence
                        </strong>

                        <div className="mock-progress">
                          <span
                            style={{ width: '61%' }}
                          />
                        </div>
                      </div>

                      <b>61%</b>
                    </div>

                    <div className="project-row">
                      <div className="project-icon third">
                        C
                      </div>

                      <div className="project-info">
                        <strong>
                          Client Portal
                        </strong>

                        <div className="mock-progress">
                          <span
                            style={{ width: '44%' }}
                          />
                        </div>
                      </div>

                      <b>44%</b>
                    </div>
                  </div>

                  <div className="mock-activity-card">
                    <div className="mock-card-heading">
                      <span>RECENT ACTIVITY</span>

                      <i className="bi bi-activity" />
                    </div>

                    <div className="activity-item">
                      <span className="activity-icon">
                        <i className="bi bi-check2" />
                      </span>

                      <div>
                        <strong>
                          Task completed
                        </strong>

                        <small>
                          API integration
                        </small>
                      </div>
                    </div>

                    <div className="activity-item">
                      <span className="activity-icon">
                        <i className="bi bi-bug" />
                      </span>

                      <div>
                        <strong>
                          QA ticket opened
                        </strong>

                        <small>
                          Login validation
                        </small>
                      </div>
                    </div>

                    <div className="activity-item">
                      <span className="activity-icon">
                        <i className="bi bi-person-plus" />
                      </span>

                      <div>
                        <strong>
                          Team updated
                        </strong>

                        <small>
                          New developer added
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Card */}
          <div className="floating-card floating-card-top">
            <span className="floating-icon">
              <i className="bi bi-check-lg" />
            </span>

            <div>
              <strong>Task completed</strong>
              <small>Just now</small>
            </div>
          </div>

          {/* Floating Card */}
          <div className="floating-card floating-card-bottom">
            <div className="floating-mini-chart">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div>
              <strong>Project momentum</strong>

              <small>
                <i className="bi bi-arrow-up" />
                18% this week
              </small>
            </div>
          </div>

          {/* Small status card */}
          <div className="floating-card floating-card-status">
            <span className="status-card-icon">
              <i className="bi bi-shield-check" />
            </span>

            <div>
              <strong>Workspace secure</strong>
              <small>All systems operational</small>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom strip */}
      <section className="landing-bottom">
        <div className="landing-bottom-item">
          <span className="bottom-number">01</span>

          <div>
            <strong>Plan</strong>
            <small>Structure the work.</small>
          </div>
        </div>

        <div className="landing-bottom-line" />

        <div className="landing-bottom-item">
          <span className="bottom-number">02</span>

          <div>
            <strong>Collaborate</strong>
            <small>Keep ownership clear.</small>
          </div>
        </div>

        <div className="landing-bottom-line" />

        <div className="landing-bottom-item">
          <span className="bottom-number">03</span>

          <div>
            <strong>Deliver</strong>
            <small>Move work to completion.</small>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <span>PROJECT HUB</span>

        <span>
          Projects · Tasks · Team · QA · Activity
        </span>

        <span>
          © {new Date().getFullYear()}
        </span>
      </footer>
    </main>
  );
}