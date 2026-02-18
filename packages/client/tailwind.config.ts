import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wraith: {
          50: '#f0f0f5',
          100: '#d9d9e6',
          200: '#b3b3cc',
          300: '#8c8cb3',
          400: '#666699',
          500: '#404080',
          600: '#333366',
          700: '#26264d',
          800: '#1a1a33',
          900: '#0d0d1a',
          950: '#06060d',
        },
        pathos: '#8b5cf6',
        corpus: '#dc2626',
        willpower: '#3b82f6',
        angst: '#f59e0b',
        shadow: '#7c3aed',
      },
      fontFamily: {
        gothic: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
