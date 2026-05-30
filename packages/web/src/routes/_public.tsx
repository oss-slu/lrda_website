import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';

const FOOTER_PATHS = new Set(['/', '/stories', '/resources', '/wheres-religion']);

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
});

function PublicLayout() {
  const { pathname } = useLocation();

  return (
    <div className='flex h-screen flex-col'>
      <Navbar />
      <main className='flex-1 overflow-y-auto'>
        <Outlet />
        {FOOTER_PATHS.has(pathname) && <Footer />}
      </main>
    </div>
  );
}
