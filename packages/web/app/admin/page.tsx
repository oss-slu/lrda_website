import { redirect } from 'next/navigation';
import { getServerUser, fetchFromAPI } from '@/app/lib/auth/server';
import { isAdminUser } from '@/app/lib/stores/authHelpers';
import type { AdminUserData, PendingApplication, AdminStats } from '@/app/lib/services';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage() {
  const user = await getServerUser();

  if (!user || !isAdminUser(user)) {
    redirect('/');
  }

  const [stats, users, applications] = await Promise.all([
    fetchFromAPI<AdminStats>('/api/admin/stats'),
    fetchFromAPI<AdminUserData[]>('/api/admin/users'),
    fetchFromAPI<PendingApplication[]>('/api/admin/pending-instructors'),
  ]);

  return (
    <AdminDashboard
      initialStats={stats}
      initialUsers={users ?? []}
      initialApplications={applications ?? []}
    />
  );
}
