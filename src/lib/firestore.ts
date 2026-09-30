import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { auth, db } from './firebase';

import type {
  Profile,
  Project,
  Role,
  Task,
  Ticket,
  Update,
} from './types';

/* =========================================================
   DATABASE
========================================================= */

export function requireDb() {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Create .env.local from .env.example.',
    );
  }

  return db;
}

/* =========================================================
   CURRENT USER / ROLE
========================================================= */

function requireAuthUser() {
  if (!auth?.currentUser) {
    throw new Error('You must be logged in.');
  }

  return auth.currentUser;
}

export async function getProfile(uid: string) {
  const snap = await getDoc(
    doc(requireDb(), 'users', uid),
  );

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as Profile;
}

export async function getCurrentProfile() {
  const user = requireAuthUser();

  return getProfile(user.uid);
}

async function getCurrentRole(): Promise<{
  uid: string;
  profile: Profile;
  role: Role;
}> {
  const user = requireAuthUser();

  const profile = await getProfile(user.uid);

  if (!profile) {
    throw new Error(
      'Your account profile has not been created yet.',
    );
  }

  return {
    uid: user.uid,
    profile,
    role: profile.role,
  };
}

/* =========================================================
   PROFILES / USERS
========================================================= */

export async function saveProfile(profile: Profile) {
  await setDoc(
    doc(requireDb(), 'users', profile.uid),
    profile,
    {
      merge: true,
    },
  );
}

/**
 * Admin pages and team management use this.
 *
 * The Firestore rules allow authenticated staff to read
 * profiles because testers need developer names when
 * assigning QA tickets.
 */
export async function listUsers() {
  const snap = await getDocs(
    collection(requireDb(), 'users'),
  );

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as (Profile & { id: string })[];
}

/**
 * Return developers/admins that can receive tickets.
 */
export async function listDevelopers() {
  const users = await listUsers();

  return users.filter(
    (user) =>
      user.role === 'developer' ||
      user.role === 'admin',
  );
}

/**
 * Return testers that can be assigned to projects.
 */
export async function listTesters() {
  const users = await listUsers();

  return users.filter(
    (user) => user.role === 'tester',
  );
}

/* =========================================================
   PROJECTS
========================================================= */

/**
 * Role-aware project list.
 *
 * ADMIN:
 *   All projects.
 *
 * DEVELOPER:
 *   Projects owned by the developer.
 *
 * TESTER:
 *   Projects where testerIds contains their UID.
 */
export async function listProjectsForUser(
  uid: string,
  role: Role,
) {
  const firestore = requireDb();

  if (role === 'admin') {
    const snap = await getDocs(
      collection(firestore, 'projects'),
    );

    return snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Project[];
  }

  if (role === 'developer') {
    const projectQuery = query(
      collection(firestore, 'projects'),
      where('ownerId', '==', uid),
    );

    const snap = await getDocs(projectQuery);

    return snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Project[];
  }

  const projectQuery = query(
    collection(firestore, 'projects'),
    where('testerIds', 'array-contains', uid),
  );

  const snap = await getDocs(projectQuery);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Project[];
}

/**
 * Main project helper used by pages.
 */
export async function listProjects() {
  const { uid, role } = await getCurrentRole();

  return listProjectsForUser(uid, role);
}

/* =========================================================
   SINGLE PROJECT
========================================================= */

export async function getProject(id: string) {
  const snap = await getDoc(
    doc(requireDb(), 'projects', id),
  );

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data(),
  } as Project;
}

/* =========================================================
   TASKS
========================================================= */

export async function listTasksForUser(
  uid: string,
  role: Role,
) {
  const firestore = requireDb();

  if (role === 'admin') {
    const snap = await getDocs(
      collection(firestore, 'tasks'),
    );

    return snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Task[];
  }

  const taskQuery = query(
    collection(firestore, 'tasks'),
    where('assigneeId', '==', uid),
  );

  const snap = await getDocs(taskQuery);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Task[];
}

export async function listTasks() {
  const { uid, role } = await getCurrentRole();

  return listTasksForUser(uid, role);
}

/* =========================================================
   TICKETS
========================================================= */

/**
 * ADMIN:
 *   Every ticket.
 *
 * DEVELOPER:
 *   Tickets assigned to them.
 *
 * TESTER:
 *   Tickets raised by them.
 */
