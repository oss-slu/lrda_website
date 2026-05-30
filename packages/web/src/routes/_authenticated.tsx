import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { fetchFromAPI } from '@/app/auth/server';
import type { UserProfile } from '@/app/types';

const getSessionUser = createServerFn().handler(async () => {
  return fetchFromAPI<UserProfile>('/api/users/me');
});

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async () => {
    const user = await getSessionUser();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  component: () => <Outlet />,
});
