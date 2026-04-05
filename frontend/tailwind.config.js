/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"IBM Plex Sans Thai"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        brand: {
          50:  '#fff1f0',
          100: '#ffe0db',
          200: '#ffc7bd',
          300: '#ff9e8f',
          400: '#ff6b55',
          500: '#ff3d22',
          600: '#ed2004',
          700: '#c71503',
          800: '#a41509',
          900: '#87180e',
          950: '#4a0703',
        },
        surface: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a26',
          600: '#22222f',
          500: '#2e2e40',
          400: '#3d3d52',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'count-up': 'countUp 1s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}
