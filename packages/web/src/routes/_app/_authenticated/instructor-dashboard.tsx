import { createFileRoute, redirect } from '@tanstack/react-router';
import { hasInstructorAccess } from '@/stores/authHelpers';
import InstructorDashboard from '@/components/instructor-dashboard/InstructorDashboard';

export const Route = createFileRoute('/_app/_authenticated/instructor-dashboard')({
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
