/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Seed colors with proper opacity support
        forest: {
          DEFAULT: '#537D5D',
          50: '#E8F0EA',
          100: '#D1E1D4',
          200: '#B9D2BD',
          300: '#A2C3A7',
          400: '#8AB490',
          500: '#73A579',
          600: '#537D5D',
          700: '#465B4E',
          800: '#39493F',
          900: '#2C3730'
        },
        olive: {
          DEFAULT: '#73946B',
          50: '#EAEDE8',
          100: '#D5DCD1',
          200: '#C0CABA',
          300: '#ABB8A3',
          400: '#96A68C',
          500: '#819475',
          600: '#73946B',
          700: '#627A5A',
          800: '#516049',
          900: '#404638'
        },
        sage: {
          DEFAULT: '#9EBC8A',
          50: '#F1F5ED',
          100: '#E3EBDB',
          200: '#D5E1C9',
          300: '#C7D7B7',
          400: '#B9CDA5',
          500: '#ABC393',
          600: '#9EBC8A',
          700: '#8BA974',
          800: '#78965E',
          900: '#658348'
        },
        sand: {
          DEFAULT: '#D2D0A0',
          50: '#FAFAF4',
          100: '#F5F5E9',
          200: '#F0F0DE',
          300: '#EBEBD3',
          400: '#E6E6C8',
          500: '#E1E1BD',
          600: '#D2D0A0',
          700: '#C7C58A',
          800: '#BCBA74',
          900: '#B1AF5E'
        },
        // Light mode
        'light-bg': '#F9FAF7',
        'light-text': '#1E1E1E',
        'light-border': '#E0E0E0',
        // Dark mode
        'dark-bg': '#1A1D1A',
        'dark-text': '#E7EAE7',
        'dark-muted': '#2C2F2C',
        'dark-border': '#3D403D',
      },
      animation: {
        'bounce-slow': 'bounce 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s linear infinite',
        'bounce-in': 'bounceIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        bounceIn: {
          '0%, 20%, 40%, 60%, 80%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' }
        }
      },
    },
  },
  safelist: [
    'bg-light-bg',
    'bg-dark-bg',
    'text-light-text',
    'text-dark-text',
    'border-light-border',
    'border-dark-border',
    'bg-dark-muted'
  ],
  plugins: [],
}
