import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Where's Religion?",
  description:
    "Documentation for the Where's Religion? platform -- web, mobile, and API.",

  base: '/',
  cleanUrls: true,
  ignoreDeadLinks: [/localhost/],

  themeConfig: {
    siteTitle: "Where's Religion? Docs",

    nav: [
      { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
      {
        text: 'Architecture',
        link: '/architecture/overview',
        activeMatch: '/architecture/',
      },
      { text: 'API Reference', link: '/api/overview', activeMatch: '/api/' },
      {
        text: 'Mobile',
        link: '/mobile/overview',
        activeMatch: '/mobile/',
      },
      {
        text: 'Contributing',
        link: '/contributing/getting-started',
        activeMatch: '/contributing/',
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Project Structure', link: '/guide/project-structure' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Notes Editor', link: '/guide/notes-editor' },
            { text: 'Map', link: '/guide/map' },
            {
              text: 'Instructor Workflow',
              link: '/guide/instructor-workflow',
            },
          ],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Frontend (Web)', link: '/architecture/frontend' },
            { text: 'Backend (API)', link: '/architecture/backend' },
            { text: 'Database', link: '/architecture/database' },
            { text: 'Authentication', link: '/architecture/authentication' },
            { text: 'Deployment', link: '/architecture/deployment' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/overview' },
            { text: 'Notes', link: '/api/notes' },
            { text: 'Users', link: '/api/users' },
            { text: 'Comments', link: '/api/comments' },
            { text: 'Admin', link: '/api/admin' },
          ],
        },
      ],
      '/mobile/': [
        {
          text: 'Mobile App',
          items: [
            { text: 'Overview', link: '/mobile/overview' },
            { text: 'Setup', link: '/mobile/setup' },
            { text: 'Architecture', link: '/mobile/architecture' },
            { text: 'Screens', link: '/mobile/screens' },
            { text: 'Migration Status', link: '/mobile/migration' },
          ],
        },
      ],
      '/contributing/': [
        {
          text: 'Contributing',
          items: [
            {
              text: 'Getting Started',
              link: '/contributing/getting-started',
            },
            {
              text: 'Development Setup',
              link: '/contributing/development-setup',
            },
            { text: 'Code Style', link: '/contributing/code-style' },
            { text: 'Testing', link: '/contributing/testing' },
            { text: 'Pull Requests', link: '/contributing/pull-requests' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/oss-slu/lrda_website' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern:
        'https://github.com/oss-slu/lrda_website/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Open Source with Students at Saint Louis University',
    },
  },
})
