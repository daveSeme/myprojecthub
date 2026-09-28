'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { saveProfile } from '@/lib/firestore';
import type { Role } from '@/lib/types';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('developer');

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

      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await saveProfile({
        uid: credential.user.uid,
        name,
        email,
        role,
        createdAt: new Date(),
      });

      router.replace('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
              .replace('Firebase: ', '')
              .replace(/\(auth\/.*?\)\.?/, '')
              .trim()
          : 'Registration failed.',
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

      <section className="auth-layout register-layout">
        <div className="auth-intro">
          <div className="auth-eyebrow">
            <span />
            START YOUR WORKSPACE
          </div>

          <h1>
            Build your
            <br />
            <em>workspace.</em>
          </h1>

          <p>
            Bring your projects, people, tasks and delivery workflow
            together in one calm, organized environment.
          </p>

          <div className="register-steps">
            <div className="register-step active">
              <span>01</span>

              <div>
                <strong>Create</strong>
                <small>Set up your workspace profile.</small>
              </div>
            </div>

            <div className="register-step">
              <span>02</span>

              <div>
                <strong>Organize</strong>
                <small>Add projects, tasks and ownership.</small>
              </div>
            </div>

            <div className="register-step">
              <span>03</span>

              <div>
                <strong>Deliver</strong>
                <small>Track progress through completion.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card-wrap">
          <div className="auth-card-glow" />

          <div className="auth-card register-card">
            <div className="auth-card-header">
              <div className="auth-card-icon">
                <i className="bi bi-person-plus" />
              </div>

              <div>
                <span className="auth-card-label">GET STARTED</span>
                <h2>Create account</h2>
              </div>
            </div>

            <p className="auth-card-description">
              Create your profile and start managing your work.
            </p>

            <form onSubmit={submit} className="modern-form">
              <div className="field">
                <label htmlFor="name">Full name</label>

                <div className="field-control">
                  <i className="bi bi-person" />

                  <input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="register-email">
                  Email address
                </label>

                <div className="field-control">
                  <i className="bi bi-envelope" />

                  <input
                    id="register-email"
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
                <label htmlFor="register-password">
                  Password
                </label>

                <div className="field-control">
                  <i className="bi bi-lock" />

                  <input
                    id="register-password"
                    type="password"
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="role">Your role</label>

                <div className="field-control select-control">
                  <i className="bi bi-person-badge" />

                  <select
                    id="role"
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as Role)
                    }
                  >
                    <option value="developer">
                      Developer
                    </option>

                    <option value="tester">
                      Tester
                    </option>
                  </select>

                  <i className="bi bi-chevron-down select-arrow" />
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
                    <span>Creating account...</span>
                    <span className="button-spinner" />
                  </>
                ) : (
                  <>
                    <span>Create your account</span>
                    <i className="bi bi-arrow-right" />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>ALREADY HAVE AN ACCOUNT?</span>
            </div>

            <Link href="/login" className="outline-auth-button">
              <span>Sign in instead</span>
              <i className="bi bi-arrow-right" />
            </Link>

            <div className="auth-card-footer">
              <i className="bi bi-shield-check" />

              <span>
                Your account is protected by Firebase Authentication
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