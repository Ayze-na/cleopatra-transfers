/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-0': '#18212D',
        'bg-1': '#0F1528',
        'bg-2': '#16264A',
        gold: {
          300: '#E6C875',
          500: '#C9A24B',
          700: '#A8812F',
          DEFAULT: '#C9A24B',
          light: '#E6C875',
          dark: '#A8812F',
        },
        ivory: {
          DEFAULT: '#F5F1E6',
          70: 'rgba(245,241,230,0.70)',
          45: 'rgba(245,241,230,0.45)',
        },
        pharaoh: {
          bg: '#18212D',
          blue: '#16264A',
          ivory: '#F5F1E6',
        },
        'sky-soft': '#8FA3C7',
        line: 'rgba(201,162,75,0.25)',
        'line-strong': 'rgba(201,162,75,0.60)',
        success: '#5FB48C',
        warning: '#E0A93B',
        danger: '#E5645A',
      },
      fontFamily: {
        'cinzel-decorative': ['var(--font-cinzel-decorative)', 'serif'],
        cinzel: ['var(--font-cinzel)', 'serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        cairo: ['var(--font-cairo)', 'sans-serif'],
        'playfair': ['var(--font-playfair)', 'serif'],
      },
      maxWidth: {
        container: '1240px',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      transitionDuration: {
        fast: '200ms',
        base: '400ms',
        slow: '800ms',
        cinematic: '1200ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.76, 0, 0.24, 1)',
      },
    },
  },
  plugins: [],
};