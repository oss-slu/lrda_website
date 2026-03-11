import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'livedreligion.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: '*.githubusercontent.com',
      },
    ],
    qualities: [5, 50, 75],
  },
  serverExternalPackages: [
    'jspdf',
    'docx',
    'file-saver',
    // react-player transitive deps -- loaded via next/dynamic with ssr: false
    // (can't externalize react-player itself due to Turbopack ModuleId bug)
    'hls-video-element',
    'dash-video-element',
    'vimeo-video-element',
    'youtube-video-element',
    'wistia-video-element',
    'spotify-audio-element',
    'twitch-video-element',
    'tiktok-video-element',
    '@mux/mux-player-react',
  ],
  turbopack: {},
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@tanstack/react-query',
      '@/app/lib/services',
      '@/app/lib/components/NoteEditor',
      '@/app/lib/hooks/queries',
      '@/app/lib/auth',
    ],
  },
  async redirects() {
    return [
      { source: '/lib/pages/map', destination: '/map', permanent: true },
      { source: '/lib/pages/notes', destination: '/notes', permanent: true },
      { source: '/lib/pages/loginPage', destination: '/login', permanent: true },
      { source: '/lib/pages/signupPage', destination: '/signup', permanent: true },
      { source: '/lib/pages/StoriesPage', destination: '/stories', permanent: true },
      { source: '/lib/pages/ResourcesPage', destination: '/resources', permanent: true },
      { source: '/lib/pages/ForgotPassword', destination: '/forgot-password', permanent: true },
      { source: '/lib/pages/adminPanel', destination: '/admin', permanent: true },
      { source: '/lib/pages/wheres-religion', destination: '/wheres-religion', permanent: true },
      {
        source: '/lib/pages/InstructorDashBoard',
        destination: '/instructor-dashboard',
        permanent: true,
      },
      { source: '/lib/pages/StudentDashBoard', destination: '/student-dashboard', permanent: true },
    ];
  },
};

export default nextConfig;
