module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss': {}, // Tailwind comes after nesting configuration
    'postcss-preset-env': { 
      stage: 1,
      features: { 'nesting-rules': true },
    },
    'autoprefixer': {},
  },
};
