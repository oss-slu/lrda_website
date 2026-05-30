import { createFileRoute, redirect } from '@tanstack/react-router';
import { hasInstructorAccess } from '@/app/stores/authHelpers';
import InstructorDashboard from '@/app/instructor-dashboard/InstructorDashboard';

export const Route = createFileRoute('/_authenticated/instructor-dashboard')({
  beforeLoad: ({ context }) => {
    if (!hasInstructorAccess(context.user)) {
      throw redirect({ to: '/' });
    }
  },
  head: () => ({
    meta: [{ title: "Instructor Dashboard | Where's Religion?" }],
  }),
  component: InstructorDashboardPage,
});

function InstructorDashboardPage() {
  return <InstructorDashboard />;
}
