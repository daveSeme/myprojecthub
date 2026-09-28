# My Project Hub — Universal Project Tracker

A universal personal/team tracker built with Next.js, TypeScript, Bootstrap 5, Bootstrap Icons and Firebase Authentication + Firestore.

## Included
- Dashboard with live Firestore counts
- Projects with descriptions/explanations
- Tasks and assignments
- My Work across all projects
- Project updates / work journal
- QA tickets: testers raise tickets for developers
- Team role management for admins
- Email/password registration and login
- Firebase Firestore persistence
- Firestore security rules
- Responsive UI

## 1. Install
```bash
npm install
```

## 2. Create Firebase app
In Firebase Console:
1. Create/select your Firebase project.
2. Enable Authentication → Sign-in method → Email/Password.
3. Create a Firestore Database.
4. Add a Web App and copy its Firebase config.
5. Copy `.env.example` to `.env.local` and fill the values.

## 3. Deploy Firestore rules
If Firebase CLI is installed and you are logged in:
```bash
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules
```
Or paste `firestore.rules` into Firebase Console → Firestore Database → Rules.

## 4. First admin
Registration intentionally offers developer/tester roles. After creating your own account, open Firestore → `users` → your UID and change `role` to `admin`.
Then refresh the app. The Team page will allow you to manage roles.

## 5. Run
```bash
npm run dev
```
Open `http://localhost:3000`.

### Important
Firebase configuration values are not included in this ZIP. That is intentional: never commit private environment configuration into source control. Firebase web API keys are identifiers, but keep the project config in `.env.local` for clean deployment management.
