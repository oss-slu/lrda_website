/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'livedreligion.s3.amazonaws.com',
      },
    ],
    unoptimized: true,
  },
  // Next.js 16 uses Turbopack by default, this is legacy
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.m?js$/, // Handle both .js and .mjs files
      exclude: /node_modules/, // Exclude node_modules
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'], // Use the built-in Next.js Babel preset
        },
      },
    });

    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules/, // Specifically include the node_modules directory
      type: 'javascript/auto', // Use auto mode for module types
    });

    return config;
  },
  turbopack: {},
  async rewrites() {
    return [
      {
        source: '/api/generateTags',
        destination: '/api_service/generateTags',
      },
    ];
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
      {
        source: '/lib/pages/InstructorSignupPage',
        destination: '/instructor-signup',
        permanent: true,
      },
      { source: '/lib/pages/StudentDashBoard', destination: '/student-dashboard', permanent: true },
      {
        source: '/lib/pages/AdminToInstructorApplication',
        destination: '/admin-to-instructor',
        permanent: true,
      },
    ];
  },
};
