/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false, // SWC minification is disabled for now

  images: {
    domains: ["livedreligion.s3.amazonaws.com"], // Allow images from specific domains
  },

  webpack: (config, { isServer }) => {
    // Rule to handle both .js and .mjs files in node_modules and elsewhere
    config.module.rules.push({
      test: /\.m?js$/,  // Handle both .js and .mjs files
      exclude: /node_modules/,  // Exclude node_modules except special cases
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],  // Use the built-in Next.js Babel preset
        },
      },
    });

    // Handle mjs in node_modules specifically for compatibility issues
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules/,  // Include node_modules as some may have .mjs files
      type: "javascript/auto",  // Use auto mode for module types
    });

    // Add CSS loader to handle intro.js or any other third-party CSS
    config.module.rules.push({
      test: /\.css$/,  // Match all CSS files
      use: ['style-loader', 'css-loader'],  // Use style-loader and css-loader
    });

    return config;
  },

  async rewrites() {
    return [
      {
        source: '/api/generateTags',  // Custom rewrite for API route
        destination: '/api_service/generateTags',  // Map to the appropriate service
      },
    ];
  },
};

module.exports = nextConfig;