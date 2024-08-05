/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["livedreligion.s3.amazonaws.com"],
  },
  async rewrites() {
    return [
      {
        source: '/api/generateTags',
        destination: '/api_service/generateTags',
      },
    ];
  },
};

module.exports = nextConfig;
