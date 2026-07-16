/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        scada: {
          bg: '#0f1419',
          panel: '#1a2028',
          panel2: '#222b36',
          border: '#2d3a48',
          borderLight: '#3a4a5c',
          text: '#c8d4e0',
          textDim: '#6b7d8f',
          textBright: '#e8f0f8',
          accent: '#00b8d4',
          green: '#22c55e',
          greenDim: '#16a34a',
          yellow: '#eab308',
          yellowDim: '#ca8a04',
          red: '#ef4444',
          redDim: '#dc2626',
          orange: '#f97316',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-glow-red': 'pulseGlowRed 1.5s ease-in-out infinite',
        'sweep': 'sweep 4s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 4px currentColor)' },
          '50%': { opacity: '0.7', filter: 'drop-shadow(0 0 12px currentColor)' },
        },
        pulseGlowRed: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 6px #ef4444)' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 16px #ef4444)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
