import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { createServerFn } from '@tanstack/react-start';
import { fetchFromAPI } from '@/auth/server';
import { isAdminUser } from '@/stores/authHelpers';
import type {
  AdminUserData,
  PendingApplication,
  AdminStats,
  ContentStats,
  RecentActivityItem,
} from '@/services';
import type { UserProfile } from '@/types';
import AdminDashboard from '@/components/admin/AdminDashboard';

interface AdminData {
  user: UserProfile;
  stats: AdminStats | null;
  users: AdminUserData[] | null;
  applications: PendingApplication[] | null;
  contentStats: ContentStats | null;
  recentActivity: RecentActivityItem[] | null;
}

const fetchAdminData = createServerFn().handler(async (): Promise<AdminData | null> => {
  const [user, stats, users, applications, contentStats, recentActivity] = await Promise.all([
    fetchFromAPI<UserProfile>('/api/users/me'),
    fetchFromAPI<AdminStats>('/api/admin/stats'),
    fetchFromAPI<AdminUserData[]>('/api/admin/users'),
    fetchFromAPI<PendingApplication[]>('/api/admin/pending-instructors'),
    fetchFromAPI<ContentStats>('/api/admin/content-stats'),
    fetchFromAPI<RecentActivityItem[]>('/api/admin/recent-activity'),
  ]);

  if (!user) return null;

  return { user, stats, users, applications, contentStats, recentActivity };
});

const adminSearchSchema = z.object({
  tab: z.string().optional(),
  syncRunId: z.string().optional(),
});

export type AdminSearchParams = z.infer<typeof adminSearchSchema>;

export const Route = createFileRoute('/_app/admin')({
  validateSearch: adminSearchSchema,
  ssr: false,
  loader: async () => {
    const data = await fetchAdminData();
    if (!data?.user || !isAdminUser(data.user)) {
      throw redirect({ to: '/' });
    }
    return data;
  },
  head: () => ({
    meta: [{ title: "Admin | Where's Religion?" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { stats, users, applications, contentStats, recentActivity } = Route.useLoaderData();
  return (
    <AdminDashboard
      initialStats={stats}
      initialUsers={users ?? []}
      initialApplications={applications ?? []}
      initialContentStats={contentStats}
      initialRecentActivity={recentActivity ?? []}
    />
  );
}
