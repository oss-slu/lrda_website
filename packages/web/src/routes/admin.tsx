import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { fetchFromAPI } from '@/app/lib/auth/server'
import { isAdminUser } from '@/app/lib/stores/authHelpers'
import type { AdminUserData, PendingApplication, AdminStats } from '@/app/lib/services'
import type { UserProfile } from '@/app/types'
import AdminDashboard from '@/app/admin/AdminDashboard'

interface AdminData {
  user: UserProfile
  stats: AdminStats | null
  users: AdminUserData[] | null
  applications: PendingApplication[] | null
}

const fetchAdminData = createServerFn().handler(async (): Promise<AdminData | null> => {
  const [user, stats, users, applications] = await Promise.all([
    fetchFromAPI<UserProfile>('/api/users/me'),
    fetchFromAPI<AdminStats>('/api/admin/stats'),
    fetchFromAPI<AdminUserData[]>('/api/admin/users'),
    fetchFromAPI<PendingApplication[]>('/api/admin/pending-instructors'),
  ])

  if (!user) return null

  return { user, stats, users, applications }
})

export const Route = createFileRoute('/admin')({
  loader: async () => {
    const data = await fetchAdminData()
    if (!data?.user || !isAdminUser(data.user)) {
      throw redirect({ to: '/' })
    }
    return data
  },
  component: AdminPage,
})

function AdminPage() {
  const { stats, users, applications } = Route.useLoaderData()
  return (
    <AdminDashboard
      initialStats={stats}
      initialUsers={users ?? []}
      initialApplications={applications ?? []}
    />
  )
}
