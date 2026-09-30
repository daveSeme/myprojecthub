'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';

function roleLabel(role?: string) {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'tester':
      return 'QA Tester';
    case 'developer':
      return 'Developer';
    default:
      return 'Team Member';
  }
}

function roleDescription(role?: string) {
  switch (role) {
    case 'admin':
      return 'Full workspace access and team management.';
    case 'tester':
      return 'Quality assurance, testing and ticket verification.';
    case 'developer':
      return 'Software development, projects and assigned work.';
    default:
      return 'Project Hub workspace member.';
  }
}

function roleIcon(role?: string) {
  switch (role) {
    case 'admin':
      return 'bi-shield-check';
    case 'tester':
      return 'bi-bug';
    case 'developer':
      return 'bi-code-slash';
    default:
      return 'bi-person';
  }
}

export default function ProfilePage() {
  const { profile, user } = useAuth();

  if (!profile) {
    return (
      <AppShell>
        <div className="profile-loading">
          <div className="spinner-border" role="status" />
          <span>Loading profile...</span>
        </div>
      </AppShell>
    );
  }

  const name = profile.name || 'User';
  const email = profile.email || user?.email || 'No email available';
  const initial = name.charAt(0).toUpperCase();

  return (
    <AppShell>
      <div className="profile-page">

        {/* Header */}
        <div className="profile-page-header">
          <div>
            <div className="profile-eyebrow">
              ACCOUNT
            </div>

            <h2 className="profile-title">
              My Profile
            </h2>

            <p className="profile-subtitle">
              Manage your Project Hub account information and workspace identity.
            </p>
          </div>
        </div>

        {/* Profile Hero */}
        <section className="profile-hero cardx">
          <div className="profile-hero-left">

            <div className="profile-avatar-large">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={name}
                />
              ) : (
                initial
              )}
            </div>

            <div className="profile-hero-info">
              <div className="profile-name-row">
                <h3>{name}</h3>

                <span className="profile-status">
                  <span className="profile-status-dot" />
                  Active
                </span>
              </div>

              <p className="profile-email">
                {email}
              </p>

              <div className="profile-role">
                <span className="profile-role-icon">
                  <i className={`bi ${roleIcon(profile.role)}`} />
                </span>

                <div>
                  <strong>{roleLabel(profile.role)}</strong>

                  <small>
                    {roleDescription(profile.role)}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-hero-right">
            <span className="profile-account-label">
              ACCOUNT
            </span>

            <strong>
              Project Hub
            </strong>

            <small>
              Workspace member
            </small>
          </div>
        </section>

        {/* Information */}
        <div className="row g-4 mt-1">

          {/* Personal Information */}
          <div className="col-lg-7">
            <section className="cardx profile-section">

              <div className="profile-section-header">
                <div className="profile-section-icon">
                  <i className="bi bi-person" />
                </div>

                <div>
                  <h4>Personal Information</h4>
                  <p>
                    Your basic account details.
                  </p>
                </div>
              </div>

              <div className="profile-fields">

                <div className="profile-field">
                  <span className="profile-field-label">
                    Full name
                  </span>

                  <div className="profile-field-value">
                    <i className="bi bi-person" />
                    <strong>{name}</strong>
                  </div>
                </div>

                <div className="profile-field">
                  <span className="profile-field-label">
                    Email address
                  </span>

                  <div className="profile-field-value">
                    <i className="bi bi-envelope" />
                    <strong>{email}</strong>
                  </div>
                </div>

                <div className="profile-field">
                  <span className="profile-field-label">
                    Role
                  </span>

                  <div className="profile-field-value">
                    <i className={`bi ${roleIcon(profile.role)}`} />

                    <span className="profile-role-badge">
                      {roleLabel(profile.role)}
                    </span>
                  </div>
                </div>

              </div>
            </section>
          </div>

          {/* Workspace Role */}
          <div className="col-lg-5">
            <section className="cardx profile-section">

              <div className="profile-section-header">
                <div className="profile-section-icon">
                  <i className="bi bi-briefcase" />
                </div>

                <div>
                  <h4>Workspace Role</h4>
                  <p>
                    Your access within Project Hub.
                  </p>
                </div>
              </div>

              <div className="workspace-role-card">

                <div className="workspace-role-top">
                  <div className="workspace-role-icon">
                    <i className={`bi ${roleIcon(profile.role)}`} />
                  </div>

                  <div>
                    <strong>
                      {roleLabel(profile.role)}
                    </strong>

                    <span>
                      Project Hub
                    </span>
                  </div>
                </div>

                <p>
                  {roleDescription(profile.role)}
                </p>

                <div className="workspace-role-divider" />

                <div className="workspace-access">

                  <span>
                    <i className="bi bi-check-circle-fill" />
                    Role-based workspace
                  </span>

                  <span>
                    <i className="bi bi-check-circle-fill" />
                    Secure Firebase access
                  </span>

                  <span>
                    <i className="bi bi-check-circle-fill" />
                    Personalized dashboard
                  </span>

                </div>
              </div>
            </section>
          </div>

        </div>

        {/* Account Information */}
        <section className="cardx profile-section profile-account-section">

          <div className="profile-section-header">
            <div className="profile-section-icon">
              <i className="bi bi-shield-lock" />
            </div>

            <div>
              <h4>Account Information</h4>
              <p>
                Technical information associated with your account.
              </p>
            </div>
          </div>

          <div className="row g-4">

            <div className="col-md-6">
              <div className="account-info-item">
                <span>Firebase User ID</span>

                <strong className="account-id">
                  {profile.uid}
                </strong>
              </div>
            </div>

            <div className="col-md-6">
              <div className="account-info-item">
                <span>Authentication</span>

                <strong>
                  <i className="bi bi-check-circle-fill me-2" />
                  Firebase Authentication
                </strong>
              </div>
            </div>

            <div className="col-md-6">
              <div className="account-info-item">
                <span>Workspace</span>

                <strong>
                  My Project Hub
                </strong>
              </div>
            </div>

            <div className="col-md-6">
              <div className="account-info-item">
                <span>Account status</span>

                <strong className="account-active">
                  <span />
                  Active
                </strong>
              </div>
            </div>

          </div>
        </section>

        {/* Security Notice */}
        <div className="profile-security-notice">

          <div className="profile-security-icon">
            <i className="bi bi-shield-check" />
          </div>

          <div>
            <strong>
              Your account is protected
            </strong>

            <p>
              Project Hub uses Firebase Authentication and role-based
              Firestore security rules to control access to workspace data.
            </p>
          </div>

        </div>

        <style jsx>{`
          .profile-page {
            max-width: 1200px;
            margin: 0 auto;
          }

          .profile-page-header {
            margin-bottom: 24px;
          }

          .profile-eyebrow {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1.8px;
            color: var(--muted);
            margin-bottom: 7px;
          }

          .profile-title {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.7px;
            margin: 0;
          }

          .profile-subtitle {
            margin: 7px 0 0;
            color: var(--muted);
            font-size: 14px;
          }

          .profile-hero {
            min-height: 190px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 28px;
            margin-bottom: 24px;
            overflow: hidden;
            position: relative;
          }

          .profile-hero:after {
            content: '';
            position: absolute;
            width: 240px;
            height: 240px;
            border-radius: 50%;
            background: rgba(200, 169, 110, 0.08);
            right: -80px;
            top: -80px;
            pointer-events: none;
          }

          .profile-hero-left {
            display: flex;
            align-items: center;
            gap: 22px;
            min-width: 0;
          }

          .profile-avatar-large {
            width: 108px;
            height: 108px;
            min-width: 108px;
            border-radius: 50%;
            background: var(--ink);
            color: var(--gold);
            display: grid;
            place-items: center;
            font-size: 42px;
            font-weight: 800;
            border: 5px solid #f2eee5;
            overflow: hidden;
          }

          .profile-avatar-large img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .profile-hero-info {
            min-width: 0;
          }

          .profile-name-row {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .profile-name-row h3 {
            font-size: 25px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -0.5px;
          }

          .profile-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 9px;
            border-radius: 20px;
            background: #f1f5ef;
            color: #53614e;
            font-size: 11px;
            font-weight: 700;
          }

          .profile-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #657b5e;
          }

          .profile-email {
            color: var(--muted);
            font-size: 14px;
            margin: 5px 0 15px;
          }

          .profile-role {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .profile-role-icon {
            width: 34px;
            height: 34px;
            border-radius: 9px;
            display: grid;
            place-items: center;
            background: #f4efe5;
            color: #7e6537;
          }

          .profile-role div {
            display: flex;
            flex-direction: column;
          }

          .profile-role strong {
            font-size: 13px;
          }

          .profile-role small {
            color: var(--muted);
            font-size: 11px;
            margin-top: 2px;
          }

          .profile-hero-right {
            text-align: right;
            position: relative;
            z-index: 1;
            padding-right: 10px;
          }

          .profile-account-label {
            display: block;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1.4px;
            color: var(--muted);
            margin-bottom: 5px;
          }

          .profile-hero-right strong {
            display: block;
            font-size: 15px;
          }

          .profile-hero-right small {
            color: var(--muted);
            font-size: 11px;
          }

          .profile-section {
            height: 100%;
          }

          .profile-section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
          }

          .profile-section-icon {
            width: 40px;
            height: 40px;
            min-width: 40px;
            border-radius: 10px;
            background: #f4f1ea;
            color: #6e5a35;
            display: grid;
            place-items: center;
            font-size: 17px;
          }

          .profile-section-header h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 800;
          }

          .profile-section-header p {
            margin: 3px 0 0;
            color: var(--muted);
            font-size: 11px;
          }

          .profile-fields {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .profile-field {
            padding-bottom: 17px;
            border-bottom: 1px solid var(--line);
          }

          .profile-field:last-child {
            border-bottom: 0;
            padding-bottom: 0;
          }

          .profile-field-label {
            display: block;
            color: var(--muted);
            font-size: 11px;
            margin-bottom: 7px;
          }

          .profile-field-value {
            display: flex;
            align-items: center;
            gap: 9px;
            font-size: 13px;
          }

          .profile-field-value > i {
            color: #99938a;
            font-size: 14px;
          }

          .profile-role-badge {
            background: #f1eee7;
            color: #514c43;
            padding: 6px 10px;
            border-radius: 7px;
            font-size: 11px;
            font-weight: 700;
          }

          .workspace-role-card {
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 16px;
            background: #fcfbf8;
          }

          .workspace-role-top {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .workspace-role-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            background: var(--ink);
            color: var(--gold);
            display: grid;
            place-items: center;
            font-size: 17px;
          }

          .workspace-role-top div:last-child {
            display: flex;
            flex-direction: column;
          }

          .workspace-role-top strong {
            font-size: 14px;
          }

          .workspace-role-top span {
            color: var(--muted);
            font-size: 11px;
            margin-top: 2px;
          }

          .workspace-role-card > p {
            color: var(--muted);
            font-size: 12px;
            line-height: 1.6;
            margin: 16px 0;
          }

          .workspace-role-divider {
            height: 1px;
            background: var(--line);
            margin: 0 0 14px;
          }

          .workspace-access {
            display: flex;
            flex-direction: column;
            gap: 9px;
          }

          .workspace-access span {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #5c584f;
            font-size: 11px;
          }

          .workspace-access i {
            color: #8b7751;
          }

          .profile-account-section {
            margin-top: 24px;
          }

          .account-info-item {
            padding: 14px 16px;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: #fcfbf8;
            min-height: 74px;
          }

          .account-info-item span {
            display: block;
            color: var(--muted);
            font-size: 10px;
            margin-bottom: 7px;
          }

          .account-info-item strong {
            font-size: 12px;
            word-break: break-word;
          }

          .account-id {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 10px !important;
            color: #5d5952;
          }

          .account-active {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #53614e;
          }

          .account-active span {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #657b5e;
            margin: 0;
          }

          .profile-security-notice {
            margin-top: 20px;
            padding: 16px 18px;
            border: 1px solid var(--line);
            border-radius: 12px;
            background: #faf8f3;
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }

          .profile-security-icon {
            width: 34px;
            height: 34px;
            min-width: 34px;
            border-radius: 9px;
            background: #eee9dd;
            color: #74613d;
            display: grid;
            place-items: center;
          }

          .profile-security-notice strong {
            display: block;
            font-size: 12px;
            margin-bottom: 3px;
          }

          .profile-security-notice p {
            margin: 0;
            color: var(--muted);
            font-size: 11px;
            line-height: 1.55;
          }

          .profile-loading {
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            color: var(--muted);
            font-size: 13px;
          }

          @media (max-width: 768px) {
            .profile-hero {
              align-items: flex-start;
              padding: 22px;
            }

            .profile-hero-left {
              gap: 15px;
            }

            .profile-avatar-large {
              width: 78px;
              height: 78px;
              min-width: 78px;
              font-size: 30px;
            }

            .profile-name-row h3 {
              font-size: 20px;
            }

            .profile-hero-right {
              display: none;
            }
          }

          @media (max-width: 480px) {
            .profile-hero-left {
              align-items: flex-start;
            }

            .profile-name-row {
              display: block;
            }

            .profile-status {
              margin-top: 7px;
            }

            .profile-subtitle {
              line-height: 1.5;
            }
          }
        `}</style>

      </div>
    </AppShell>
  );
}