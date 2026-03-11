import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { isAdminUser } from '@/app/lib/stores/authHelpers'
import type { AdminUserData, PendingApplication, AdminStats } from '@/app/lib/services'
import AdminDashboard from '@/app/admin/AdminDashboard'

const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

interface AdminData {
  user: Record<string, any>
  stats: AdminStats | null
  users: AdminUserData[] | null
  applications: PendingApplication[] | null
}

const fetchAdminData = createServerFn().handler(async (): Promise<AdminData | null> => {
  const headers = getRequestHeaders()
  const cookieHeader = headers.get ? headers.get('cookie') : (headers as any).cookie
  if (!cookieHeader) return null

  const fetchWithCookies = async <T,>(path: string): Promise<T | null> => {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        headers: { cookie: cookieHeader, 'Content-Type': 'application/json' },
      })
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  }

  const [user, stats, users, applications] = await Promise.all([
    fetchWithCookies<Record<string, any>>('/api/users/me'),
    fetchWithCookies<AdminStats>('/api/admin/stats'),
    fetchWithCookies<AdminUserData[]>('/api/admin/users'),
    fetchWithCookies<PendingApplication[]>('/api/admin/pending-instructors'),
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
