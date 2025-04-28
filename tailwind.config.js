/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: {
          dark: '#050505',
          DEFAULT: '#0A0A0A',
          light: '#121212',
        },
        primary: {
          DEFAULT: '#FF1818',
          dark: '#a00219',
          light: '#e6032e',
        },
        secondary: {
          DEFAULT: '#FF4585',
          dark: '#E03A73',
          light: '#FF6C9E',
        },
        accent: {
          DEFAULT: '#00E5FF',
          dark: '#00B8CC',
          light: '#61EEFF',
        },
        success: {
          DEFAULT: '#00D875',
          dark: '#00A85C',
          light: '#2AEE94',
        },
        warning: {
          DEFAULT: '#FFB800',
          dark: '#E0A200',
          light: '#FFC633',
        },
        error: {
          DEFAULT: '#FF3D3D',
          dark: '#E03535',
          light: '#FF6666',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
      },
      boxShadow: {
        'glow-primary': '0 0 15px 2px rgba(200, 3, 33, 0.3)',
        'glow-secondary': '0 0 15px 2px rgba(255, 69, 133, 0.3)',
        'glow-accent': '0 0 15px 2px rgba(0, 229, 255, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(to bottom right, rgba(10, 10, 10, 0.9), rgba(18, 18, 18, 0.95)), url("https://images.pexels.com/photos/3965548/pexels-photo-3965548.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2")',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        pulse: 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};