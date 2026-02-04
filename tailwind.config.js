import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        orbit: {
          'color-scheme': 'dark',
          primary: '#D5FF40', // Lime green accent
          'primary-content': '#000000',
          secondary: '#C0C2B8', // Gray
          'secondary-content': '#000000',
          accent: '#D5FF40', // Lime green accent
          'accent-content': '#000000',
          neutral: '#C0C2B8', // Gray
          'neutral-content': '#000000',
          'base-100': '#0a0a0a', // Dark background
          'base-200': '#141414', // Slightly lighter
          'base-300': '#1f1f1f', // Card background
          'base-content': '#ffffff', // White text
          info: '#C0C2B8',
          success: '#D5FF40', // Lime green
          warning: '#D5FF40',
          error: '#ff5555',
          '--rounded-btn': '1rem',
        },
      },
    ],
    darkTheme: 'orbit',
  },
};
