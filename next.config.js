/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["livedreligion.s3.amazonaws.com"],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.m?js$/, // Handle both .js and .mjs files
      exclude: /node_modules/, // Exclude node_modules
      use: {
        loader: "babel-loader",
        options: {
          presets: ["next/babel"], // Use the built-in Next.js Babel preset
        },
      },
    });

    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules/, // Specifically include the node_modules directory
      type: "javascript/auto", // Use auto mode for module types
    });

    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/generateTags",
        destination: "/api_service/generateTags",
      },
    ];
  },
};

module.exports = nextConfig;
