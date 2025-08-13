import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // GT Brand Colors - Primary Palette
        'gt-navy': {
          DEFAULT: '#003057',
          50: '#E6F2FF',
          100: '#CCE5FF',
          200: '#99CCFF',
          300: '#66B2FF',
          400: '#3399FF',
          500: '#0080FF',
          600: '#0066CC',
          700: '#004C99',
          800: '#003366',
          900: '#001A33',
          950: '#003057',
        },
        'gt-gold': {
          DEFAULT: '#B3A369',
          50: '#F7F5F0',
          100: '#EFEBE1',
          200: '#E0D7C3',
          300: '#D0C3A5',
          400: '#C1AF87',
          500: '#B3A369',
          600: '#A08954',
          700: '#8D7740',
          800: '#6B5A30',
          900: '#4A3E21',
          950: '#2F2715',
        },
        // Extended GT Color Palette
        'gt-tech-gold': {
          DEFAULT: '#EAAA00',
          50: '#FFF8E1',
          100: '#FFF0C4',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#EAAA00',
          600: '#D4A500',
          700: '#B8A000',
          800: '#9C8B00',
          900: '#7A6B00',
        },
      },
      backgroundImage: {
        'gt-gradient': 'linear-gradient(135deg, #003057 0%, #B3A369 100%)',
        'gt-gradient-horizontal': 'linear-gradient(90deg, #003057 0%, #B3A369 100%)',
        'gt-gradient-vertical': 'linear-gradient(180deg, #003057 0%, #B3A369 100%)',
        'gt-gradient-radial': 'radial-gradient(circle, #003057 0%, #B3A369 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            'animation-timing-function': 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            'animation-timing-function': 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;