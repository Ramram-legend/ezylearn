/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        brand: {
          primary: 'var(--brand-primary)',
          gamification: 'var(--brand-gamification)',
          error: 'var(--brand-error)',
          // Backward compatibility mappings
          blue: 'var(--brand-primary)',
          green: 'var(--brand-gamification)',
          yellow: '#F59E0B',
          'blue-hover': 'var(--brand-primary)',
          'blue-light': 'var(--brand-primary)',
          violet: 'var(--brand-gamification)',
          'violet-light': 'var(--brand-gamification)',
          emerald: 'var(--brand-gamification)',
          amber: '#F59E0B',
          rose: 'var(--brand-error)',
          base: 'var(--background)',
          surface: 'var(--card)',
          deeper: 'var(--background)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'float': 'float 6s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'glow': 'glow 2s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate',
        'shimmer': 'shimmer 2.5s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(37, 99, 235, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(37, 99, 235, 0.5)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
    },
  },
  plugins: [],
};
