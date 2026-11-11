import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#111111',
          soft: '#6b6b6b',
          faint: '#9b9b9b',
        },
        line: {
          DEFAULT: '#e6e6e3',
          strong: '#d4d4cf',
        },
        paper: {
          DEFAULT: '#fafaf8',
          raised: '#ffffff',
        },
      },
      letterSpacing: {
        luxe: '0.22em',
      },
      transitionProperty: {
        luxe: 'color, background-color, border-color, opacity, transform',
      },
    },
  },
  plugins: [],
};

export default config;
