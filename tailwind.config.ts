import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:    '#07162F',
        ink:     '#0B1F3A',
        azure:   '#1E8BFF',
        aqua:    '#20D6E8',
        frost:   '#BDEFFF',
        capture: '#FF1E1E',
        page:    '#F7FBFF',
        muted:   '#6C7A8D',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      boxShadow: {
        card:     '0 24px 80px rgba(7, 22, 47, 0.08)',
        'blue-glow': '0 24px 70px rgba(30, 139, 255, 0.18)',
        'red-glow':  '0 18px 40px rgba(255, 30, 30, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
