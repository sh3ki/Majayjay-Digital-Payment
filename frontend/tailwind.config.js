/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00873E',
          light: '#E8F5E9',
          dark: '#004D2E',
          accent: '#26A69A',
          50: '#E8F5E9',
          100: '#C8E6C9',
          500: '#00873E',
          600: '#006E33',
          700: '#004D2E',
          900: '#002D1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
