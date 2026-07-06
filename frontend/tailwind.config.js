/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#324DB7',
          dark: '#283D93',
          light: '#4B63C5',
        },
        accent: {
          DEFAULT: '#EC9531',
          dark: '#D97F1E',
          light: '#F5A94A',
        },
        bg: '#F3F4FB',
        surface: '#FFFFFF',
        dark: '#272727',
        status: {
          planning: '#3B82F6',
          active: '#16A34A',
          completed: '#6B7280',
          cancelled: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Assistant', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07)',
        nav: '0 2px 8px 0 rgba(50,77,183,0.15)',
      },
    },
  },
  plugins: [],
};
