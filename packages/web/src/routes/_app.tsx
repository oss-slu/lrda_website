import { createFileRoute, Outlet } from '@tanstack/react-router';
import Navbar from '@/components/navbar';

export const Route = createFileRoute('/_app')({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className='flex h-screen flex-col overflow-hidden'>
      <Navbar />
      <div className='flex-1 overflow-auto'>
        <Outlet />
      </div>
    </div>
  );
}
