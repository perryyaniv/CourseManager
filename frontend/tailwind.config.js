/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8C1C13',
          dark: '#6B1510',
          light: '#A5231A',
        },
        accent: {
          DEFAULT: '#D45A1B',
          dark: '#B34E18',
          light: '#E8841A',
        },
        brand: {
          blue: '#6B9CAD',
          orange: '#D45A1B',
          red: '#8C1C13',
        },
        bg: '#FAFAFA',
        surface: '#FFFFFF',
        status: {
          planning: '#3B82F6',
          active: '#16A34A',
          completed: '#6B7280',
          cancelled: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Heebo', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(0,0,0,0.08)',
        nav: '0 2px 8px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