export async function listTicketsForUser(
  uid: string,
  role: Role,
) {
  const firestore = requireDb();

  if (role === 'admin') {
    const snap = await getDocs(
      collection(firestore, 'tickets'),
    );

    return snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Ticket[];
  }

  if (role === 'developer') {
    const ticketQuery = query(
      collection(firestore, 'tickets'),
      where('developerId', '==', uid),
    );

    const snap = await getDocs(ticketQuery);

    return snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Ticket[];
  }

  const ticketQuery = query(
    collection(firestore, 'tickets'),
    where('testerId', '==', uid),
  );

  const snap = await getDocs(ticketQuery);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Ticket[];
}

export async function listTickets() {
  const { uid, role } = await getCurrentRole();

  return listTicketsForUser(uid, role);
}

/* =========================================================
   SINGLE TICKET
========================================================= */

export async function getTicket(id: string) {
  const snap = await getDoc(
    doc(requireDb(), 'tickets', id),
  );

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data(),
  } as Ticket;
}

/* =========================================================
   UPDATES
========================================================= */

export async function listUpdatesForUser(
  uid: string,
  role: Role,
) {
  const firestore = requireDb();

  if (role === 'admin') {
    const snap = await getDocs(
      collection(firestore, 'updates'),
    );

    return snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Update[];
  }

  const updateQuery = query(
    collection(firestore, 'updates'),
    where('authorId', '==', uid),
  );

  const snap = await getDocs(updateQuery);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Update[];
}

export async function listUpdates() {
  const { uid, role } = await getCurrentRole();

  return listUpdatesForUser(uid, role);
}

/* =========================================================
   CREATE PROJECT
========================================================= */

export async function createProject(
  data: Omit<Project, 'id' | 'createdAt'>,
) {
  const { uid, role } = await getCurrentRole();

  if (role !== 'admin' && data.ownerId !== uid) {
    throw new Error(
      'You can only create a project that you own.',
    );
  }

  const ref = await addDoc(
    collection(requireDb(), 'projects'),
    {
      ...data,

      testerIds: data.testerIds ?? [],

      createdAt: serverTimestamp(),
    },
  );

  return ref.id;
}

/* =========================================================
   UPDATE PROJECT
========================================================= */

export async function updateProject(
  id: string,
  data: Partial<Project>,
) {
  await updateDoc(
    doc(requireDb(), 'projects', id),
    data,
  );
}

/* =========================================================
   DELETE PROJECT
========================================================= */

export async function deleteProject(id: string) {
  await deleteDoc(
    doc(requireDb(), 'projects', id),
  );
}

/* =========================================================
   CREATE TASK
========================================================= */

export async function createTask(
  data: Omit<Task, 'id' | 'createdAt'>,
) {
  const ref = await addDoc(
    collection(requireDb(), 'tasks'),
    {
      ...data,
      createdAt: serverTimestamp(),
    },
  );

  return ref.id;
}

/* =========================================================
   CREATE UPDATE
========================================================= */

export async function createUpdate(
  data: Omit<Update, 'id' | 'createdAt'>,
) {
  const ref = await addDoc(
    collection(requireDb(), 'updates'),
    {
      ...data,
      createdAt: serverTimestamp(),
    },
  );

  return ref.id;
}

/* =========================================================
   CREATE TICKET
========================================================= */

export async function createTicket(
  data: Omit<Ticket, 'id' | 'createdAt'>,
) {
  const { uid, role } = await getCurrentRole();

  /**
   * Testers can only create tickets for themselves.
   */
  if (
    role === 'tester' &&
    data.testerId !== uid
  ) {
    throw new Error(
      'A tester can only create tickets under their own account.',
    );
  }

  /**
   * Developers are not allowed to create QA tickets
   * through the client workflow.
   */
  if (role === 'developer') {
    throw new Error(
      'Developers cannot raise QA tickets.',
    );
  }

  const ref = await addDoc(
    collection(requireDb(), 'tickets'),
    {
      ...data,
      createdAt: serverTimestamp(),
    },
  );

  return ref.id;
}

/* =========================================================
   UPDATE TICKET
========================================================= */

export async function updateTicket(
  id: string,
  data: Partial<Ticket>,
) {
  await updateDoc(
    doc(requireDb(), 'tickets', id),
    data,
  );
}

/* =========================================================
   ACTIVITY
========================================================= */

export async function listActivities() {
  const { role } = await getCurrentRole();

  const firestore = requireDb();

  if (role === 'admin') {
    const snap = await getDocs(
      collection(firestore, 'activities'),
    );

    return snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  }

  const { uid } = await getCurrentRole();

  const activityQuery = query(
    collection(firestore, 'activities'),
    where('actorId', '==', uid),
  );

  const snap = await getDocs(activityQuery);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}