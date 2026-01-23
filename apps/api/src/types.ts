import type { User, Session } from 'better-auth';

// Extended user type with app-specific fields
export type AuthUser = User & {
  role?: string | null;
  isInstructor?: boolean;
  instructorId?: string | null;
  pendingInstructorDescription?: string | null;
};

export type AuthSession = Session;

export type AppEnv = {
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
};
