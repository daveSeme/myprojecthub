'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError('');
    setBusy(true);

    try {
      if (!auth) {
        throw new Error('Firebase is not configured.');
      }

      await signInWithEmailAndPassword(auth, email, password);

      router.replace('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
              .replace('Firebase: ', '')
              .replace(/\(auth\/.*?\)\.?/, '')
              .trim()
          : 'Unable to sign in.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-one" />
      <div className="auth-bg-orb auth-bg-orb-two" />
      <div className="auth-bg-grid" />

      <div className="auth-topbar">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-mark">P</span>

          <span>
            PROJECT <strong>HUB</strong>
          </span>
        </Link>

        <Link href="/" className="auth-back">
          <i className="bi bi-arrow-left" />
          Back to home
        </Link>
      </div>

      <section className="auth-layout">
        <div className="auth-intro">
          <div className="auth-eyebrow">
            <span />
            YOUR WORKSPACE IS READY
          </div>

          <h1>
            Welcome
            <br />
            <em>back.</em>
          </h1>

          <p>
            Continue managing your projects, tasks, team activity and QA
            workflow from one focused workspace.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <i className="bi bi-kanban" />
              </div>

              <div>
                <strong>Everything in one place</strong>
                <span>Projects, tasks, updates and QA.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-icon">
                <i className="bi bi-people" />
              </div>

              <div>
                <strong>Clear ownership</strong>
                <span>Know who is responsible for the work.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-icon">
                <i className="bi bi-graph-up-arrow" />
              </div>

              <div>
                <strong>Visible progress</strong>
                <span>Keep delivery moving with clear milestones.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card-wrap">
          <div className="auth-card-glow" />

          <div className="auth-card">
            <div className="auth-card-header">
              <div className="auth-card-icon">
                <i className="bi bi-box-arrow-in-right" />
              </div>

              <div>
                <span className="auth-card-label">WELCOME BACK</span>
                <h2>Sign in</h2>
              </div>
            </div>

            <p className="auth-card-description">
              Enter your credentials to continue to your workspace.
            </p>

            <form onSubmit={submit} className="modern-form">
              <div className="field">
                <label htmlFor="email">Email address</label>

                <div className="field-control">
                  <i className="bi bi-envelope" />

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field">
                <div className="field-label-row">
                  <label htmlFor="password">Password</label>

                  <span>
                    <i className="bi bi-shield-check" />
                    Secure sign in
                  </span>
                </div>

                <div className="field-control">
                  <i className="bi bi-lock" />

                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="modern-error">
                  <i className="bi bi-exclamation-circle-fill" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="auth-submit"
              >
                {busy ? (
                  <>
                    <span>Signing in...</span>
                    <span className="button-spinner" />
                  </>
                ) : (
                  <>
                    <span>Sign in to Project Hub</span>
                    <i className="bi bi-arrow-right" />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>NEW TO PROJECT HUB?</span>
            </div>

            <Link href="/register" className="outline-auth-button">
              <span>Create your account</span>
              <i className="bi bi-arrow-up-right" />
            </Link>

            <div className="auth-card-footer">
              <i className="bi bi-lock-fill" />

              <span>
                Protected by Firebase Authentication
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="auth-footer">
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