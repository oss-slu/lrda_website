import { createFileRoute } from '@tanstack/react-router'
import InstructorDashboard from '@/app/instructor-dashboard/InstructorDashboard'

export const Route = createFileRoute('/instructor-dashboard')({
  component: InstructorDashboardPage,
})

function InstructorDashboardPage() {
  return <InstructorDashboard />
}
