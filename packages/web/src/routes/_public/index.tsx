import { createFileRoute } from '@tanstack/react-router';
import WelcomePage from '@/components/WelcomePage';
import AboutPage from '@/components/home/about_section';

export const Route = createFileRoute('/_public/')({
  head: () => ({
    meta: [
      { title: "Where's Religion? - Document and Map Lived Religion" },
      {
        name: 'description',
        content:
          'Advancing the study of religion and public life. Document, share, and explore religious sites anywhere with rich text, media, and geolocation.',
      },
      { property: 'og:title', content: "Where's Religion? - Document and Map Lived Religion" },
      {
        property: 'og:description',
        content:
          'Advancing the study of religion and public life. Document, share, and explore religious sites anywhere.',
      },
      { property: 'og:url', content: 'https://wheresreligion.org/' },
      { name: 'twitter:title', content: "Where's Religion? - Document and Map Lived Religion" },
      {
        name: 'twitter:description',
        content:
          'Advancing the study of religion and public life. Document, share, and explore religious sites anywhere.',
      },
    ],
    links: [
      { rel: 'canonical', href: 'https://wheresreligion.org/' },
      { rel: 'preload', href: '/splash.webp', as: 'image' },
    ],
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
