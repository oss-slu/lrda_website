import { createFileRoute, redirect } from '@tanstack/react-router';
import { hasInstructorAccess } from '@/app/lib/stores/authHelpers';
import InstructorDashboard from '@/app/instructor-dashboard/InstructorDashboard';

export const Route = createFileRoute('/_authenticated/instructor-dashboard')({
  head: () => ({
    meta: [{ title: "Instructor Dashboard | Where's Religion?" }],
  }),
  beforeLoad: ({ context }) => {
    if (!hasInstructorAccess(context.user)) {
      throw redirect({ to: '/' });
    }
  },
  component: InstructorDashboardPage,
});

function InstructorDashboardPage() {
  return <InstructorDashboard />;
}
