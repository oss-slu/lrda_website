import { createFileRoute } from '@tanstack/react-router';
import WelcomePage from '@/components/WelcomePage';
import AboutPage from '@/components/home/about_section';

export const Route = createFileRoute('/_public/')({
  head: () => ({
    meta: [{ title: "Where's Religion?" }],
    links: [{ rel: 'preload', href: '/splash.webp', as: 'image' }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <WelcomePage />
      <AboutPage />
    </>
  );
}
