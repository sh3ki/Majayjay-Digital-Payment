/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1565C0',
          light: '#E3F2FD',
          dark: '#0D47A1',
          accent: '#42A5F5',
          50: '#E3F2FD',
          100: '#BBDEFB',
          500: '#1565C0',
          600: '#1255A8',
          700: '#0D47A1',
          900: '#0A2F6E',
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
