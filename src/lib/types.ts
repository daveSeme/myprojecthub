export type Role = 'admin' | 'developer' | 'tester';

export type Status =
  | 'planned'
  | 'active'
  | 'on-hold'
  | 'completed';

export type Priority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface Profile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  photoURL?: string;
  createdAt?: unknown;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  client?: string;
  type: string;
  status: Status;
  priority: Priority;
  progress: number;
  deadline?: string;
  technologies: string[];
  repository?: string;

  ownerId: string;
  ownerName?: string;

  /**
   * Users who are allowed to perform QA on this project.
   *
   * This is intentionally an array because a project can
   * have multiple testers.
   */
  testerIds?: string[];

  createdAt?: unknown;
}

export interface Task {
  id: string;
  title: string;
  description: string;

  projectId: string;
  projectName?: string;

  assigneeId: string;
  assigneeName?: string;

  status:
    | 'todo'
    | 'in-progress'
    | 'review'
    | 'done';

  priority: Priority;

  /**
   * Used by the project roadmap.
   */
  phase?: string;

  dueDate?: string;
  createdAt?: unknown;
}

export interface Update {
  id: string;

  projectId: string;
  projectName?: string;

  authorId: string;
  authorName?: string;

  text: string;

  createdAt?: unknown;
}

export interface Ticket {
  id: string;

  title: string;
  description: string;

  projectId: string;
  projectName?: string;

  testerId: string;
  testerName?: string;

  developerId?: string;
  developerName?: string;

  priority: Priority;

  status:
    | 'open'
    | 'in-progress'
    | 'resolved'
    | 'closed'
    | 'verified';

  createdAt?: unknown;

  resolution?: string;
}