import type { User, Session } from 'better-auth';
import type { Database } from './db';

// Extended user type with app-specific fields.
// `role` uses a literal union matching the DB default ('user') and admin plugin ('admin').
// `isInstructor` is non-optional to match the DB column (NOT NULL DEFAULT false).
export type AuthUser = User & {
  role: 'admin' | 'user';
  isInstructor: boolean;
  instructorId?: string | null;
  pendingInstructorDescription?: string | null;
};

export type AuthSession = Session;

export type AppBindings = {
  Bindings: Env;
  Variables: {
    db: Database;
    user: AuthUser | null;
    session: AuthSession | null;
  };
};
