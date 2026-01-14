module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-nesting': {}, // Add the postcss-nesting plugin here
    tailwindcss: {}, // Tailwind comes after nesting
    'postcss-preset-env': {
      stage: 1,
      features: { 'nesting-rules': false }, // Disable nesting rules in preset-env to avoid conflicts
    },
    autoprefixer: {},
  },
};
