import type { User, Session } from "better-auth";

export type AuthUser = User;
export type AuthSession = Session;

export type AppEnv = {
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
};
